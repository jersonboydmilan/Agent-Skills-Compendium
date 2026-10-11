import type { Metadata } from "next";
import { repository } from "@/lib/content-store";
import { MissionControl } from "@/components/fleet/mission-control";
import type { RosterOption } from "@/components/fleet/deploy-panel";
import { Label } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Agent fleet",
  description:
    "Deploy hundreds of agents, each carrying a skill set drawn from the registry, against one objective — and watch every one of them.",
};

export default async function FleetPage() {
  const [skills, categories] = await Promise.all([
    repository.listSkills(),
    repository.listCategories(),
  ]);
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

  const options: RosterOption[] = skills.map((skill) => ({
    slug: skill.slug,
    name: skill.name,
    layer: skill.layer,
    category: skill.category,
    categoryName: categoryName.get(skill.category) ?? skill.category,
    riskLevel: skill.risk_level,
  }));

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12">
      <header className="border-b border-[var(--color-rule)] pb-8">
        <Label>Fleet</Label>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.02em] sm:text-4xl">Agent fleet</h1>
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
          Deploy hundreds of agents against one objective. Each carries a skill set drawn from the
          registry — a primary skill, its prerequisites in dependency order, and its complements —
          and every one of them is inspectable while it runs.
        </p>
        <div className="mt-4 max-w-2xl border-l-2 border-[var(--color-gate)] pl-4">
          <p className="text-[0.875rem] leading-relaxed text-[var(--color-ink-muted)]">
            <strong className="font-medium text-[var(--color-ink)]">
              This is a rehearsal, not an execution.
            </strong>{" "}
            No model is called and no tool is invoked. Each agent is played out against the
            definitions it carries: step durations come from the declared build speed and
            complexity, failures are drawn from the skills&rsquo; own{" "}
            <code className="font-mono text-[0.8125rem]">failure_modes</code>, recovery uses the
            mitigation the definition states, an unrecovered failure fires that skill&rsquo;s{" "}
            <code className="font-mono text-[0.8125rem]">escalation</code> rule, and a run only
            succeeds if every <code className="font-mono text-[0.8125rem]">validation</code> check
            passes. It is only ever as good as the definitions — which is the point.
          </p>
        </div>
      </header>

      <div className="mt-8">
        <MissionControl options={options} categories={categories} />
      </div>
    </div>
  );
}
