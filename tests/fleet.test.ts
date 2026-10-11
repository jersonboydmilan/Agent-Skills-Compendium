import { strict as assert } from "node:assert";
import { test } from "node:test";
import { repository } from "../src/lib/content-store";
import {
  MAX_CONCURRENCY,
  MAX_FLEET_SIZE,
  buildSkillSet,
  highestRisk,
  normaliseRequest,
  planFleet,
  rng,
  selectPool,
} from "../src/lib/fleet/planner";
import { scriptFor } from "../src/lib/fleet/simulation";
import { FleetEngine, aggregate } from "../src/lib/fleet/engine";
import { TERMINAL_STATUSES, summarise } from "../src/lib/fleet/types";
import type { MissionRequest } from "../src/lib/fleet/types";
import type { Skill } from "../src/lib/schema";

// Read once, lazily: tsx transpiles these tests to CJS, where top-level await
// is unavailable.
let cache: Skill[] | null = null;
async function registry(): Promise<Skill[]> {
  return (cache ??= await repository.listSkills());
}

/**
 * Runs the clock forward until the fleet stops moving. Reading the status back
 * off the engine each tick keeps it out of reach of assert's type narrowing.
 */
function drain(engine: FleetEngine, id: string, from = 100, step = 100, limit = 400_000) {
  for (let t = from; t <= limit; t += step) {
    engine.advanceTo(id, t);
    if (engine.get(id)?.status !== "running") return t;
  }
  throw new Error(`fleet ${id} never settled`);
}

function request(overrides: Partial<MissionRequest> = {}): MissionRequest {
  return normaliseRequest({
    objective: "Audit the agent surface",
    size: 24,
    strategy: "spread",
    concurrency: 8,
    approvalThreshold: "none",
    seed: 7,
    ...overrides,
  });
}

test("the same seed plans an identical fleet", async () => {
  const skills = await registry();
  const a = planFleet(request(), skills, 0, "flt-a");
  const b = planFleet(request(), skills, 0, "flt-b");
  assert.deepEqual(
    a.agents.map((x) => [x.ordinal, x.primarySkill, x.skillSet.join(","), x.assignment]),
    b.agents.map((x) => [x.ordinal, x.primarySkill, x.skillSet.join(","), x.assignment]),
  );
});

test("a fleet larger than the pool shards roles instead of dropping agents", async () => {
  const skills = await registry();
  const pool = skills.filter((s) => s.category === "agent-security");
  const slugs = pool.map((s) => s.slug);
  const fleet = planFleet(
    request({ size: pool.length * 3, strategy: "explicit", skills: slugs }),
    skills,
    0,
    "flt-shard",
  );
  assert.equal(fleet.agents.length, pool.length * 3);
  assert.equal(fleet.agents.filter((a) => a.assignment === "Primary pass").length, pool.length);
  assert.equal(fleet.agents.filter((a) => a.assignment === "Shard 3").length, pool.length);
});

test("every agent covers a distinct skill before any skill gets a second agent", async () => {
  const skills = await registry();
  const fleet = planFleet(request({ size: 20 }), skills, 0, "flt-cover");
  const primaries = fleet.agents.map((a) => a.primarySkill);
  assert.equal(new Set(primaries).size, 20);
});

test("a skill set starts with the prerequisite closure, in order", async () => {
  const skills = await registry();
  const withPrereq = skills.find((s) => s.related_skills.prerequisites.length > 0);
  assert.ok(withPrereq, "the registry has no skill with a prerequisite to test against");
  const { slugs } = buildSkillSet(withPrereq, skills);
  for (const pre of withPrereq.related_skills.prerequisites) {
    if (!slugs.includes(pre)) continue;
    assert.ok(slugs.indexOf(pre) < slugs.indexOf(withPrereq.slug), `${pre} ran after its dependent`);
  }
});

test("an unknown slug is reported rather than silently dropped", async () => {
  const skills = await registry();
  const { pool, notices } = selectPool(
    request({ strategy: "explicit", skills: ["code-review", "not-a-real-skill"] }),
    skills,
  );
  assert.equal(pool.length, 1);
  assert.match(notices.join(" "), /not-a-real-skill/);
});

test("an explicit roster that resolves to nothing deploys nothing", async () => {
  const skills = await registry();
  const fleet = planFleet(
    request({ strategy: "explicit", skills: ["nope"] }),
    skills,
    0,
    "flt-empty",
  );
  assert.equal(fleet.agents.length, 0);
  assert.match(fleet.notices.join(" "), /resolved to nothing/);
});

