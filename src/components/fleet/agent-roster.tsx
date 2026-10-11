"use client";

import { useState } from "react";
import { LAYER_VAR } from "@/lib/format";
import type { AgentSummary } from "@/lib/fleet/types";
import { STATUS_LABEL, STATUS_VAR } from "./status";

const PAGE = 40;

/**
 * The roster, as rows. Paged rather than virtualised: 40 rows is what fits on
 * a screen anyway, and a page button is one fewer moving part than a
 * scroll-position calculation that has to survive live status changes.
 */
export function AgentRoster({
  agents,
  selectedId,
  onSelect,
}: {
  agents: AgentSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(agents.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = agents.slice(current * PAGE, current * PAGE + PAGE);

  if (!agents.length) {
    return (
      <p className="label border border-dashed border-[var(--color-rule-strong)] p-8 text-center">
        No agent matches these filters.
      </p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto border border-[var(--color-rule)]">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Deployed agents</caption>
          <thead>
            <tr className="border-b border-[var(--color-rule)] bg-[var(--color-raised)]">
              <th scope="col" className="label px-3 py-2">
                #
              </th>
              <th scope="col" className="label px-3 py-2">
                Role
              </th>
              <th scope="col" className="label px-3 py-2">
                Layer
              </th>
              <th scope="col" className="label px-3 py-2">
                Assignment
              </th>
              <th scope="col" className="label px-3 py-2">
                Progress
              </th>
              <th scope="col" className="label px-3 py-2">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((agent) => {
              const pct = agent.stepCount ? (agent.stepsDone / agent.stepCount) * 100 : 0;
              return (
                <tr
                  key={agent.id}
                  onClick={() => onSelect(agent.id)}
                  aria-selected={agent.id === selectedId}
                  className={`cursor-pointer border-b border-[var(--color-rule)] last:border-0 ${
                    agent.id === selectedId
                      ? "bg-[var(--color-accent-soft)]"
                      : "hover:bg-[var(--color-raised)]"
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-[0.75rem] tabular-nums text-[var(--color-ink-faint)]">
                    {agent.ordinal}
                  </td>
                  <th scope="row" className="px-3 py-2 text-left text-[0.875rem] font-normal">
                    <button type="button" onClick={() => onSelect(agent.id)} className="text-left">
                      {agent.role}
                    </button>
                    <span className="block font-mono text-[0.6875rem] text-[var(--color-ink-faint)]">
                      {agent.skillCount} skill{agent.skillCount === 1 ? "" : "s"}
                    </span>
                  </th>
                  <td className="px-3 py-2">
                    <span className="label" style={{ color: LAYER_VAR[agent.layer] }}>
                      {agent.layer}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[0.75rem] text-[var(--color-ink-muted)]">
                    {agent.assignment}
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-1 w-16 overflow-hidden rounded-full bg-[var(--color-rule)]"
                      >
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${pct}%`, background: STATUS_VAR[agent.status] }}
                        />
                      </span>
                      <span className="font-mono text-[0.6875rem] tabular-nums text-[var(--color-ink-faint)]">
                        {agent.stepsDone}/{agent.stepCount}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="label" style={{ color: STATUS_VAR[agent.status] }}>
                      {STATUS_LABEL[agent.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="mt-3 flex items-center justify-between">
          <p className="label">
            {current * PAGE + 1}–{Math.min((current + 1) * PAGE, agents.length)} of {agents.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(0, current - 1))}
              disabled={current === 0}
              className="border border-[var(--color-rule)] px-3 py-1 font-mono text-[0.75rem] disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(pages - 1, current + 1))}
              disabled={current >= pages - 1}
              className="border border-[var(--color-rule)] px-3 py-1 font-mono text-[0.75rem] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
