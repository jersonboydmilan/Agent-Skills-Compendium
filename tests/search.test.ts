import { strict as assert } from "node:assert";
import { test } from "node:test";
import { applyFilters, filtersFromParams, scoreSkill, searchSkills } from "../src/lib/search";
import type { Skill } from "../src/lib/schema";

function skill(over: Partial<Skill> = {}): Skill {
  return {
    id: "skl-x",
    name: "Executive Brief",
    slug: "executive-brief",
    version: "1.0.0",
    category: "writing-communication",
    layer: "L3",
    domain: null,
    description: "Compress analysis into a decision document.",
    purpose: "Give a decision-maker what they need.",
    trigger: "When a decision needs a written basis.",
    inputs: [{ name: "analysis", required: true, type: "string", description: "Body of work." }],
    prerequisites: [],
    tools: ["document-generator"],
    dependencies: [],
    procedure: [
      { step: "Read", description: "Read the source." },
      { step: "Write", description: "Write the brief." },
    ],
    decision_rules: [],
    outputs: [{ name: "brief", type: "document", description: "The brief." }],
    validation: [{ check: "Every claim is sourced." }],
    failure_modes: [{ failure: "Padding", mitigation: "Cut it." }],
    escalation: [],
    examples: [],
    related_skills: { prerequisites: [], complementary: [], successors: [], related: [] },
    complexity: "intermediate",
    build_speed: 2,
    shareability: 3,
    maturity: "production",
    tags: ["writing"],
    author: "Agent Skills Compendium",
    license: "MIT",
    risk_level: "low",
    required_permissions: [],
    restricted_actions: [],
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...over,
  } as Skill;
}

test("an exact prefix on the name outranks a body match", () => {
  const exact = skill();
  const body = skill({ slug: "other", name: "Other", description: "an executive brief matters" });
  const [first] = searchSkills("executive", [body, exact]);
  assert.equal(first.slug, "executive-brief");
});

test("every term must match somewhere", () => {
  assert.equal(scoreSkill("executive nonsenseterm", skill()), 0);
});

test("an empty query returns the collection untouched", () => {
  const all = [skill(), skill({ slug: "b", name: "B" })];
  assert.deepEqual(searchSkills("   ", all), all);
});

test("filters combine with AND across facets", () => {
  const all = [
    skill({ slug: "a", layer: "L3", maturity: "production" }),
    skill({ slug: "b", layer: "L3", maturity: "beta" }),
    skill({ slug: "c", layer: "L1", maturity: "production" }),
  ];
  const out = applyFilters(all, { layer: ["L3"], maturity: ["production"] });
  assert.deepEqual(out.map((s) => s.slug), ["a"]);
});

test("filters combine with OR inside one facet", () => {
  const all = [skill({ slug: "a", layer: "L3" }), skill({ slug: "b", layer: "L1" })];
  assert.equal(applyFilters(all, { layer: ["L1", "L3"] }).length, 2);
});

test("a tag filter matches a skill declaring any of the tags", () => {
  const all = [skill({ slug: "a", tags: ["writing"] }), skill({ slug: "b", tags: ["security"] })];
  assert.deepEqual(
    applyFilters(all, { tag: ["security"] }).map((s) => s.slug),
    ["b"],
  );
});

test("params parse comma lists and drop empty segments", () => {
  const f = filtersFromParams({ layer: "L1,,L3", speed: "3,9", q: "brief" });
  assert.deepEqual(f.layer, ["L1", "L3"]);
  assert.deepEqual(f.buildSpeed, [3]); // 9 is not a valid rating
  assert.equal(f.q, "brief");
});

test("an absent facet is undefined rather than an empty filter", () => {
  const f = filtersFromParams({});
  assert.equal(f.layer, undefined);
  assert.equal(f.q, undefined);
});