test("requests are clamped into the supported range", async () => {
  const over = normaliseRequest({ size: 10_000, concurrency: 9_999, seed: 3 });
  assert.equal(over.size, MAX_FLEET_SIZE);
  assert.equal(over.concurrency, MAX_CONCURRENCY);
  const under = normaliseRequest({ size: -4, concurrency: 0, seed: 3 });
  assert.equal(under.size, 1);
  assert.equal(under.concurrency, 1);
});

test("an unknown strategy falls back rather than throwing", async () => {
  assert.equal(normaliseRequest({ strategy: "sideways" as never }).strategy, "spread");
});

test("agents at or above the approval threshold are gated, below it are not", async () => {
  const skills = await registry();
  const fleet = planFleet(request({ size: 60, approvalThreshold: "high" }), skills, 0, "flt-gate");
  for (const agent of fleet.agents) {
    const gated = agent.status === "awaiting-approval";
    const high = agent.riskLevel === "high" || agent.riskLevel === "critical";
    assert.equal(gated, high, `${agent.role} at ${agent.riskLevel} risk: gated=${gated}`);
  }
});

test("an agent's risk is the highest in its skill set, not just its primary skill", async () => {
  const skills = await registry();
  const fleet = planFleet(request({ size: 76 }), skills, 0, "flt-risk");
  const bySlug = new Map(skills.map((s) => [s.slug, s]));
  for (const agent of fleet.agents) {
    const expected = highestRisk(
      agent.skillSet.map((slug) => bySlug.get(slug)!.risk_level).filter(Boolean),
    );
    assert.equal(agent.riskLevel, expected);
  }
});

test("the simulation is deterministic for a given seed and agent", async () => {
  const skills = await registry();
  const fleet = planFleet(request({ size: 12 }), skills, 0, "flt-sim");
  const bySlug = new Map(skills.map((s) => [s.slug, s]));
  for (const agent of fleet.agents) {
    const a = scriptFor(agent, bySlug, 7);
    const b = scriptFor(agent, bySlug, 7);
    assert.deepEqual(a, b);
  }
});

test("a different seed produces a different run across a fleet", async () => {
  const skills = await registry();
  const fleet = planFleet(request({ size: 30 }), skills, 0, "flt-seed");
  const bySlug = new Map(skills.map((s) => [s.slug, s]));
  const outcomes = (seed: number) =>
    fleet.agents.map((a) => scriptFor(a, bySlug, seed).outcome).join("");
  assert.notEqual(outcomes(1), outcomes(99));
});

test("every simulated failure quotes a failure mode the skill itself declares", async () => {
  const skills = await registry();
  const fleet = planFleet(request({ size: 76 }), skills, 0, "flt-modes");
  const bySlug = new Map(skills.map((s) => [s.slug, s]));
  let checked = 0;
  for (const agent of fleet.agents) {
    const script = scriptFor(agent, bySlug, 11);
    const declared = new Set(
      agent.skillSet.flatMap((slug) => bySlug.get(slug)!.failure_modes.map((f) => f.failure)),
    );
    for (const step of script.steps) {
      if (!step.failure) continue;
      checked++;
      assert.ok(declared.has(step.failure.failure), `invented failure: ${step.failure.failure}`);
    }
  }
  assert.ok(checked > 0, "no failures were simulated, so the assertion proved nothing");
});

test("an escalated agent quotes its own escalation rule and never reaches validation", async () => {
  const skills = await registry();
  const fleet = planFleet(request({ size: 76 }), skills, 0, "flt-esc");
  const bySlug = new Map(skills.map((s) => [s.slug, s]));
  let escalated = 0;
  for (const agent of fleet.agents) {
    const script = scriptFor(agent, bySlug, 5);
    if (script.outcome !== "escalated") continue;
    escalated++;
    const declared = new Set(
      agent.skillSet.flatMap((slug) => bySlug.get(slug)!.escalation.map((e) => e.condition)),
    );
    assert.ok(declared.has(script.escalation!.condition));
    assert.equal(script.failingChecks.length, 0);
    assert.notEqual(script.stoppedAt, null);
  }
  assert.ok(escalated > 0, "no agent escalated, so the assertion proved nothing");
});

test("a fleet runs to completion and every agent reaches a terminal status", async () => {
  const skills = await registry();
  const engine = new FleetEngine(() => 0, 1000);
  const fleet = engine.deploy(request({ size: 40, concurrency: 10 }), skills);
  drain(engine, fleet.id);
  assert.equal(fleet.status, "complete");
  for (const agent of fleet.agents) {
    assert.ok(TERMINAL_STATUSES.includes(agent.status), `${agent.id} stuck in ${agent.status}`);
  }
});

