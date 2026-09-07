/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

import type { RelatedSkillGroup } from "./repository";
import type { Skill } from "./schema";

const RELATION_LABELS = {
  prerequisites: "Prerequisites",
  complementary: "Complementary",
  successors: "Successors",
  related: "Related",
} as const;

const RELATION_ORDER = ["prerequisites", "complementary", "successors", "related"] as const;

export function relatedGroups(skill: Skill, all: Skill[]): RelatedSkillGroup[] {
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  return RELATION_ORDER.map((relation) => ({
    relation,
    label: RELATION_LABELS[relation],
    skills: skill.related_skills[relation]
      .map((slug) => bySlug.get(slug))
      .filter((s): s is Skill => Boolean(s)),
  })).filter((group) => group.skills.length > 0);
}

/** Skills that name this one as a prerequisite — the inverse edge. */
export function dependents(skill: Skill, all: Skill[]): Skill[] {
  return all.filter(
    (s) =>
      s.slug !== skill.slug &&
      (s.prerequisites.includes(skill.slug) ||
        s.related_skills.prerequisites.includes(skill.slug)),
  );
}

/**
 * Resolves the full prerequisite closure in dependency order, so a composed
 * workflow can be executed without a missing precondition. Cycles are broken
 * deterministically and reported.
 */
export function prerequisiteChain(
  slugs: string[],
  all: Skill[],
): { ordered: Skill[]; cycles: string[] } {
  const bySlug = new Map(all.map((s) => [s.slug, s]));
  const ordered: Skill[] = [];
  const state = new Map<string, "visiting" | "done">();
  const cycles: string[] = [];

  const visit = (slug: string, stack: string[]) => {
    const current = state.get(slug);
    if (current === "done") return;
    if (current === "visiting") {
      cycles.push([...stack.slice(stack.indexOf(slug)), slug].join(" → "));
      return;
    }
    const skill = bySlug.get(slug);
    if (!skill) return;
    state.set(slug, "visiting");
    for (const pre of skill.related_skills.prerequisites) visit(pre, [...stack, slug]);
    state.set(slug, "done");
    ordered.push(skill);
  };

  for (const slug of slugs) visit(slug, []);
  return { ordered, cycles };
}

/**
 * Orders an explicit selection so no step runs before a prerequisite that is
 * also in the selection. Prerequisites the caller did not select are left to
 * the caller to report — this function never silently adds a step.
 */
export function orderSelection(
  selected: string[],
  prerequisitesOf: (slug: string) => string[],
): string[] {
  const done = new Set<string>();
  const visiting = new Set<string>();
  const out: string[] = [];
  const inSelection = new Set(selected);

  const visit = (slug: string) => {
    if (done.has(slug) || visiting.has(slug)) return; // a cycle stops here rather than recursing
    visiting.add(slug);
    for (const pre of prerequisitesOf(slug)) if (inSelection.has(pre)) visit(pre);
    visiting.delete(slug);
    done.add(slug);
    out.push(slug);
  };

  for (const slug of selected) visit(slug);
  return out;
}
