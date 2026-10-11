/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

import type { RiskLevel, Skill } from "../schema";
import type {
  AgentInstance,
  AgentStatus,
  Fleet,
  FleetAggregate,
  FleetEvent,
  MissionRequest,
} from "./types";
import { AGENT_STATUSES, TERMINAL_STATUSES } from "./types";
import { highestRisk, planFleet } from "./planner";
import { scriptFor, type AgentScript } from "./simulation";

/**
 * The scheduler.
 *
 * One timer advances every running agent, rather than a timer per agent: a
 * 500-agent fleet otherwise means 500 timers competing to wake the process up.
 * Each agent's outcome is decided up front by `scriptFor`, so the ticker only
 * decides *when* a transition becomes visible, never *what* it is.
 */

const TICK_MS = 100;
/** Events are a live feed, not an audit log — the per-agent timeline is on the agent. */
const MAX_EVENTS = 400;
/** Fleets live in process memory, so the cabinet is bounded. */
const MAX_FLEETS = 12;

interface Runtime {
  fleet: Fleet;
  scripts: Map<string, AgentScript>;
  /** Index of the step each running agent is on, and when it ends. */
  cursors: Map<string, { step: number; endsAt: number }>;
  timer: ReturnType<typeof setInterval> | null;
  /**
   * Why the fleet is paused. An operator pause is theirs to undo; a pause at
   * the approval gate lifts itself the moment the gate is cleared.
   */
  pausedBy: "operator" | "approval" | null;
  seq: number;
  version: number;
  subscribers: Set<(event: FleetEvent) => void>;
}

export class FleetEngine {
  private runtimes = new Map<string, Runtime>();
  private counter = 0;

  /** Injectable so tests can run a fleet without waiting for wall-clock time. */
  constructor(
    private now: () => number = () => Date.now(),
    private speed = 1,
  ) {}

  deploy(request: MissionRequest, skills: Skill[]): Fleet {
    const id = `flt-${(++this.counter).toString(36)}-${this.now().toString(36).slice(-4)}`;
    const fleet = planFleet(request, skills, this.now(), id);
    const bySlug = new Map(skills.map((s) => [s.slug, s]));

    const scripts = new Map<string, AgentScript>();
    for (const agent of fleet.agents) {
      scripts.set(agent.id, scriptFor(agent, bySlug, request.seed, this.speed));
    }

    const runtime: Runtime = {
      fleet,
      scripts,
      cursors: new Map(),
      timer: null,
      pausedBy: null,
      seq: 1,
      version: 1,
      subscribers: new Set(),
    };
    this.runtimes.set(id, runtime);
    this.evict();

    this.start(runtime);
    return fleet;
  }

  get(id: string): Fleet | null {
    return this.runtimes.get(id)?.fleet ?? null;
  }

  list(): Fleet[] {
    return [...this.runtimes.values()].map((r) => r.fleet).sort((a, b) => b.createdAt - a.createdAt);
  }

  version(id: string): number {
    return this.runtimes.get(id)?.version ?? 0;
  }

  subscribe(id: string, listener: (event: FleetEvent) => void): () => void {
    const runtime = this.runtimes.get(id);
    if (!runtime) return () => {};
    runtime.subscribers.add(listener);
    return () => runtime.subscribers.delete(listener);
  }

  /** Releases agents held at the approval gate. One, or all of them. */
  approve(id: string, agentId?: string): Fleet | null {
    const runtime = this.runtimes.get(id);
    if (!runtime) return null;
    const targets = runtime.fleet.agents.filter(
      (a) => a.status === "awaiting-approval" && (!agentId || a.id === agentId),
    );
    for (const agent of targets) {
      agent.status = "queued";
      this.emit(runtime, {
        agentId: agent.id,
        kind: "agent-approved",
        message: `${agent.role} approved to run at ${agent.riskLevel} risk.`,
      });
    }
    // Clearing the gate is what the fleet was waiting for, so it goes again by
    // itself. An operator pause is not lifted by an approval.
    if (targets.length && runtime.pausedBy === "approval") {
      runtime.pausedBy = null;
      runtime.fleet.status = "running";
    }
    if (targets.length) this.start(runtime);
    return runtime.fleet;
  }

