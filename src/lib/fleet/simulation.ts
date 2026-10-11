/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

import type { Complexity, Maturity, Skill } from "../schema";
import type { AgentInstance } from "./types";
import { rng, riskRank } from "./planner";

/**
 * What "running" a fleet means.
 *
 * No model is called and no tool is invoked. Each agent is played out against
 * the definitions it carries: step durations come from the skills' declared
 * build speed and complexity, failures are drawn from their own
 * `failure_modes`, recovery is attempted with the mitigation the definition
 * states, an unrecovered failure triggers that skill's `escalation` rule, and
 * the run only succeeds if every `validation` check passes.
 *
 * It is a rehearsal of the specification, and it is only as good as the
 * specification — which is the point. A skill whose failure modes are
 * imaginary produces a fleet whose failures are imaginary too, and that shows.
 */

/**
 * Base likelihood that **one run of a skill** hits a declared failure mode, by
 * how proven that skill is. It is a per-run rate, not a per-step one: spread
 * across a procedure it becomes a small per-step chance, so a long procedure
 * does not make failure a near-certainty just by having more steps in it.
 */
const MATURITY_FAILURE_RATE: Record<Maturity, number> = {
  experimental: 0.3,
  prototype: 0.2,
  beta: 0.11,
  production: 0.05,
};

/** Harder work takes longer and goes wrong more often. */
const COMPLEXITY_WEIGHT: Record<Complexity, number> = {
  beginner: 0.6,
  intermediate: 1,
  advanced: 1.45,
  expert: 1.9,
};

/** A mitigation that is actually a procedure change usually works. Usually. */
const RECOVERY_RATE = 0.68;
/**
 * Likelihood that **one run of a skill** fails its own exit test, spread across
 * that skill's checks for the same reason the failure rate is spread across its
 * steps. Validation is strict, but a skill that declares more checks is not a
 * skill that is more likely to fail them.
 */
const CHECK_FAILURE_RATE = 0.06;

export interface StepPlan {
  durationMs: number;
  failure: { failure: string; mitigation: string; recovered: boolean } | null;
}

export interface AgentScript {
  steps: StepPlan[];
  /** Index into `agent.validation` for each check that will fail. */
  failingChecks: number[];
  outcome: "succeeded" | "failed" | "escalated";
  escalation: { condition: string; action: string } | null;
  /** The step index that ended the run early, if one did. */
  stoppedAt: number | null;
  totalMs: number;
}

/**
 * Computes the whole run up front, deterministically, so the engine only has to
 * play it back. Wall-clock timing then cannot change an outcome, which keeps a
 * replay of the same seed identical whatever the machine is doing.
 */
export function scriptFor(
  agent: AgentInstance,
  bySlug: Map<string, Skill>,
  seed: number,
  speed = 1,
): AgentScript {
  const random = rng(seed + agent.ordinal * 7919);
  const steps: StepPlan[] = [];

  // Which skill owns which step, in the same order planner.ts laid them out.
  const owners: Skill[] = [];
  for (const slug of agent.skillSet) {
    const skill = bySlug.get(slug);
    if (!skill) continue;
    for (let i = 0; i < skill.procedure.length; i++) owners.push(skill);
  }

  let outcome: AgentScript["outcome"] = "succeeded";
  let escalation: AgentScript["escalation"] = null;
  let stoppedAt: number | null = null;

  for (let i = 0; i < agent.steps.length; i++) {
    const skill = owners[i];
    if (!skill) {
      steps.push({ durationMs: 240, failure: null });
      continue;
    }

    const weight = COMPLEXITY_WEIGHT[skill.complexity];
    // build_speed is 1..3 with 3 fastest, so it divides the base duration.
    const base = (260 + random() * 420) * weight * (4 - skill.build_speed) * 0.45;
    const durationMs = Math.max(120, Math.round(base / speed));

    const perRun = Math.min(
      0.6,
      MATURITY_FAILURE_RATE[skill.maturity] * weight + riskRank(skill.risk_level) * 0.015,
    );
    const failureRate = perRun / Math.max(1, skill.procedure.length);

    let failure: StepPlan["failure"] = null;
    if (skill.failure_modes.length && random() < failureRate && stoppedAt === null) {
      const mode = skill.failure_modes[Math.floor(random() * skill.failure_modes.length)];
      const recovered = random() < RECOVERY_RATE;
      failure = { failure: mode.failure, mitigation: mode.mitigation, recovered };

      if (!recovered) {
        stoppedAt = i;
        const rule = skill.escalation[0];
        if (rule) {
          outcome = "escalated";
          escalation = { condition: rule.condition, action: rule.action };
        } else {
          outcome = "failed";
        }
      }
    }

    steps.push({ durationMs, failure });
    if (stoppedAt !== null) break;
  }

  // Validation only runs if the procedure finished. An agent that escalated
  // never reaches its own exit test, which is exactly the real-world shape.
  const failingChecks: number[] = [];
  if (stoppedAt === null) {
    // Walk the checks in the same order the planner flattened them, so each one
    // can be weighted by how many checks its own skill declares.
    let cursor = 0;
    for (const slug of agent.skillSet) {
      const skill = bySlug.get(slug);
      if (!skill) continue;
      const rate = CHECK_FAILURE_RATE / Math.max(1, skill.validation.length);
      for (let i = 0; i < skill.validation.length; i++) {
        if (random() < rate) failingChecks.push(cursor + i);
      }
      cursor += skill.validation.length;
    }
    if (failingChecks.length) outcome = "failed";
  }

  return {
    steps,
    failingChecks,
    outcome,
    escalation,
    stoppedAt,
    totalMs: steps.reduce((sum, s) => sum + s.durationMs, 0),
  };
}
