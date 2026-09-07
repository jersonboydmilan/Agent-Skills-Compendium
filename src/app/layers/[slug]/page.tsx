import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { repository } from "@/lib/content-store";
import { LAYER_VAR } from "@/lib/format";
import { Label } from "@/components/primitives";
import { SkillCard } from "@/components/skill-card";
import { ViewTracker } from "@/components/view-tracker";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const layers = await repository.listLayers();
  return layers.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const layer = await repository.getLayer(slug);
  if (!layer) return { title: "Layer not found" };
  return {
    title: `${layer.id} · ${layer.name}`,
    description: layer.description,
    alternates: { canonical: `/layers/${layer.slug}` },
  };
}

export default async function LayerPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [layer, skills, categories] = await Promise.all([
    repository.getLayer(slug),
    repository.listSkills(),
    repository.listCategories(),
  ]);
  if (!layer) notFound();

  const members = skills.filter((s) => s.layer === layer.id);
  const categoryCounts = new Map<string, number>();
  for (const skill of members) {
    categoryCounts.set(skill.category, (categoryCounts.get(skill.category) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12">
      <ViewTracker event={{ name: "layer_view", layer: layer.id }} />

      <nav aria-label="Breadcrumb" className="mb-6">
        <Link href="/layers" className="label hover:text-[var(--color-ink)]">
          Layers
        </Link>
      </nav>

      <header className="border-b border-[var(--color-rule)] pb-8">
        <span aria-hidden className="block h-1 w-12" style={{ background: LAYER_VAR[layer.id] }} />
        <h1 className="mt-5 text-3xl font-medium tracking-[-0.025em] sm:text-5xl">
          {layer.id} · {layer.name}
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-[var(--color-ink-muted)]">
          {layer.description}
        </p>
        <p
          className="mt-6 max-w-2xl border-l-2 pl-4 text-[0.9375rem] italic"
          style={{ borderColor: LAYER_VAR[layer.id] }}
        >
          {layer.question}
        </p>
      </header>

      <div className="grid gap-px border-x border-b border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-2">
        <div className="bg-[var(--color-surface)] p-6">
          <Label>Characteristics</Label>
          <ul className="mt-3 space-y-1.5 text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
            {layer.characteristics.map((c) => (
              <li key={c}>— {c}</li>
            ))}
          </ul>
        </div>
        <div className="bg-[var(--color-surface)] p-6">
          <Label>Distribution across categories</Label>
          <ul className="mt-3 space-y-1.5">
            {[...categoryCounts.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([slugKey, count]) => (
                <li key={slugKey} className="flex items-baseline justify-between gap-4">
                  <Link
                    href={`/categories/${slugKey}`}
                    className="text-[0.9375rem] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  >
                    {categories.find((c) => c.slug === slugKey)?.name ?? slugKey}
                  </Link>
                  <span className="label tabular-nums">{count}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <section className="py-10">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-medium">Skills at this layer</h2>
          <Label>{members.length} skills</Label>
        </div>
        {members.length === 0 ? (
          <div className="border border-dashed border-[var(--color-rule-strong)] p-12 text-center">
            <p className="text-[0.9375rem] text-[var(--color-ink-muted)]">
              No skill has been published at this layer yet.
            </p>
            <Link href="/skills" className="label mt-3 inline-block underline underline-offset-4">
              Browse the whole registry
            </Link>
          </div>
        ) : (
        <div className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-2 lg:grid-cols-3">
          {members.map((skill) => (
            <SkillCard
              key={skill.slug}
              skill={skill}
              category={categories.find((c) => c.slug === skill.category)}
            />
          ))}
        </div>
        )}
      </section>
    </div>
  );
}