test("concurrency is never exceeded while the fleet runs", async () => {
  const skills = await registry();
  const engine = new FleetEngine(() => 0, 1000);
  const fleet = engine.deploy(request({ size: 50, concurrency: 6 }), skills);
  for (let t = 100; t <= 400_000; t += 100) {
    engine.advanceTo(fleet.id, t);
    const running = fleet.agents.filter((a) => a.status === "running").length;
    assert.ok(running <= 6, `${running} agents running against a cap of 6`);
    if (engine.get(fleet.id)?.status !== "running") break;
  }
});

test("a gated fleet stops and waits for a person, then finishes once approved", async () => {
  const skills = await registry();
  const engine = new FleetEngine(() => 0, 1000);
  const fleet = engine.deploy(
    request({ size: 40, concurrency: 8, approvalThreshold: "high" }),
    skills,
  );
  drain(engine, fleet.id);
  const gated = fleet.agents.filter((a) => a.status === "awaiting-approval");
  assert.ok(gated.length > 0, "nothing was gated, so the assertion proved nothing");
  assert.equal(fleet.status, "paused");

  engine.approve(fleet.id);
  assert.equal(fleet.agents.filter((a) => a.status === "awaiting-approval").length, 0);
  drain(engine, fleet.id, 400_100, 100, 900_000);
  assert.equal(fleet.status, "complete");
});

test("approving one agent releases only that agent", async () => {
  const skills = await registry();
  const engine = new FleetEngine(() => 0, 1000);
  const fleet = engine.deploy(request({ size: 40, approvalThreshold: "high" }), skills);
  const gated = fleet.agents.filter((a) => a.status === "awaiting-approval");
  engine.approve(fleet.id, gated[0].id);
  assert.notEqual(gated[0].status, "awaiting-approval");
  assert.equal(gated[1].status, "awaiting-approval");
});

test("aborting stops every agent that had not finished", async () => {
  const skills = await registry();
  const engine = new FleetEngine(() => 0, 1000);
  const fleet = engine.deploy(request({ size: 30, concurrency: 5 }), skills);
  engine.advanceTo(fleet.id, 200);
  engine.abort(fleet.id);
  assert.equal(fleet.status, "aborted");
  for (const agent of fleet.agents) {
    assert.ok(TERMINAL_STATUSES.includes(agent.status));
  }
  assert.ok(fleet.agents.some((a) => a.status === "aborted"));
});

test("a paused fleet makes no progress until it is resumed", async () => {
  const skills = await registry();
  const engine = new FleetEngine(() => 0, 1000);
  const fleet = engine.deploy(request({ size: 20, concurrency: 4 }), skills);
  engine.advanceTo(fleet.id, 200);
  engine.pause(fleet.id);
  const before = fleet.agents.map((a) => a.status).join("");
  engine.advanceTo(fleet.id, 50_000);
  assert.equal(fleet.agents.map((a) => a.status).join(""), before);
  engine.resume(fleet.id);
  assert.equal(fleet.status, "running");
});

test("the aggregate counts every agent exactly once", async () => {
  const skills = await registry();
  const engine = new FleetEngine(() => 0, 1000);
  const fleet = engine.deploy(request({ size: 35, approvalThreshold: "high" }), skills);
  drain(engine, fleet.id);
  const counts = aggregate(fleet);
  assert.equal(
    Object.values(counts.byStatus).reduce((a, b) => a + b, 0),
    fleet.agents.length,
  );
  assert.equal(counts.total, 35);
  assert.ok(counts.completion >= 0 && counts.completion <= 1);
});

test("the aggregate's permissions are the union of what the fleet asked for", async () => {
  const skills = await registry();
  const fleet = planFleet(request({ size: 50 }), skills, 0, "flt-perm");
  const counts = aggregate(fleet);
  const expected = new Set(fleet.agents.flatMap((a) => a.permissions));
  assert.deepEqual(counts.permissions, [...expected].sort());
});

test("a summary carries what the roster renders and nothing heavier", async () => {
  const skills = await registry();
  const fleet = planFleet(request({ size: 3 }), skills, 0, "flt-sum");
  const summary = summarise(fleet.agents[0]);
  assert.equal(summary.stepCount, fleet.agents[0].steps.length);
  assert.equal(summary.skillCount, fleet.agents[0].skillSet.length);
  assert.ok(!("steps" in summary));
});

test("the generator is a pure function of its seed", async () => {
  const a = rng(42);
  const b = rng(42);
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
  const values = Array.from({ length: 200 }, rng(9));
  assert.ok(values.every((v) => v >= 0 && v < 1));
});
