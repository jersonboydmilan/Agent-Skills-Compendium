import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  dependents,
  orderSelection,
  prerequisiteChain,
  relatedGroups,
} from "../src/lib/relations";
import type { Skill } from "../src/lib/schema";

const base = {
  id: "x",
  version: "1.0.0",
  category: "c",
  layer: "L1",
  domain: null,
  description: "d",
  purpose: "p",
  trigger: "t",
  inputs: [{ name: "i", required: true, type: "string", description: "d" }],
  prerequisites: [],
  tools: [],
  dependencies: [],
  procedure: [
    { step: "a", description: "a" },
    { step: "b", description: "b" },
  ],
  decision_rules: [],
  outputs: [{ name: "o", type: "t", description: "d" }],
  validation: [{ check: "c" }],
  failure_modes: [{ failure: "f", mitigation: "m" }],
  escalation: [],
  examples: [],
  complexity: "beginner",
  build_speed: 1,
  shareability: 1,
  maturity: "beta",
  tags: [],
  author: "a",
  license: "MIT",
  risk_level: "low",
  required_permissions: [],
  restricted_actions: [],
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

function node(slug: string, related: Partial<Skill["related_skills"]> = {}): Skill {
  return {
    ...base,
    name: slug,
    slug,
    related_skills: {
      prerequisites: [],
      complementary: [],
      successors: [],
      related: [],
      ...related,
    },
  } as Skill;
}

test("a dangling edge is dropped rather than rendered as a broken link", () => {
  const a = node("a", { complementary: ["ghost"] });
  assert.deepEqual(relatedGroups(a, [a]), []);
});

test("groups keep prerequisite-first order", () => {
  const b = node("b");
  const c = node("c");
  const a = node("a", { successors: ["c"], prerequisites: ["b"] });
  assert.deepEqual(
    relatedGroups(a, [a, b, c]).map((g) => g.relation),
    ["prerequisites", "successors"],
  );
});

test("dependents finds the inverse edge and excludes the skill itself", () => {
  const a = node("a");
  const b = node("b", { prerequisites: ["a"] });
  assert.deepEqual(
    dependents(a, [a, b]).map((s) => s.slug),
    ["b"],
  );
});

test("the prerequisite chain is ordered so nothing runs before its precondition", () => {
  const a = node("a");
  const b = node("b", { prerequisites: ["a"] });
  const c = node("c", { prerequisites: ["b"] });
  const { ordered, cycles } = prerequisiteChain(["c"], [a, b, c]);
  assert.deepEqual(ordered.map((s) => s.slug), ["a", "b", "c"]);
  assert.deepEqual(cycles, []);
});

test("a cycle is broken deterministically and reported", () => {
  const a = node("a", { prerequisites: ["b"] });
  const b = node("b", { prerequisites: ["a"] });
  const { ordered, cycles } = prerequisiteChain(["a"], [a, b]);
  assert.equal(cycles.length, 1);
  assert.equal(ordered.length, 2);
});

test("a selection is ordered so a selected prerequisite comes first", () => {
  const pre: Record<string, string[]> = { c: ["b"], b: ["a"], a: [] };
  assert.deepEqual(orderSelection(["c", "a", "b"], (s) => pre[s] ?? []), ["a", "b", "c"]);
});

test("an unselected prerequisite does not get added to the sequence", () => {
  const pre: Record<string, string[]> = { b: ["a"] };
  assert.deepEqual(orderSelection(["b"], (s) => pre[s] ?? []), ["b"]);
});

test("a cyclic selection still terminates and keeps every member once", () => {
  const pre: Record<string, string[]> = { a: ["b"], b: ["a"] };
  const out = orderSelection(["a", "b"], (s) => pre[s] ?? []);
  assert.deepEqual([...out].sort(), ["a", "b"]);
});