  pause(id: string): Fleet | null {
    const runtime = this.runtimes.get(id);
    if (!runtime || runtime.fleet.status !== "running") return runtime?.fleet ?? null;
    runtime.fleet.status = "paused";
    runtime.pausedBy = "operator";
    this.stopTimer(runtime);
    this.emit(runtime, { agentId: null, kind: "fleet-paused", message: "Fleet paused." });
    return runtime.fleet;
  }

  resume(id: string): Fleet | null {
    const runtime = this.runtimes.get(id);
    if (!runtime || runtime.fleet.status !== "paused") return runtime?.fleet ?? null;
    // Push every in-flight deadline out by the time spent paused, so pausing
    // does not silently complete the steps that were mid-flight.
    const at = this.now();
    for (const cursor of runtime.cursors.values()) {
      if (cursor.endsAt < at) cursor.endsAt = at + TICK_MS;
    }
    runtime.fleet.status = "running";
    runtime.pausedBy = null;
    this.emit(runtime, { agentId: null, kind: "fleet-resumed", message: "Fleet resumed." });
    this.ensureTimer(runtime);
    return runtime.fleet;
  }

  abort(id: string): Fleet | null {
    const runtime = this.runtimes.get(id);
    if (!runtime) return null;
    const at = this.now();
    for (const agent of runtime.fleet.agents) {
      if (TERMINAL_STATUSES.includes(agent.status)) continue;
      agent.status = "aborted";
      agent.endedAt = at;
      for (const step of agent.steps) if (step.status === "running") step.status = "failed";
    }
    runtime.cursors.clear();
    runtime.fleet.status = "aborted";
    runtime.fleet.endedAt = at;
    this.stopTimer(runtime);
    this.emit(runtime, { agentId: null, kind: "fleet-aborted", message: "Fleet aborted." });
    return runtime.fleet;
  }

  /** Drives the clock directly. Tests use this instead of waiting. */
  advanceTo(id: string, at: number): Fleet | null {
    const runtime = this.runtimes.get(id);
    if (!runtime) return null;
    this.now = () => at;
    this.tick(runtime);
    return runtime.fleet;
  }

  private start(runtime: Runtime) {
    if (runtime.fleet.status === "aborted" || runtime.fleet.status === "paused") return;
    const runnable = runtime.fleet.agents.some((a) => a.status === "queued");
    if (!runnable && !runtime.cursors.size) {
      // Everything is either gated or finished; nothing to schedule.
      this.settle(runtime);
      return;
    }
    if (runtime.fleet.status !== "running") {
      runtime.fleet.status = "running";
      runtime.fleet.startedAt ??= this.now();
      this.emit(runtime, {
        agentId: null,
        kind: "fleet-started",
        message: `Deploying against: ${runtime.fleet.objective}`,
      });
    }
    this.fill(runtime);
    this.ensureTimer(runtime);
  }

  private ensureTimer(runtime: Runtime) {
    if (runtime.timer) return;
    runtime.timer = setInterval(() => this.tick(runtime), TICK_MS);
    // A fleet must never hold the process open on its own account.
    runtime.timer.unref?.();
  }

  private stopTimer(runtime: Runtime) {
    if (!runtime.timer) return;
    clearInterval(runtime.timer);
    runtime.timer = null;
  }

