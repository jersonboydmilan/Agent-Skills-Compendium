"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";

export interface SearchEntry {
  kind: "skill" | "category" | "layer";
  slug: string;
  href: string;
  name: string;
  context: string;
  haystack: string;
}

function score(query: string, entry: SearchEntry): number {
  const q = query.toLowerCase();
  const name = entry.name.toLowerCase();
  if (name.startsWith(q)) return 100;
  if (name.includes(q)) return 80;
  if (entry.slug.includes(q)) return 70;
  const idx = entry.haystack.indexOf(q);
  if (idx >= 0) return 40 - Math.min(20, idx / 60);
  return 0;
}

export function SearchDialog({ entries }: { entries: SearchEntry[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    if (!query.trim()) return entries.filter((e) => e.kind !== "skill").slice(0, 8);
    return entries
      .map((entry) => ({ entry, s: score(query.trim(), entry) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((r) => r.entry);
  }, [query, entries]);

  // The dialog always opens on an empty query with the first row highlighted, and
  // leaves that way. Resetting here rather than in an effect keeps the state
  // change in the interaction that caused it, so opening costs one render.
  const openDialog = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setQuery("");
        setActive(0);
        setOpen((v) => !v);
      }
      if (event.key === "Escape") closeDialog();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDialog]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      // Hold the page still behind the dialog, and give it back afterwards.
      // The scroll container is the root element, not body.
      const root = document.documentElement;
      const previous = root.style.overflow;
      root.style.overflow = "hidden";
      return () => {
        root.style.overflow = previous;
      };
    }
    openerRef.current?.focus();
  }, [open]);

  // Keep the highlighted row visible when arrowing past the fold.
  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, results.length]);

  const commit = useCallback(
    (href: string) => {
      track({ name: "skill_search", query, results: results.length });
      closeDialog();
      router.push(href);
    },
    [closeDialog, query, results.length, router],
  );

  const optionId = (i: number) => `search-option-${i}`;

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={openDialog}
        className="flex shrink-0 items-center gap-2 border border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-1.5 text-left font-mono text-[0.75rem] whitespace-nowrap text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-rule-strong)]"
        aria-label="Search skills, categories and layers"
        aria-haspopup="dialog"
      >
        <span aria-hidden>⌕</span>
        <span className="hidden md:inline">Search capabilities</span>
        <kbd className="ml-2 hidden border border-[var(--color-rule)] px-1 text-[0.625rem] md:inline">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--color-ink)]/25 p-4 pt-[12vh] backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Search the registry"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <div
            ref={panelRef}
            className="w-full max-w-xl border border-[var(--color-rule-strong)] bg-[var(--color-surface)] shadow-2xl"
            onKeyDown={(e) => {
              // Contain Tab inside the dialog: this is the only interactive
              // surface while it is open.
              if (e.key !== "Tab") return;
              const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input',
              );
              if (!focusable?.length) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }}
          >
            <input
              ref={inputRef}
              value={query}
              role="combobox"
              aria-expanded
              aria-controls="search-results"
              aria-autocomplete="list"
              aria-activedescendant={results[active] ? optionId(active) : undefined}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, results.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && results[active]) {
                  e.preventDefault();
                  commit(results[active].href);
                }
              }}
              placeholder="Search skills, categories, layers…"
              className="w-full border-b border-[var(--color-rule)] bg-transparent px-4 py-3.5 text-[0.9375rem] outline-none placeholder:text-[var(--color-ink-faint)]"
            />
            <ul
              id="search-results"
              ref={listRef}
              role="listbox"
              aria-label="Results"
              className="max-h-[50vh] overflow-y-auto py-1"
            >
              {results.length === 0 ? (
                <li className="px-4 py-6 text-center font-mono text-[0.75rem] text-[var(--color-ink-faint)]">
                  No capability matches “{query}”. Try a shorter word, or browse the registry.
                </li>
              ) : (
                results.map((entry, i) => (
                  <li key={`${entry.kind}-${entry.slug}`} role="presentation">
                    <a
                      id={optionId(i)}
                      role="option"
                      aria-selected={i === active}
                      href={entry.href}
                      onClick={(e) => {
                        e.preventDefault();
                        commit(entry.href);
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-baseline justify-between gap-4 px-4 py-2.5 ${
                        i === active ? "bg-[var(--color-raised)]" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[0.875rem]">{entry.name}</span>
                        <span className="label block truncate">{entry.context}</span>
                      </span>
                      <span className="label shrink-0">{entry.kind}</span>
                    </a>
                  </li>
                ))
              )}
            </ul>
            {query.trim() ? (
              <div className="border-t border-[var(--color-rule)]">
                <a
                  href={`/skills?q=${encodeURIComponent(query.trim())}`}
                  onClick={(e) => {
                    e.preventDefault();
                    commit(`/skills?q=${encodeURIComponent(query.trim())}`);
                  }}
                  className="block px-4 py-2.5 text-[0.875rem] text-[var(--color-accent)]"
                >
                  Search every field for “{query.trim()}” →
                </a>
              </div>
            ) : null}
            <p aria-live="polite" className="sr-only">
              {query.trim()
                ? `${results.length} ${results.length === 1 ? "result" : "results"} for ${query}`
                : ""}
            </p>
            <p className="label border-t border-[var(--color-rule)] px-4 py-2">
              ↑↓ to move · ↵ to open · esc to close
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
