import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { repository } from "@/lib/content-store";
import { LAYER_NAMES } from "@/lib/format";
import { Label, LayerTag } from "@/components/primitives";
import { SkillCard } from "@/components/skill-card";
import { ViewTracker } from "@/components/view-tracker";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const categories = await repository.listCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await repository.getCategory(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: { title: `${category.name} — Agent Skills Compendium`, description: category.description },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [category, skills, categories] = await Promise.all([
    repository.getCategory(slug),
    repository.listSkills(),
    repository.listCategories(),
  ]);
  if (!category) notFound();

  const members = skills.filter((s) => s.category === category.slug);
  const byLayer = new Map<string, typeof members>();
  for (const skill of members) {
    byLayer.set(skill.layer, [...(byLayer.get(skill.layer) ?? []), skill]);
  }
  const layerKeys = [...byLayer.keys()].sort();

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12">
      <ViewTracker event={{ name: "category_view", slug: category.slug }} />

      <nav aria-label="Breadcrumb" className="mb-6">
        <Link href="/categories" className="label hover:text-[var(--color-ink)]">
          Categories
        </Link>
      </nav>

      <header className="border-b border-[var(--color-rule)] pb-8">
        <span aria-hidden className="text-2xl text-[var(--color-ink-faint)]">
          {category.glyph}
        </span>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.02em] sm:text-5xl">{category.name}</h1>
        <p className="mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-[var(--color-ink-muted)]">
          {category.description}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Label>{members.length} skills</Label>
          <span aria-hidden className="text-[var(--color-rule-strong)]">
            ·
          </span>
          <Label>primary layers</Label>
          {category.primary_layers.map((layer) => (
            <LayerTag key={layer} layer={layer} />
          ))}
        </div>
      </header>

      {members.length === 0 ? (
        <div className="mt-10 border border-dashed border-[var(--color-rule-strong)] p-12 text-center">
          <p className="text-[0.9375rem] text-[var(--color-ink-muted)]">
            No skill has been published in this category yet.
          </p>
          <p className="label mt-2">The category is part of the taxonomy; the coverage is not there</p>
          <Link
            href="/contribute"
            className="mt-5 inline-block border border-[var(--color-ink)] bg-[var(--color-ink)] px-4 py-2 font-mono text-[0.75rem] tracking-[0.06em] text-[var(--color-paper)] transition-opacity hover:opacity-90"
          >
            ADD THE FIRST ONE
          </Link>
        </div>
      ) : null}

      {layerKeys.map((layerKey) => {
        const group = byLayer.get(layerKey)!;
        return (
          <section key={layerKey} className="py-10">
            <div className="mb-5 flex items-baseline justify-between gap-4 border-t border-[var(--color-rule)] pt-5">
              <h2 className="text-lg font-medium">
                {layerKey} · {LAYER_NAMES[layerKey as keyof typeof LAYER_NAMES]}
              </h2>
              <Label>{group.length} skills</Label>
            </div>
            <div className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-2 lg:grid-cols-3">
              {group.map((skill) => (
                <SkillCard
                  key={skill.slug}
                  skill={skill}
                  category={categories.find((c) => c.slug === skill.category)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
