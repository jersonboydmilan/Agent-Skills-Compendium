import type { Metadata } from "next";
import Link from "next/link";
import { ENDPOINTS } from "@/lib/api-spec";
import { repository } from "@/lib/content-store";
import { Label } from "@/components/primitives";

export const metadata: Metadata = {
  title: "API reference",
  description:
    "The read API over the Agent Skills Compendium registry: list and filter skills, resolve relationships, export portable definitions, and search across skills, categories and layers.",
  alternates: { canonical: "/api-reference" },
};

export default async function ApiReferencePage() {
  const [skills, categories, layers] = await Promise.all([
    repository.listSkills(),
    repository.listCategories(),
    repository.listLayers(),
  ]);

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12">
      <header className="border-b border-[var(--color-rule)] pb-8">
        <Label>Machine interface</Label>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.02em] sm:text-4xl">API reference</h1>
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
          The same definitions that render this site are what an agent consumes. Every response is
          public, CORS-open and cacheable, and needs no authentication. {skills.length} skills,{" "}
          {categories.length} categories, {layers.length} layers.
        </p>
      </header>

      <section className="border-b border-[var(--color-rule)] py-8">
        <h2 className="text-lg font-medium">Conventions</h2>
        <ul className="mt-3 max-w-[70ch] space-y-2 text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
          <li>
            — Skills are addressed by <span className="font-mono text-[0.875rem]">slug</span>, which
            is also the source filename and the page route. The content validator enforces all three
            agreeing, so a slug is a stable identifier rather than a location.
          </li>
          <li>
            — List filters accept comma-separated values and combine with AND across parameters, OR
            within one.
          </li>
          <li>
            — <span className="font-mono text-[0.875rem]">/api/skills</span> takes the same query
            parameters as the <Link href="/skills" className="text-[var(--color-accent)]">/skills</Link>{" "}
            page, so a URL you are looking at and a URL an agent fetches describe the same result set.
          </li>
          <li>
            — Unknown slugs return <span className="font-mono text-[0.875rem]">404</span> with{" "}
            <span className="font-mono text-[0.875rem]">{"{ error }"}</span>.
          </li>
        </ul>
      </section>

      <div className="divide-y divide-[var(--color-rule)]">
        {ENDPOINTS.map((endpoint) => (
          <section key={endpoint.path + endpoint.summary} className="py-8">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="border border-[var(--color-rule)] px-1.5 py-0.5 font-mono text-[0.6875rem] tracking-[0.06em] text-[var(--color-ink-muted)]">
                {endpoint.method}
              </span>
              <code className="font-mono text-[0.9375rem] text-[var(--color-ink)]">
                {endpoint.path}
              </code>
              <span className="label">{endpoint.summary}</span>
            </div>

            <p className="mt-3 max-w-[70ch] text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
              {endpoint.description}
            </p>

            {endpoint.params.length > 0 && (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--color-rule)]">
                      <th className="label py-2 pr-4 font-normal">Parameter</th>
                      <th className="label py-2 pr-4 font-normal">Type</th>
                      <th className="label py-2 font-normal">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.params.map((p) => (
                      <tr key={p.name} className="border-b border-[var(--color-rule)] last:border-b-0">
                        <td className="py-2 pr-4 align-top font-mono text-[0.8125rem] whitespace-nowrap">
                          {p.name}
                        </td>
                        <td className="py-2 pr-4 align-top font-mono text-[0.75rem] text-[var(--color-ink-faint)]">
                          {p.type}
                        </td>
                        <td className="py-2 align-top text-[0.875rem] leading-relaxed text-[var(--color-ink-muted)]">
                          {p.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 grid gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-2">
              <div className="bg-[var(--color-surface)] p-4">
                <Label>Returns</Label>
                <code className="mt-1.5 block font-mono text-[0.8125rem] text-[var(--color-ink-muted)]">
                  {endpoint.returns}
                </code>
              </div>
              <div className="bg-[var(--color-surface)] p-4">
                <Label>Try it</Label>
                <a
                  href={endpoint.example}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 block break-all font-mono text-[0.8125rem] text-[var(--color-accent)] hover:underline"
                >
                  {endpoint.example}
                </a>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="border-t border-[var(--color-rule)] py-8">
        <h2 className="text-lg font-medium">Using it without this application</h2>
        <p className="mt-3 max-w-[70ch] text-[0.9375rem] leading-relaxed text-[var(--color-ink-muted)]">
          The application is one consumer of the registry, not a dependency of it. The canonical
          definitions are YAML files, and a generated JSON Schema is published alongside them, so
          anything that can read YAML and validate JSON can use the registry directly.
        </p>
        <pre className="mt-4 overflow-x-auto border border-[var(--color-rule)] bg-[var(--color-raised)] p-4 font-mono text-[0.75rem] leading-relaxed">
          <code>{`# fetch a portable definition
curl <host>/api/skills/source-credibility-assessment/export?format=json > skill.json

# fetch the canonical schema and validate the definition against it
curl <host>/api/schema > skill.schema.json
npx ajv validate -s skill.schema.json -d skill.json`}</code>
        </pre>
      </section>
    </div>
  );
}
