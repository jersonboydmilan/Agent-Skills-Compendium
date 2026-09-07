"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { track } from "@/lib/analytics";

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface Facet {
  param: string;
  label: string;
  options: FacetOption[];
}

export function SkillFilters({ facets, total }: { facets: Facet[]; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");
  // Below `lg` the facet list is a disclosure: seventy-odd chips otherwise push
  // the first result several screens down on a phone.
  const [open, setOpen] = useState(false);

  const selected = useCallback(
    (param: string): string[] => {
      const raw = params.get(param);
      return raw ? raw.split(",").filter(Boolean) : [];
    },
    [params],
  );

  const push = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router],
  );

  const toggle = (param: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    const current = selected(param);
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (updated.length) next.set(param, updated.join(","));
    else next.delete(param);
    track({ name: "skill_filter", facet: param, value });
    push(next);
  };

  const submitQuery = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === (params.get("q") ?? "")) return; // nothing changed — don't churn the URL
    const next = new URLSearchParams(params.toString());
    if (trimmed) next.set("q", trimmed);
    else next.delete("q");
    track({ name: "skill_search", query: trimmed, results: total });
    push(next);
  };

  const clearAll = () => {
    setQuery("");
    push(new URLSearchParams());
  };

  const facetCount = facets.reduce((n, f) => n + selected(f.param).length, 0);
  const activeCount = facetCount + (params.get("q") ? 1 : 0);

  return (
    <div className="border border-[var(--color-rule)] bg-[var(--color-surface)]">
      <form
        className="flex items-center gap-2 border-b border-[var(--color-rule)] px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          submitQuery(query);
        }}
        role="search"
      >
        <span aria-hidden className="text-[var(--color-ink-faint)]">
          ⌕
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => submitQuery(query)}
          placeholder="Filter capabilities…"
          aria-label="Search skills"
          className="w-full min-w-0 bg-transparent text-[0.9375rem] outline-none placeholder:text-[var(--color-ink-faint)]"
        />
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="label whitespace-nowrap underline decoration-[var(--color-rule-strong)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            Clear {activeCount}
          </button>
        ) : null}
      </form>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="skill-facets"
        className="flex w-full items-center justify-between gap-3 border-b border-[var(--color-rule)] px-4 py-3 text-left lg:hidden"
      >
        <span className="label">
          Filters{facetCount > 0 ? ` · ${facetCount} on` : ""}
        </span>
        <span className="label" aria-hidden>
          {open ? "Hide ▲" : "Show ▼"}
        </span>
      </button>

      <div
        id="skill-facets"
        className={`${open ? "block" : "hidden"} divide-y divide-[var(--color-rule)] lg:block ${
          pending ? "opacity-60" : ""
        }`}
        aria-busy={pending}
      >
        {facets.map((facet) => {
          const active = selected(facet.param);
          return (
            <fieldset key={facet.param} className="px-4 py-3">
              <legend className="label">{facet.label}</legend>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {facet.options.map((option) => {
                  const on = active.includes(option.value);
                  // A facet nobody can match is shown but not selectable: it documents
                  // the vocabulary without offering a guaranteed empty result.
                  const empty = option.count === 0 && !on;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={on}
                      disabled={empty}
                      onClick={() => toggle(facet.param, option.value)}
                      className={`inline-flex min-h-[1.75rem] items-baseline gap-1.5 border px-2 py-1 font-mono text-[0.6875rem] tracking-[0.04em] transition-colors ${
                        on
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                          : empty
                            ? "cursor-not-allowed border-[var(--color-rule)] text-[var(--color-ink-faint)] opacity-50"
                            : "border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:border-[var(--color-rule-strong)]"
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className="tabular-nums opacity-60">{option.count}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
