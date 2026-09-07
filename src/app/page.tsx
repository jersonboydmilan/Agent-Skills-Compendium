import Link from "next/link";
import { repository } from "@/lib/content-store";
import { LAYER_VAR } from "@/lib/format";
import { ArrowLink, Label, LayerTag, SectionHeading } from "@/components/primitives";
import { SkillCard } from "@/components/skill-card";

export default async function HomePage() {
  const [skills, categories, layers, tools] = await Promise.all([
    repository.listSkills(),
    repository.listCategories(),
    repository.listLayers(),
    repository.listTools(),
  ]);

  const byCategory = new Map(categories.map((c) => [c.slug, c]));
  const featured = skills
    .filter((s) => s.shareability === 3 && s.maturity === "production")
    .sort((a, b) => b.build_speed - a.build_speed || a.name.localeCompare(b.name))
    .slice(0, 6);

  // The plain-language reading of each layer. A first-time visitor is looking for
  // work to get done, not for an architecture.
  const FUNCTION: Record<string, string> = {
    L1: "Decide",
    L2: "Find out",
    L3: "Build & ship",
    L4: "Apply expertise",
    L5: "Run agents",
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <Label>Capability registry · v0.1</Label>
        <h1 className="mt-5 max-w-4xl text-balance text-4xl font-medium leading-[1.08] tracking-[-0.03em] sm:text-6xl">
          Agent Skills Compendium
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-ink-muted)]">
          A structured intelligence layer for building, understanding, and deploying AI agent
          capabilities.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/skills"
            className="border border-[var(--color-ink)] bg-[var(--color-ink)] px-4 py-2 font-mono text-[0.75rem] tracking-[0.06em] text-[var(--color-paper)] transition-opacity hover:opacity-90"
          >
            BROWSE {skills.length} SKILLS
          </Link>
          <Link
            href="/layers"
            className="border border-[var(--color-rule-strong)] px-4 py-2 font-mono text-[0.75rem] tracking-[0.06em] transition-colors hover:border-[var(--color-ink)]"
          >
            THE FIVE LAYERS
          </Link>
        </div>
        <dl className="mt-14 grid grid-cols-2 gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-4">
          {[
            ["Skills specified", skills.length],
            ["Categories", categories.length],
            ["Architectural layers", layers.length],
            ["Tools registered", tools.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-[var(--color-surface)] px-4 py-5">
              <dt className="label">{label}</dt>
              <dd className="mt-1.5 font-mono text-2xl tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* What is an Agent Skill */}
      <section className="py-16" id="what-is-a-skill">
        <SectionHeading
          eyebrow="Definition"
          title="What is an agent skill?"
          lead="The distinction this entire registry is built on."
        />
        <div className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] md:grid-cols-3">
          {[
            {
              term: "Tool",
              body: "Something an agent can use. A browser, a SQL client, a deployment system. A tool has capabilities but no judgement about when to apply them.",
            },
            {
              term: "Prompt",
              body: "An instruction for one occasion. It may produce a good result once, but it carries no validation, no failure handling and no escalation path.",
            },
            {
              term: "Skill",
              body: "Something an agent knows how to accomplish. It names its trigger, its inputs, its procedure, how it validates the outcome, how it fails and when it stops.",
            },
          ].map((item) => (
            <div key={item.term} className="bg-[var(--color-surface)] p-6">
              <Label>{item.term}</Label>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-px border border-t-0 border-[var(--color-rule)] bg-[var(--color-raised)] p-6">
          <Label>Worked example</Label>
          <p className="mt-3 font-mono text-[0.8125rem] leading-relaxed text-[var(--color-ink-muted)]">
            <span className="text-[var(--color-ink)]">skill</span> competitive_intelligence_report
            <br />
            <span className="text-[var(--color-ink)]">tools</span> web-search · web-browser ·
            document-parser · document-generator
            <br />
            <span className="text-[var(--color-ink)]">outcome</span> a sourced assessment where every
            material claim carries provenance, a confidence signal and a stated gap
          </p>
          <ArrowLink href="/skills/competitive-intelligence-report" className="mt-4">
            Open the specification
          </ArrowLink>
        </div>
      </section>

      {/* Five architectural layers */}
      <section className="py-16" id="layers">
        <SectionHeading
          eyebrow="Architecture"
          title="Five architectural layers"
          lead="Every skill belongs to one primary layer. Start from the kind of work you need done — the layer also tells you what can go wrong there and what verification is appropriate."
          action={<ArrowLink href="/layers">All layers</ArrowLink>}
        />
        <div className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] lg:grid-cols-5">
          {layers.map((layer) => {
            const count = skills.filter((s) => s.layer === layer.id).length;
            return (
              <Link
                key={layer.id}
                href={`/layers/${layer.slug}`}
                className="group bg-[var(--color-surface)] p-5 transition-colors hover:bg-[var(--color-raised)]"
              >
                <span
                  aria-hidden
                  className="block h-1 w-8"
                  style={{ background: LAYER_VAR[layer.id] }}
                />
                <div className="mt-4">
                  <LayerTag layer={layer.id} withName={false} />
                </div>
                <h3 className="mt-2 text-lg font-medium tracking-[-0.01em]">
                  {FUNCTION[layer.id]}
                </h3>
                <p className="label mt-1">{layer.name}</p>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--color-ink-muted)]">
                  {layer.tagline}
                </p>
                <p className="label mt-4">{count} skills</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Skill universe */}
      <section className="py-16" id="universe">
        <SectionHeading
          eyebrow="Skill universe"
          title={`${categories.length} categories`}
          lead="The taxonomy lives in the data layer, not in the application. Categories are added by writing content, not by shipping code."
          action={<ArrowLink href="/categories">All categories</ArrowLink>}
        />
        <div className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const count = skills.filter((s) => s.category === category.slug).length;
            return (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group flex items-start justify-between gap-3 bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-raised)]"
              >
                <span className="min-w-0">
                  <span aria-hidden className="text-[var(--color-ink-faint)]">
                    {category.glyph}
                  </span>
                  <span className="mt-2 block text-[0.9375rem] font-medium leading-snug group-hover:text-[var(--color-accent)]">
                    {category.name}
                  </span>
                </span>
                <span className="label shrink-0 tabular-nums">{count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured skills */}
      <section className="py-16" id="featured">
        <SectionHeading
          eyebrow="Featured"
          title="Production skills people reuse"
          lead="Selected for shareability and maturity — specifications complete enough to hand to another team."
          action={<ArrowLink href="/skills?share=3&maturity=production">See all</ArrowLink>}
        />
        <div className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((skill) => (
            <SkillCard key={skill.slug} skill={skill} category={byCategory.get(skill.category)} />
          ))}
        </div>
      </section>

      {/* Composer teaser */}
      <section className="py-16" id="composer">
        <SectionHeading
          eyebrow="Composition"
          title="Skills compose into workflows"
          lead="Prerequisites, complements and successors are modelled as first-class edges. Select skills, resolve their preconditions, and export the sequence as an agent specification."
          action={<ArrowLink href="/compose">Open the composer</ArrowLink>}
        />
        <div className="border border-[var(--color-rule)] bg-[var(--color-surface)] p-6">
          <ol className="flex flex-col gap-3 font-mono text-[0.8125rem] sm:flex-row sm:items-center">
            {[
              "source-credibility-assessment",
              "competitive-intelligence-report",
              "positioning-framework",
              "executive-brief",
            ].map((slug, i, arr) => (
              <li key={slug} className="flex items-center gap-3">
                <Link
                  href={`/skills/${slug}`}
                  className="border border-[var(--color-rule)] px-2.5 py-1.5 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  {slug}
                </Link>
                {i < arr.length - 1 ? (
                  <span aria-hidden className="text-[var(--color-ink-faint)]">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Machine-readable */}
      <section className="py-16" id="machine-readable">
        <SectionHeading
          eyebrow="Machine interface"
          title="Written for agents as much as for people"
          lead="Every skill is a validated document against a single canonical schema. The same definition that renders this page is what an agent consumes."
          action={<ArrowLink href="/api-reference">API reference</ArrowLink>}
        />
        <div className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] md:grid-cols-2">
          <div className="bg-[var(--color-surface)] p-6">
            <Label>Endpoints</Label>
            <ul className="mt-3 space-y-1.5 font-mono text-[0.8125rem] text-[var(--color-ink-muted)]">
              {[
                "GET /api/skills",
                "GET /api/skills/:slug",
                "GET /api/skills/:slug/related",
                "GET /api/skills/:slug/export?format=yaml",
                "GET /api/categories",
                "GET /api/layers",
                "GET /api/search?q=",
              ].map((route) => (
                <li key={route}>{route}</li>
              ))}
            </ul>
          </div>
          <div className="bg-[var(--color-surface)] p-6">
            <Label>Guarantees</Label>
            <ul className="mt-3 space-y-2 text-[0.875rem] leading-relaxed text-[var(--color-ink-muted)]">
              <li>Every definition validates against the canonical schema before it ships.</li>
              <li>Every relationship resolves to a skill that exists.</li>
              <li>YAML export is round-trippable into a content directory unchanged.</li>
              <li>Versions are semver; slugs are stable identifiers.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Contribute */}
      <section className="pb-8 pt-16" id="contribute">
        <SectionHeading
          eyebrow="Contribute"
          title="Add a capability"
          lead="A skill is admitted when it answers all ten questions: what it does, when to use it, what it needs, what tools it may use, how it runs, how it validates, what goes wrong, when to escalate, what it produces and what it connects to."
          action={<ArrowLink href="/contribute">Contribution standard</ArrowLink>}
        />
      </section>
    </div>
  );
}
