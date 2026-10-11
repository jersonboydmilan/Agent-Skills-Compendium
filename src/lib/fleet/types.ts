/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

import type { LayerId, RiskLevel } from "../schema";

/**
 * Fleet types.
 *
 * A fleet is a rehearsal: many agents, each carrying a skill set drawn from the
 * registry, run against one objective so the plan can be inspected before any
 * of it is executed for real. The registry stays data — nothing here reaches
 * into `content/`, and nothing here calls a model. See `simulation.ts` for what
 * "runs" means precisely.
 */

export const AGENT_STATUSES = [
  "queued",
  "awaiting-approval",
  "running",
  "succeeded",
  "failed",
  "escalated",
  "aborted",
] as const;

export type AgentStatus = (typeof AGENT_STATUSES)[number];

/** Statuses that will never change again without a new deployment. */
export const TERMINAL_STATUSES: readonly AgentStatus[] = [
  "succeeded",
  "failed",
  "escalated",
  "aborted",
];

export const ROSTER_STRATEGIES = ["spread", "category", "layer", "explicit"] as const;
export type RosterStrategy = (typeof ROSTER_STRATEGIES)[number];

export const FLEET_STATUSES = ["planned", "running", "paused", "complete", "aborted"] as const;
export type FleetStatus = (typeof FLEET_STATUSES)[number];

/** What the caller asked for. Everything else is derived from this plus the registry. */
export interface MissionRequest {
  objective: string;
  size: number;
  strategy: RosterStrategy;
  skills: string[];
  categories: string[];
  layers: LayerId[];
  concurrency: number;
  /** Gate agents above this risk level behind an explicit approval. */
  approvalThreshold: RiskLevel | "none";
  seed: number;
}

/** One step of an agent's procedure, as it ran. */
export interface StepRun {
  index: number;
  name: string;
  status: "pending" | "running" | "done" | "recovered" | "failed";
  startedAt: number | null;
  endedAt: number | null;
  /** Set when the step hit one of the skill's declared failure modes. */
  failure?: { failure: string; mitigation: string; recovered: boolean };
}

export interface ValidationRun {
  check: string;
  passed: boolean;
}

/** A deployed agent: one skill set, one shard of the objective. */
export interface AgentInstance {
  id: string;
  /** 1-based, stable, and what the UI sorts by when nothing else is chosen. */
  ordinal: number;
  role: string;
  /** The skill this agent leads with. Its prerequisites run first. */
  primarySkill: string;
  /** Prerequisite closure first, then the primary skill, then complements. */
  skillSet: string[];
  layer: LayerId;
  category: string;
  riskLevel: RiskLevel;
  permissions: string[];
  tools: string[];
  restrictedActions: string[];
  /** Which slice of the objective this agent owns. */
  assignment: string;
  wave: number;
  status: AgentStatus;
  steps: StepRun[];
  validation: ValidationRun[];
  /** Populated when the agent stopped because its own escalation rule fired. */
  escalation: { condition: string; action: string } | null;
  startedAt: number | null;
  endedAt: number | null;
}

export interface FleetEvent {
  at: number;
  seq: number;
  agentId: string | null;
  kind:
    | "fleet-planned"
    | "fleet-started"
    | "fleet-paused"
    | "fleet-resumed"
    | "fleet-complete"
    | "fleet-aborted"
    | "agent-started"
    | "agent-step"
    | "agent-recovered"
    | "agent-succeeded"
    | "agent-failed"
    | "agent-escalated"
    | "agent-approved"
    | "agent-aborted";
  message: string;
}

export interface FleetAggregate {
  total: number;
  byStatus: Record<AgentStatus, number>;
  /** Union across every deployed agent. */
  permissions: string[];
  tools: string[];
  highestRisk: RiskLevel;
  /** Agents held at the approval gate. */
  gated: number;
  skillsInUse: number;
  completion: number;
}

export interface Fleet {
  id: string;
  objective: string;
  status: FleetStatus;
  request: MissionRequest;
  agents: AgentInstance[];
  events: FleetEvent[];
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  /** Warnings raised while planning — unknown slugs, truncated rosters, cycles. */
  notices: string[];
}

/** The subset the roster view needs. Sending whole agents for 500 rows is wasteful. */
export interface AgentSummary {
  id: string;
  ordinal: number;
  role: string;
  primarySkill: string;
  layer: LayerId;
  category: string;
  riskLevel: RiskLevel;
  status: AgentStatus;
  wave: number;
  skillCount: number;
  stepsDone: number;
  stepCount: number;
  assignment: string;
}

export function summarise(agent: AgentInstance): AgentSummary {
  return {
    id: agent.id,
    ordinal: agent.ordinal,
    role: agent.role,
    primarySkill: agent.primarySkill,
    layer: agent.layer,
    category: agent.category,
    riskLevel: agent.riskLevel,
    status: agent.status,
    wave: agent.wave,
    skillCount: agent.skillSet.length,
    stepsDone: agent.steps.filter((s) => s.status === "done" || s.status === "recovered").length,
    stepCount: agent.steps.length,
    assignment: agent.assignment,
  };
}
