import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repository } from "@/lib/content-store";
import { relatedGroups, dependents } from "@/lib/relations";
import { toJson, toYaml } from "@/lib/export";
import {
  BUILD_SPEED_LABEL,
  COMPLEXITY_LABEL,
  LAYER_VAR,
  MATURITY_LABEL,
  RISK_LABEL,
} from "@/lib/format";
import { ArrowLink, Label, LayerTag, Meter, Pill } from "@/components/primitives";
import { ExportActions } from "@/components/export-actions";
import { ViewTracker } from "@/components/view-tracker";
import type { Skill } from "@/lib/schema";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const skills = await repository.listSkills();
  return skills.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const skill = await repository.getSkill(slug);
  if (!skill) return { title: "Skill not found" };
  return {
    title: skill.name,
    description: skill.description,
    openGraph: {
      title: `${skill.name} — Agent Skills Compendium`,
      description: skill.description,
      type: "article",
      url: `/skills/${skill.slug}`,
    },
    alternates: { canonical: `/skills/${skill.slug}` },
  };
}

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 border-t border-[var(--color-rule)] py-8">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium tracking-[-0.01em]">{title}</h2>
        {note ? <Label>{note}</Label> : null}
      </div>
      {children}
    </section>
  );
}

function KeyValueRows({ rows }: { rows: { key: string; meta?: string; value: string }[] }) {
  return (
    <ul className="divide-y divide-[var(--color-rule)] border border-[var(--color-rule)]">
      {rows.map((row, i) => (
        <li key={i} className="grid gap-1 p-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:gap-6">
          <div>
            <span className="font-mono text-[0.8125rem] text-[var(--color-ink)]">{row.key}</span>
            {row.meta ? <span className="label mt-1 block">{row.meta}</span> : null}
          </div>
          <p className="text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
            {row.value}
          </p>
        </li>
      ))}
    </ul>
  );
}