  /** Starts as many queued agents as the concurrency cap allows. */
  private fill(runtime: Runtime) {
    const { fleet } = runtime;
    const at = this.now();
    for (const agent of fleet.agents) {
      if (runtime.cursors.size >= fleet.request.concurrency) break;
      if (agent.status !== "queued") continue;

      const script = runtime.scripts.get(agent.id);
      if (!script || !script.steps.length) {
        agent.status = "succeeded";
        agent.startedAt = at;
        agent.endedAt = at;
        for (const check of agent.validation) check.passed = true;
        this.emit(runtime, {
          agentId: agent.id,
          kind: "agent-succeeded",
          message: `${agent.role} completed with no procedure to run.`,
        });
        continue;
      }

      agent.status = "running";
      agent.startedAt = at;
      agent.steps[0].status = "running";
      agent.steps[0].startedAt = at;
      runtime.cursors.set(agent.id, { step: 0, endsAt: at + script.steps[0].durationMs });
      this.emit(runtime, {
        agentId: agent.id,
        kind: "agent-started",
        message: `${agent.role} started — ${agent.skillSet.length} skill${
          agent.skillSet.length === 1 ? "" : "s"
        }, ${agent.steps.length} steps.`,
      });
    }
  }

  private tick(runtime: Runtime) {
    if (runtime.fleet.status !== "running") return;
    const at = this.now();

    for (const [agentId, cursor] of [...runtime.cursors.entries()]) {
      if (cursor.endsAt > at) continue;
      const agent = runtime.fleet.agents.find((a) => a.id === agentId);
      const script = runtime.scripts.get(agentId);
      if (!agent || !script) {
        runtime.cursors.delete(agentId);
        continue;
      }
      this.completeStep(runtime, agent, script, cursor, at);
    }

    this.fill(runtime);
    this.settle(runtime);
  }

  private completeStep(
    runtime: Runtime,
    agent: AgentInstance,
    script: AgentScript,
    cursor: { step: number; endsAt: number },
    at: number,
  ) {
    const index = cursor.step;
    const step = agent.steps[index];
    const plan = script.steps[index];
    step.endedAt = at;

    if (plan?.failure) {
      step.failure = plan.failure;
      if (plan.failure.recovered) {
        step.status = "recovered";
        this.emit(runtime, {
          agentId: agent.id,
          kind: "agent-recovered",
          message: `${agent.role} recovered: ${plan.failure.failure}`,
        });
      } else {
        step.status = "failed";
        agent.endedAt = at;
        runtime.cursors.delete(agent.id);
        if (script.outcome === "escalated" && script.escalation) {
          agent.status = "escalated";
          agent.escalation = script.escalation;
          this.emit(runtime, {
            agentId: agent.id,
            kind: "agent-escalated",
            message: `${agent.role} escalated: ${script.escalation.condition}`,
          });
        } else {
          agent.status = "failed";
          this.emit(runtime, {
            agentId: agent.id,
            kind: "agent-failed",
            message: `${agent.role} failed: ${plan.failure.failure}`,
          });
        }
        return;
      }
    } else {
      step.status = "done";
    }

    const next = index + 1;
    if (next < agent.steps.length) {
      cursor.step = next;
      cursor.endsAt = at + (script.steps[next]?.durationMs ?? TICK_MS);
      agent.steps[next].status = "running";
      agent.steps[next].startedAt = at;
      // One event per step for 500 agents would drown the feed; the per-agent
      // timeline carries the detail, and the feed carries the milestones.
      if (next % 4 === 0) {
        this.emit(runtime, {
          agentId: agent.id,
          kind: "agent-step",
          message: `${agent.role} — step ${next + 1}/${agent.steps.length}`,
        });
      }
      return;
    }

    // Procedure finished: the validation checks decide the outcome.
    runtime.cursors.delete(agent.id);
    agent.endedAt = at;
    const failing = new Set(script.failingChecks);
    agent.validation.forEach((check, i) => {
      check.passed = !failing.has(i);
    });

    if (failing.size) {
      agent.status = "failed";
      this.emit(runtime, {
        agentId: agent.id,
        kind: "agent-failed",
        message: `${agent.role} failed validation: ${agent.validation[script.failingChecks[0]]?.check ?? "check failed"}`,
      });
    } else {
      agent.status = "succeeded";
      this.emit(runtime, {
        agentId: agent.id,
        kind: "agent-succeeded",
        message: `${agent.role} succeeded — ${agent.validation.length} check${
          agent.validation.length === 1 ? "" : "s"
        } passed.`,
      });
    }
  }

