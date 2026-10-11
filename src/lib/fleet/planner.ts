/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

import type { RiskLevel, Skill } from "../schema";
import { RISK_LEVELS } from "../schema";
import { prerequisiteChain } from "../relations";
import type { AgentInstance, Fleet, MissionRequest, RosterStrategy, StepRun } from "./types";
import { ROSTER_STRATEGIES } from "./types";

/** A fleet is a rehearsal, not a load test. The cap keeps one request bounded. */
export const MAX_FLEET_SIZE = 500;
export const MAX_CONCURRENCY = 64;
/** Complements are capped so an agent's skill set stays something a reader can hold. */
const MAX_COMPLEMENTS = 2;

/**
 * Deterministic PRNG (mulberry32). The same seed and the same registry produce
 * the same fleet, which is what makes a rehearsal worth comparing against the
 * next one.
 */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function riskRank(risk: RiskLevel): number {
  return RISK_LEVELS.indexOf(risk);
}

export function highestRisk(risks: RiskLevel[]): RiskLevel {
  return risks.reduce<RiskLevel>((worst, r) => (riskRank(r) > riskRank(worst) ? r : worst), "low");
}

export function isRosterStrategy(value: string): value is RosterStrategy {
  return (ROSTER_STRATEGIES as readonly string[]).includes(value);
}

/**
 * Picks the pool of skills a fleet draws its agents from.
 *
 * `explicit` is the only strategy that can come back empty — if a caller names
 * slugs that do not resolve, that is an error worth reporting rather than a
 * silent fallback to the whole registry.
 */
export function selectPool(
  request: MissionRequest,
  all: Skill[],
): { pool: Skill[]; notices: string[] } {
  const notices: string[] = [];
  const bySlug = new Map(all.map((s) => [s.slug, s]));

  if (request.strategy === "explicit") {
    const pool: Skill[] = [];
    for (const slug of request.skills) {
      const skill = bySlug.get(slug);
      if (skill) pool.push(skill);
      else notices.push(`Unknown skill "${slug}" was dropped from the roster.`);
    }
    return { pool, notices };
  }

  if (request.strategy === "category") {
    const wanted = new Set(request.categories);
    const pool = wanted.size ? all.filter((s) => wanted.has(s.category)) : all;
    if (wanted.size && !pool.length) {
      notices.push("No skill matched the requested categories; the roster is empty.");
    }
    return { pool, notices };
  }

  if (request.strategy === "layer") {
    const wanted = new Set<string>(request.layers);
    const pool = wanted.size ? all.filter((s) => wanted.has(s.layer)) : all;
    if (wanted.size && !pool.length) {
      notices.push("No skill matched the requested layers; the roster is empty.");
    }
    return { pool, notices };
  }

  return { pool: all, notices };
}

/**
 * Builds one agent's skill set: the primary skill's prerequisite closure,
 * ordered so nothing runs before its precondition, then up to two complements
 * that exist in the registry.
 */
export function buildSkillSet(primary: Skill, all: Skill[]): { slugs: string[]; cycles: string[] } {
  const { ordered, cycles } = prerequisiteChain([primary.slug], all);
  const slugs = ordered.map((s) => s.slug);
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  for (const complement of primary.related_skills.complementary) {
    if (slugs.length >= ordered.length + MAX_COMPLEMENTS) break;
    if (!slugs.includes(complement) && bySlug.has(complement)) slugs.push(complement);
  }
  return { slugs, cycles };
}

function stepsFor(skillSet: string[], bySlug: Map<string, Skill>): StepRun[] {
  const steps: StepRun[] = [];
  for (const slug of skillSet) {
    const skill = bySlug.get(slug);
    if (!skill) continue;
    for (const step of skill.procedure) {
      steps.push({
        index: steps.length,
        name: `${skill.name}: ${step.step}`,
        status: "pending",
        startedAt: null,
        endedAt: null,
      });
    }
  }
  return steps;
}