function CapabilityCard({ skill }: { skill: Skill }) {
  const metrics = [
    {
      label: "Build speed",
      value: BUILD_SPEED_LABEL[skill.build_speed],
      meter: <Meter value={skill.build_speed} label="Build speed" />,
    },
    {
      label: "Shareability",
      value: `${skill.shareability} of 3`,
      meter: (
        <Meter value={skill.shareability} label="Shareability" color="var(--color-accent)" />
      ),
    },
    { label: "Complexity", value: COMPLEXITY_LABEL[skill.complexity] },
    { label: "Maturity", value: MATURITY_LABEL[skill.maturity] },
    { label: "Risk level", value: RISK_LABEL[skill.risk_level] },
    { label: "Version", value: skill.version },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m) => (
        <div key={m.label} className="bg-[var(--color-surface)] p-4">
          <dt className="label">{m.label}</dt>
          <dd className="mt-1.5 flex items-center gap-2 text-[0.875rem]">
            <span>{m.value}</span>
            {m.meter}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function SkillPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [skill, allSkills, categories, tools] = await Promise.all([
    repository.getSkill(slug),
    repository.listSkills(),
    repository.listCategories(),
    repository.listTools(),
  ]);
  if (!skill) notFound();

  const category = categories.find((c) => c.slug === skill.category);
  const toolById = new Map(tools.map((t) => [t.id, t]));
  const groups = relatedGroups(skill, allSkills);
  const inverse = dependents(skill, allSkills);
  const yaml = toYaml(skill);
  const json = toJson(skill);

  const requiredInputs = skill.inputs.filter((i) => i.required);
  const optionalInputs = skill.inputs.filter((i) => !i.required);

  // Optional sections are omitted when a definition has nothing to put in them,
  // so the rail is derived from what was rendered rather than from the schema.
  const sections: [string, string][] = [
    ["purpose", "Purpose"],
    ["trigger", "Trigger"],
    ["inputs", "Inputs"],
    ...(skill.tools.length || skill.dependencies.length
      ? ([["tools", "Tools"]] as [string, string][])
      : []),
    ["procedure", "Procedure"],
    ...(skill.decision_rules.length
      ? ([["decision-rules", "Decision rules"]] as [string, string][])
      : []),
    ["outputs", "Outputs"],
    ["validation", "Validation"],
    ["failure-modes", "Failure modes"],
    ...(skill.escalation.length ? ([["escalation", "Escalation"]] as [string, string][]) : []),
    ...(skill.examples.length ? ([["examples", "Examples"]] as [string, string][]) : []),
    ...(groups.length || inverse.length
      ? ([["related", "Related skills"]] as [string, string][])
      : []),
    ["export", "Export"],
  ];

  return (
    <article className="mx-auto max-w-[1180px] px-5 py-12">
      <ViewTracker
        event={{
          name: "skill_view",
          slug: skill.slug,
          category: skill.category,
          layer: skill.layer,
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/skills" className="label hover:text-[var(--color-ink)]">
              Skills
            </Link>
          </li>
          <li aria-hidden className="label">
            /
          </li>
          <li>
            <Link
              href={`/categories/${skill.category}`}
              className="label hover:text-[var(--color-ink)]"
            >
              {category?.name ?? skill.category}
            </Link>
          </li>
        </ol>
      </nav>

      <header className="border-b border-[var(--color-rule)] pb-8">
        <span
          aria-hidden
          className="block h-1 w-12"
          style={{ background: LAYER_VAR[skill.layer] }}
        />
        <h1 className="mt-5 text-balance text-3xl font-medium tracking-[-0.025em] sm:text-5xl">
          {skill.name}
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-[var(--color-ink-muted)]">
          {skill.description}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <LayerTag layer={skill.layer} />
          <span aria-hidden className="text-[var(--color-rule-strong)]">
            ·
          </span>
          <Link href={`/categories/${skill.category}`} className="label hover:text-[var(--color-ink)]">
            {category?.name ?? skill.category}
          </Link>
          {skill.domain ? (
            <>
              <span aria-hidden className="text-[var(--color-rule-strong)]">
                ·
              </span>
              <Label>domain: {skill.domain}</Label>
            </>
          ) : null}
          <span aria-hidden className="text-[var(--color-rule-strong)]">
            ·
          </span>
          <Label>v{skill.version}</Label>
          <span aria-hidden className="text-[var(--color-rule-strong)]">
            ·
          </span>
          <Label>updated {skill.updated_at.slice(0, 10)}</Label>
        </div>
      </header>

      <div className="py-8">
        <CapabilityCard skill={skill} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <Section id="purpose" title="Purpose">
            <p className="max-w-[70ch] text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
              {skill.purpose}
            </p>
          </Section>

          <Section id="trigger" title="Trigger">
            <p className="max-w-[70ch] border-l-2 border-[var(--color-accent)] pl-4 text-[0.9375rem] leading-relaxed">
              {skill.trigger}
            </p>
          </Section>

          <Section
            id="inputs"
            title="Inputs"
            note={`${requiredInputs.length} required · ${optionalInputs.length} optional`}
          >
            <KeyValueRows
              rows={skill.inputs.map((input) => ({
                key: input.name,
                meta: `${input.type} · ${input.required ? "required" : "optional"}`,
                value: input.description,
              }))}
            />
          </Section>

          {skill.tools.length || skill.dependencies.length ? (
          <Section id="tools" title="Tools" note={`${skill.tools.length} registered`}>
            {skill.tools.length ? (
            <ul className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-2">
              {skill.tools.map((id) => {
                const tool = toolById.get(id);
                return (
                  <li key={id} className="bg-[var(--color-surface)] p-4">
                    <span className="font-mono text-[0.8125rem]">{tool?.name ?? id}</span>
                    <span className="label ml-2">{tool?.kind}</span>
                    <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--color-ink-muted)]">
                      {tool?.description ?? "Unregistered tool."}
                    </p>
                  </li>
                );
              })}
            </ul>
            ) : null}
            {skill.dependencies.length ? (
              <div className="mt-4">
                <Label>Dependencies</Label>
                <ul className="mt-2 space-y-1 text-[0.875rem] text-[var(--color-ink-muted)]">
                  {skill.dependencies.map((d) => (
                    <li key={d}>— {d}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Section>
          ) : null}

          <Section id="procedure" title="Procedure" note={`${skill.procedure.length} steps`}>
            <ol className="divide-y divide-[var(--color-rule)] border border-[var(--color-rule)]">
              {skill.procedure.map((step, i) => (
                <li key={i} className="grid gap-2 p-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
                  <span className="font-mono text-[0.8125rem] tabular-nums text-[var(--color-ink-faint)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[0.9375rem] font-medium">{step.step}</p>
                    <p className="mt-1.5 max-w-[68ch] text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          {skill.decision_rules.length ? (
            <Section id="decision-rules" title="Decision rules">
              <ul className="divide-y divide-[var(--color-rule)] border border-[var(--color-rule)]">
                {skill.decision_rules.map((rule, i) => (
                  <li key={i} className="p-4">
                    <p className="font-mono text-[0.75rem] uppercase tracking-[0.06em] text-[var(--color-ink-faint)]">
                      If
                    </p>
                    <p className="mt-1 text-[0.9375rem]">{rule.condition}</p>
                    <p className="mt-3 font-mono text-[0.75rem] uppercase tracking-[0.06em] text-[var(--color-accent)]">
                      Then
                    </p>
                    <p className="mt-1 text-[0.9375rem] text-[var(--color-ink-muted)]">
                      {rule.action}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section id="outputs" title="Outputs">
            <KeyValueRows
              rows={skill.outputs.map((output) => ({
                key: output.name,
                meta: output.type,
                value: output.description,
              }))}
            />
          </Section>

          <Section id="validation" title="Validation">
            <ul className="border border-[var(--color-rule)]">
              {skill.validation.map((v, i) => (
                <li
                  key={i}
                  className="flex gap-3 border-b border-[var(--color-rule)] p-4 last:border-b-0"
                >
                  <span aria-hidden className="text-[var(--color-accent)]">
                    ✓
                  </span>
                  <span className="text-[0.9375rem] leading-relaxed">{v.check}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="failure-modes" title="Failure modes">
            <ul className="divide-y divide-[var(--color-rule)] border border-[var(--color-rule)]">
              {skill.failure_modes.map((f, i) => (
                <li key={i} className="p-4">
                  <p className="text-[0.9375rem]">{f.failure}</p>
                  <p className="mt-2 flex gap-2 text-[0.9375rem] text-[var(--color-ink-muted)]">
                    <span className="label shrink-0 pt-0.5">Mitigation</span>
                    <span>{f.mitigation}</span>
                  </p>
                </li>
              ))}
            </ul>
          </Section>

          {skill.escalation.length ? (
            <Section id="escalation" title="Escalation">
              <ul className="divide-y divide-[var(--color-rule)] border border-[var(--color-rule)]">
                {skill.escalation.map((e, i) => (
                  <li key={i} className="p-4">
                    <p className="text-[0.9375rem]">{e.condition}</p>
                    <p className="mt-2 text-[0.9375rem] text-[var(--color-ink-muted)]">
                      → {e.action}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {skill.examples.length ? (
            <Section id="examples" title="Examples">
              <div className="grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)]">
                {skill.examples.map((example, i) => (
                  <div key={i} className="bg-[var(--color-surface)] p-4">
                    <p className="text-[0.9375rem] font-medium">{example.title}</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Input</Label>
                        <pre className="mt-1.5 overflow-x-auto font-mono text-[0.75rem] leading-relaxed text-[var(--color-ink-muted)]">
                          <code>{JSON.stringify(example.input, null, 2)}</code>
                        </pre>
                      </div>
                      <div>
                        <Label>Output</Label>
                        <pre className="mt-1.5 overflow-x-auto font-mono text-[0.75rem] leading-relaxed text-[var(--color-ink-muted)]">
                          <code>{JSON.stringify(example.output, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {groups.length || inverse.length ? (
            <Section id="related" title="Related skills">
              <div className="space-y-6">
                {groups.map((group) => (
                  <div key={group.relation}>
                    <Label>{group.label}</Label>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {group.skills.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/skills/${s.slug}`}
                            className="inline-flex items-center gap-2 border border-[var(--color-rule)] px-2.5 py-1.5 text-[0.8125rem] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                          >
                            <span
                              aria-hidden
                              className="inline-block size-1.5 rounded-full"
                              style={{ background: LAYER_VAR[s.layer] }}
                            />
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {inverse.length ? (
                  <div>
                    <Label>Depended on by</Label>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {inverse.map((s) => (
                        <li key={s.slug}>
                          <Link
                            href={`/skills/${s.slug}`}
                            className="inline-flex items-center gap-2 border border-dashed border-[var(--color-rule-strong)] px-2.5 py-1.5 text-[0.8125rem] transition-colors hover:text-[var(--color-accent)]"
                          >
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Section>
          ) : null}

          <Section id="export" title="Export" note="machine-readable definition">
            <ExportActions slug={skill.slug} yaml={yaml} json={json} />
            <p className="mt-4 max-w-[70ch] text-[0.875rem] leading-relaxed text-[var(--color-ink-muted)]">
              The YAML form is identical in shape to the source file, so a downloaded definition can
              be dropped into a content directory unchanged. The same document is served at{" "}
              <a
                href={`/api/skills/${skill.slug}/export?format=yaml`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[var(--color-accent)]"
              >
                /api/skills/{skill.slug}/export
              </a>
              .
            </p>
          </Section>
        </div>

        {/* Rail */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="On this page" className="border border-[var(--color-rule)] p-4">
            <Label>On this page</Label>
            <ul className="mt-3 space-y-1.5">
              {sections.map(([id, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="text-[0.8125rem] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-4 border border-[var(--color-rule)] p-4">
            <Label>Governance</Label>
            <dl className="mt-3 space-y-3 text-[0.8125rem]">
              <div>
                <dt className="label">Required permissions</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {skill.required_permissions.length ? (
                    skill.required_permissions.map((p) => (
                      <Pill key={p} tone="quiet">
                        {p}
                      </Pill>
                    ))
                  ) : (
                    <span className="text-[var(--color-ink-faint)]">none</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="label">Restricted actions</dt>
                <dd className="mt-1 space-y-1 text-[var(--color-ink-muted)]">
                  {skill.restricted_actions.length ? (
                    skill.restricted_actions.map((a) => <p key={a}>— {a}</p>)
                  ) : (
                    <span className="text-[var(--color-ink-faint)]">none</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="label">Author</dt>
                <dd className="mt-1 text-[var(--color-ink-muted)]">{skill.author}</dd>
              </div>
              <div>
                <dt className="label">License</dt>
                <dd className="mt-1 text-[var(--color-ink-muted)]">{skill.license}</dd>
              </div>
            </dl>
          </div>

          {skill.tags.length ? (
            <div className="mt-4 border border-[var(--color-rule)] p-4">
              <Label>Tags</Label>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {skill.tags.map((tag) => (
                  <li key={tag}>
                    <Link href={`/skills?tag=${encodeURIComponent(tag)}`}>
                      <Pill>{tag}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4">
            <ArrowLink href={`/compose?skills=${skill.slug}`}>Compose with this skill</ArrowLink>
          </div>
        </aside>
      </div>
    </article>
  );
}