  /** Marks a fleet complete once nothing can move without a human. */
  private settle(runtime: Runtime) {
    if (runtime.cursors.size) return;
    const pending = runtime.fleet.agents.some((a) => a.status === "queued");
    if (pending) return;
    if (runtime.fleet.status !== "running") return;

    const gated = runtime.fleet.agents.filter((a) => a.status === "awaiting-approval").length;
    if (gated) {
      // Not complete: the fleet is waiting on a person, and says so.
      this.stopTimer(runtime);
      runtime.fleet.status = "paused";
      runtime.pausedBy = "approval";
      this.emit(runtime, {
        agentId: null,
        kind: "fleet-paused",
        message: `Waiting on approval for ${gated} agent${gated === 1 ? "" : "s"}.`,
      });
      return;
    }

    runtime.fleet.status = "complete";
    runtime.fleet.endedAt = this.now();
    this.stopTimer(runtime);
    const counts = aggregate(runtime.fleet);
    this.emit(runtime, {
      agentId: null,
      kind: "fleet-complete",
      message: `Complete — ${counts.byStatus.succeeded} succeeded, ${counts.byStatus.failed} failed, ${counts.byStatus.escalated} escalated.`,
    });
  }

  private emit(runtime: Runtime, event: Omit<FleetEvent, "at" | "seq">) {
    const full: FleetEvent = { ...event, at: this.now(), seq: runtime.seq++ };
    runtime.fleet.events.push(full);
    if (runtime.fleet.events.length > MAX_EVENTS) {
      runtime.fleet.events.splice(0, runtime.fleet.events.length - MAX_EVENTS);
    }
    runtime.version++;
    for (const listener of runtime.subscribers) {
      try {
        listener(full);
      } catch {
        // A broken subscriber must not stop the fleet.
      }
    }
  }

  private evict() {
    if (this.runtimes.size <= MAX_FLEETS) return;
    const ordered = [...this.runtimes.entries()].sort(
      (a, b) => a[1].fleet.createdAt - b[1].fleet.createdAt,
    );
    for (const [id, runtime] of ordered.slice(0, this.runtimes.size - MAX_FLEETS)) {
      this.stopTimer(runtime);
      this.runtimes.delete(id);
    }
  }
}

export function aggregate(fleet: Fleet): FleetAggregate {
  const byStatus = Object.fromEntries(AGENT_STATUSES.map((s) => [s, 0])) as Record<
    AgentStatus,
    number
  >;
  const permissions = new Set<string>();
  const tools = new Set<string>();
  const risks: RiskLevel[] = [];

  for (const agent of fleet.agents) {
    byStatus[agent.status]++;
    for (const p of agent.permissions) permissions.add(p);
    for (const t of agent.tools) tools.add(t);
    risks.push(agent.riskLevel);
  }

  const settled = fleet.agents.filter((a) => TERMINAL_STATUSES.includes(a.status)).length;

  return {
    total: fleet.agents.length,
    byStatus,
    permissions: [...permissions].sort(),
    tools: [...tools].sort(),
    highestRisk: highestRisk(risks),
    gated: byStatus["awaiting-approval"],
    skillsInUse: new Set(fleet.agents.flatMap((a) => a.skillSet)).size,
    completion: fleet.agents.length ? settled / fleet.agents.length : 0,
  };
}

/**
 * One engine per process. Held on `globalThis` so a hot reload in development
 * does not strand a running fleet behind a fresh module instance.
 */
const globalForFleet = globalThis as unknown as { __fleetEngine?: FleetEngine };
export const fleetEngine: FleetEngine = (globalForFleet.__fleetEngine ??= new FleetEngine());
