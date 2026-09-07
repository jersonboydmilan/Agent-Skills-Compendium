import type { Metadata } from "next";
import Link from "next/link";
import { repository } from "@/lib/content-store";
import { applyFilters, filtersFromParams } from "@/lib/search";
import {
  BUILD_SPEED_LABEL,
  COMPLEXITY_LABEL,
  LAYER_NAMES,
  MATURITY_LABEL,
  RISK_LABEL,
  SHAREABILITY_LABEL,
} from "@/lib/format";
import { SkillFilters, type Facet } from "@/components/skill-filters";
import { SkillCard } from "@/components/skill-card";
import { Label } from "@/components/primitives";
import { COMPLEXITIES, LAYER_IDS, MATURITIES, RISK_LEVELS, type Skill } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Skill registry",
  description:
    "Search and filter the full registry of specified agent skills by category, architectural layer, complexity, maturity, build speed and shareability.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function countBy<T extends string | number>(skills: Skill[], pick: (s: Skill) => T) {
  const counts = new Map<T, number>();
  for (const skill of skills) {
    const key = pick(skill);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export default async function SkillsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = filtersFromParams(params);

  const [skills, categories] = await Promise.all([
    repository.listSkills(),
    repository.listCategories(),
  ]);
  const byCategory = new Map(categories.map((c) => [c.slug, c]));
  const results = applyFilters(skills, filters);

  const categoryCounts = countBy(skills, (s) => s.category);
  const layerCounts = countBy(skills, (s) => s.layer);
  const complexityCounts = countBy(skills, (s) => s.complexity);
  const maturityCounts = countBy(skills, (s) => s.maturity);
  const speedCounts = countBy(skills, (s) => s.build_speed);
  const shareCounts = countBy(skills, (s) => s.shareability);
  const riskCounts = countBy(skills, (s) => s.risk_level);

  const facets: Facet[] = [
    {
      param: "layer",
      label: "Architectural layer",
      options: LAYER_IDS.map((id) => ({
        value: id,
        label: `${id} ${LAYER_NAMES[id]}`,
        count: layerCounts.get(id) ?? 0,
      })),
    },
    {
      param: "category",
      label: "Category",
      options: categories.map((c) => ({
        value: c.slug,
        label: c.name,
        count: categoryCounts.get(c.slug) ?? 0,
      })),
    },
    {
      param: "complexity",
      label: "Complexity",
      options: COMPLEXITIES.map((c) => ({
        value: c,
        label: COMPLEXITY_LABEL[c],
        count: complexityCounts.get(c) ?? 0,
      })),
    },
    {
      param: "maturity",
      label: "Maturity",
      options: MATURITIES.map((m) => ({
        value: m,
        label: MATURITY_LABEL[m],
        count: maturityCounts.get(m) ?? 0,
      })),
    },
    {
      param: "speed",
      label: "Build speed",
      options: ([3, 2, 1] as const).map((v) => ({
        value: String(v),
        label: BUILD_SPEED_LABEL[v],
        count: speedCounts.get(v) ?? 0,
      })),
    },
    {
      param: "share",
      label: "Shareability",
      options: ([3, 2, 1] as const).map((v) => ({
        value: String(v),
        label: SHAREABILITY_LABEL[v],
        count: shareCounts.get(v) ?? 0,
      })),
    },
    {
      param: "risk",
      label: "Risk level",
      options: RISK_LEVELS.map((r) => ({
        value: r,
        label: RISK_LABEL[r],
        count: riskCounts.get(r) ?? 0,
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12">
      <header className="border-b border-[var(--color-rule)] pb-8">
        <Label>Registry</Label>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.02em] sm:text-4xl">Skill registry</h1>
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
          Every entry is a complete specification: trigger, inputs, tools, procedure, decision rules,
          validation, failure modes and escalation.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <SkillFilters facets={facets} total={results.length} />
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <Label>
              {results.length} of {skills.length} skills
            </Label>
            {filters.q ? <Label>query “{filters.q}”</Label> : null}
          </div>

          {results.length === 0 ? (
            <div className="border border-dashed border-[var(--color-rule-strong)] p-12 text-center">
              <p className="text-[0.9375rem] text-[var(--color-ink-muted)]">
                No skill matches these constraints.
              </p>
              <p className="mt-2 text-[0.875rem] text-[var(--color-ink-muted)]">
                {filters.q
                  ? `Nothing in the registry matches \u201c${filters.q}\u201d with the filters you have on.`
                  : "The filters you have on have no skill in common."}
              </p>
              <Link
                href="/skills"
                className="mt-5 inline-block border border-[var(--color-ink)] bg-[var(--color-ink)] px-4 py-2 font-mono text-[0.75rem] tracking-[0.06em] text-[var(--color-paper)] transition-opacity hover:opacity-90"
              >
                CLEAR ALL FILTERS
              </Link>
            </div>
          ) : (
            <div className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-2 xl:grid-cols-3">
              {results.map((skill) => (
                <SkillCard key={skill.slug} skill={skill} category={byCategory.get(skill.category)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
