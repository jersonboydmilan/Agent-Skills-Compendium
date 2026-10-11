"use client";

import { useMemo, useState } from "react";
import { LAYER_NAMES, LAYER_VAR } from "@/lib/format";
import type { LayerId, RiskLevel } from "@/lib/schema";
import type { MissionRequest, RosterStrategy } from "@/lib/fleet/types";
import { MAX_CONCURRENCY, MAX_FLEET_SIZE } from "@/lib/fleet/planner";

export interface RosterOption {
  slug: string;
  name: string;
  layer: LayerId;
  category: string;
  categoryName: string;
  riskLevel: RiskLevel;
}

const STRATEGY_COPY: Record<RosterStrategy, { label: string; help: string }> = {
  spread: {
    label: "Spread",
    help: "Draw from the whole registry, one agent per skill before any skill gets a second.",
  },
  category: { label: "By category", help: "Draw only from the categories you pick." },
  layer: { label: "By layer", help: "Draw only from the architectural layers you pick." },
  explicit: { label: "Explicit", help: "Deploy exactly the skills you name, and nothing else." },
};

const LAYERS: LayerId[] = ["L1", "L2", "L3", "L4", "L5"];

export function DeployPanel({
  options,
  categories,
  busy,
  onDeploy,
}: {
  options: RosterOption[];
  categories: { slug: string; name: string }[];
  busy: boolean;
  onDeploy: (request: Partial<MissionRequest>) => void;
}) {
  const [objective, setObjective] = useState("Harden the agent surface before launch");
  const [strategy, setStrategy] = useState<RosterStrategy>("spread");
  const [size, setSize] = useState(120);
  const [concurrency, setConcurrency] = useState(16);
  const [approvalThreshold, setApprovalThreshold] = useState<RiskLevel | "none">("high");
  const [seed, setSeed] = useState(1);
  const [pickedCategories, setPickedCategories] = useState<string[]>([]);
  const [pickedLayers, setPickedLayers] = useState<LayerId[]>([]);
  const [pickedSkills, setPickedSkills] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  // How many distinct roles the fleet can actually field. Above that, agents
  // share a role on a different shard, and the operator should know.
  const poolSize = useMemo(() => {
    if (strategy === "explicit") return pickedSkills.length;
    if (strategy === "category" && pickedCategories.length) {
      return options.filter((o) => pickedCategories.includes(o.category)).length;
    }
    if (strategy === "layer" && pickedLayers.length) {
      return options.filter((o) => pickedLayers.includes(o.layer)).length;
    }
    return options.length;
  }, [strategy, pickedSkills, pickedCategories, pickedLayers, options]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = options.filter((o) => !pickedSkills.includes(o.slug));
    if (!q) return pool.slice(0, 8);
    return pool
      .filter((o) => `${o.name} ${o.slug} ${o.categoryName}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, options, pickedSkills]);

  const toggle = <T,>(list: T[], value: T, set: (next: T[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const invalid = strategy === "explicit" && pickedSkills.length === 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (invalid || busy) return;
        onDeploy({
          objective,
          strategy,
          size,
          concurrency,
          approvalThreshold,
          seed,
          categories: pickedCategories,
          layers: pickedLayers,
          skills: pickedSkills,
        });
      }}
      className="border border-[var(--color-rule)] bg-[var(--color-surface)] p-5"
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <label className="block">
            <span className="label">Objective</span>
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              maxLength={300}
              className="mt-1.5 w-full border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-[0.9375rem] outline-none focus-visible:border-[var(--color-accent)]"
              placeholder="What is this fleet for?"
            />
          </label>

          <fieldset>
            <legend className="label">Roster strategy</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(Object.keys(STRATEGY_COPY) as RosterStrategy[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStrategy(value)}
                  aria-pressed={strategy === value}
                  className={`border px-3 py-1.5 font-mono text-[0.75rem] tracking-[0.04em] transition-colors ${
                    strategy === value
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                      : "border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:border-[var(--color-rule-strong)]"
                  }`}
                >
                  {STRATEGY_COPY[value].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[0.8125rem] text-[var(--color-ink-muted)]">
              {STRATEGY_COPY[strategy].help}
            </p>
          </fieldset>

          {strategy === "category" ? (
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggle(pickedCategories, c.slug, setPickedCategories)}
                  aria-pressed={pickedCategories.includes(c.slug)}
                  className={`rounded-full border px-2 py-0.5 font-mono text-[0.6875rem] ${
                    pickedCategories.includes(c.slug)
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                      : "border-[var(--color-rule)] text-[var(--color-ink-muted)]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}

          {strategy === "layer" ? (
            <div className="flex flex-wrap gap-1.5">
              {LAYERS.map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => toggle(pickedLayers, layer, setPickedLayers)}
                  aria-pressed={pickedLayers.includes(layer)}
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[0.6875rem] ${
                    pickedLayers.includes(layer)
                      ? "border-current"
                      : "border-[var(--color-rule)] opacity-70"
                  }`}
                  style={{ color: LAYER_VAR[layer] }}
                >
                  {layer} {LAYER_NAMES[layer]}
                </button>
              ))}
            </div>
          ) : null}

          {strategy === "explicit" ? (
            <div>
              <div className="flex flex-wrap gap-1.5">
                {pickedSkills.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setPickedSkills(pickedSkills.filter((s) => s !== slug))}
                    className="rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-2 py-0.5 font-mono text-[0.6875rem] text-[var(--color-accent-ink)]"
                  >
                    {slug} ×
                  </button>
                ))}
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the registry…"
                className="mt-2 w-full border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 text-[0.875rem] outline-none focus-visible:border-[var(--color-accent)]"
              />
              <ul className="mt-1.5 max-h-40 overflow-y-auto border border-[var(--color-rule)]">
                {searchResults.map((o) => (
                  <li key={o.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickedSkills([...pickedSkills, o.slug]);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left hover:bg-[var(--color-raised)]"
                    >
                      <span className="text-[0.875rem]">{o.name}</span>
                      <span className="label" style={{ color: LAYER_VAR[o.layer] }}>
                        {o.layer}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="label">
              Fleet size — {size} agent{size === 1 ? "" : "s"}
            </span>
            <input
              type="range"
              min={1}
              max={MAX_FLEET_SIZE}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-accent)]"
            />
          </label>

          <label className="block">
            <span className="label">Concurrency — {concurrency} at a time</span>
            <input
              type="range"
              min={1}
              max={MAX_CONCURRENCY}
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-accent)]"
            />
          </label>

          <label className="block">
            <span className="label">Hold for approval at</span>
            <select
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(e.target.value as RiskLevel | "none")}
              className="mt-1.5 w-full border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[0.8125rem]"
            >
              <option value="none">No gate — run everything</option>
              <option value="medium">Medium risk and above</option>
              <option value="high">High risk and above</option>
              <option value="critical">Critical risk only</option>
            </select>
          </label>

          <label className="block">
            <span className="label">Seed — the same seed replays the same fleet</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="mt-1.5 w-full border border-[var(--color-rule)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[0.8125rem]"
            />
          </label>

          <p className="text-[0.8125rem] text-[var(--color-ink-muted)]">
            {poolSize === 0
              ? "No skills selected — nothing would deploy."
              : size > poolSize
                ? `${poolSize} distinct roles available, so ${size} agents means up to ${Math.ceil(size / poolSize)} working each role on separate shards.`
                : `${size} of ${poolSize} available roles, one agent each.`}
          </p>

          <button
            type="submit"
            disabled={busy || invalid}
            className="w-full bg-[var(--color-ink)] px-4 py-2.5 font-mono text-[0.8125rem] tracking-[0.04em] text-[var(--color-paper)] transition-opacity disabled:opacity-40"
          >
            {busy ? "Deploying…" : `Deploy ${size} agent${size === 1 ? "" : "s"}`}
          </button>
          {invalid ? (
            <p className="text-[0.8125rem] text-[var(--color-bad)]">
              Pick at least one skill for an explicit roster.
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