/** Clamps a request into the supported range rather than rejecting near misses. */
export function normaliseRequest(raw: Partial<MissionRequest>): MissionRequest {
  // `|| default` would conflate an explicit 0 with an absent value, and 0 is a
  // value a caller can plausibly send. Absent falls back; present gets clamped.
  const clamp = (value: unknown, fallback: number, max: number) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(Math.floor(n), 1), max);
  };
  const size = clamp(raw.size, 1, MAX_FLEET_SIZE);
  const concurrency = clamp(raw.concurrency, 8, MAX_CONCURRENCY);
  const strategy =
    raw.strategy && isRosterStrategy(raw.strategy) ? raw.strategy : ("spread" as RosterStrategy);
  return {
    objective: (raw.objective ?? "").trim().slice(0, 300) || "Unnamed objective",
    size,
    strategy,
    skills: (raw.skills ?? []).slice(0, MAX_FLEET_SIZE),
    categories: raw.categories ?? [],
    layers: raw.layers ?? [],
    concurrency,
    approvalThreshold:
      raw.approvalThreshold && [...RISK_LEVELS, "none"].includes(raw.approvalThreshold)
        ? raw.approvalThreshold
        : "high",
    seed: Number.isFinite(Number(raw.seed)) ? Math.floor(Number(raw.seed)) : 1,
  };
}

/**
 * Plans a fleet. Pure: same request plus same registry gives the same agents,
 * in the same order, with the same shards.
 */
export function planFleet(request: MissionRequest, all: Skill[], now: number, id: string): Fleet {
  const { pool, notices } = selectPool(request, all);
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  const random = rng(request.seed);
  const agents: AgentInstance[] = [];
  const cycleNotices = new Set<string>();

  if (!pool.length) {
    notices.push("No agents were deployed, because the roster pool resolved to nothing.");
  }

  // Deal from the pool in order so every skill gets an agent before any skill
  // gets a second one. A fleet larger than the pool is a deliberate case: more
  // agents than roles means several agents share a role on different shards.
  for (let i = 0; i < request.size && pool.length; i++) {
    const primary = pool[i % pool.length];
    const { slugs, cycles } = buildSkillSet(primary, all);
    for (const cycle of cycles) cycleNotices.add(`Prerequisite cycle broken: ${cycle}.`);

    const set = slugs.map((slug) => bySlug.get(slug)).filter((s): s is Skill => Boolean(s));
    const shard = Math.floor(i / pool.length) + 1;
    const permissions = [...new Set(set.flatMap((s) => s.required_permissions))].sort();
    const tools = [...new Set(set.flatMap((s) => s.tools))].sort();
    const restricted = [...new Set(set.flatMap((s) => s.restricted_actions))];
    const risk = highestRisk(set.map((s) => s.risk_level));

    const gated =
      request.approvalThreshold !== "none" &&
      riskRank(risk) >= riskRank(request.approvalThreshold as RiskLevel);

    agents.push({
      id: `agt-${String(i + 1).padStart(4, "0")}`,
      ordinal: i + 1,
      role: primary.name,
      primarySkill: primary.slug,
      skillSet: slugs,
      layer: primary.layer,
      category: primary.category,
      riskLevel: risk,
      permissions,
      tools,
      restrictedActions: restricted,
      assignment: shard === 1 ? "Primary pass" : `Shard ${shard}`,
      // Waves are the scheduler's unit of parallelism, not a dependency order.
      wave: Math.floor(i / request.concurrency) + 1,
      status: gated ? "awaiting-approval" : "queued",
      steps: stepsFor(slugs, bySlug),
      validation: set.flatMap((s) => s.validation.map((v) => ({ check: v.check, passed: false }))),
      escalation: null,
      startedAt: null,
      endedAt: null,
    });
    // Consume one draw per agent so the seed advances with fleet size; the
    // simulation re-seeds per agent from this stream.
    random();
  }

  const gatedCount = agents.filter((a) => a.status === "awaiting-approval").length;
  if (gatedCount) {
    notices.push(
      `${gatedCount} agent${gatedCount === 1 ? "" : "s"} held at the approval gate at or above ${request.approvalThreshold} risk.`,
    );
  }

  return {
    id,
    objective: request.objective,
    status: "planned",
    request,
    agents,
    events: [
      {
        at: now,
        seq: 0,
        agentId: null,
        kind: "fleet-planned",
        message: `Planned ${agents.length} agent${agents.length === 1 ? "" : "s"} across ${
          new Set(agents.map((a) => a.primarySkill)).size
        } skills.`,
      },
    ],
    createdAt: now,
    startedAt: null,
    endedAt: null,
    notices: [...notices, ...cycleNotices],
  };
}
