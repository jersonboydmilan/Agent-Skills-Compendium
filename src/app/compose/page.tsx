import type { Metadata } from "next";
import { Suspense } from "react";
import { repository } from "@/lib/content-store";
import { Composer, type ComposerNode } from "@/components/composer";
import { Label } from "@/components/primitives";

export const metadata: Metadata = {
  title: "Skill composer",
  description:
    "Chain agent skills into a workflow with prerequisites resolved automatically, and export the sequence as an agent specification.",
};

export default async function ComposePage() {
  const [skills, categories] = await Promise.all([
    repository.listSkills(),
    repository.listCategories(),
  ]);
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

  const nodes: ComposerNode[] = skills.map((skill) => ({
    slug: skill.slug,
    name: skill.name,
    layer: skill.layer,
    category: skill.category,
    categoryName: categoryName.get(skill.category) ?? skill.category,
    description: skill.description,
    trigger: skill.trigger,
    prerequisites: skill.related_skills.prerequisites,
    successors: skill.related_skills.successors,
    complementary: skill.related_skills.complementary,
    requiredInputs: skill.inputs.filter((i) => i.required).map((i) => i.name),
    outputs: skill.outputs.map((o) => o.name),
    tools: skill.tools,
    riskLevel: skill.risk_level,
    permissions: skill.required_permissions,
  }));

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12">
      <header className="border-b border-[var(--color-rule)] pb-8">
        <Label>Composition</Label>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.02em] sm:text-4xl">Skill composer</h1>
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
          Select skills and the composer resolves their prerequisites, orders them for execution,
          aggregates the permissions and tools they require, and reports the highest risk level in
          the chain. The result exports as a specification an agent runtime can consume.
        </p>
        <p className="mt-3 max-w-2xl text-[0.875rem] leading-relaxed text-[var(--color-ink-muted)]">
          Your selection is kept in the address bar, so a workflow survives a refresh and the link
          can be sent to someone else as-is.
        </p>
      </header>

      <div className="mt-8">
        <Suspense
          fallback={
            <p className="label border border-dashed border-[var(--color-rule-strong)] p-12 text-center">
              Loading the registry…
            </p>
          }
        >
          <Composer nodes={nodes} />
        </Suspense>
      </div>
    </div>
  );
}
