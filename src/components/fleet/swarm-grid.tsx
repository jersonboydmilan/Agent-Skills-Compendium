"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentStatus, AgentSummary } from "@/lib/fleet/types";
import { STATUS_LABEL, STATUS_VAR } from "./status";

/**
 * Every deployed agent, one cell each.
 *
 * At 500 agents a per-cell tab stop would mean 500 tab presses to cross the
 * grid, so the cells share one tab stop and the arrow keys move between them —
 * the roving tabindex pattern a grid of controls is supposed to use.
 */
export function SwarmGrid({
  agents,
  selectedId,
  onSelect,
}: {
  agents: AgentSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [focused, setFocused] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(24);

  // The column count is whatever fits, and the arrow keys need to know it to
  // move up and down by a row.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const styles = getComputedStyle(el);
      const template = styles.getPropertyValue("grid-template-columns").trim();
      const count = template ? template.split(/\s+/).length : 24;
      setColumns(Math.max(1, count));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [agents.length]);

  const move = useCallback(
    (delta: number) => {
      setFocused((current) => {
        const next = Math.min(Math.max(current + delta, 0), agents.length - 1);
        const node = containerRef.current?.querySelector<HTMLButtonElement>(
          `[data-cell="${next}"]`,
        );
        node?.focus();
        return next;
      });
    },
    [agents.length],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    const map: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    const delta = map[event.key];
    if (delta !== undefined) {
      event.preventDefault();
      move(delta);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      move(-agents.length);
    }
    if (event.key === "End") {
      event.preventDefault();
      move(agents.length);
    }
  };

  if (!agents.length) {
    return (
      <p className="label border border-dashed border-[var(--color-rule-strong)] p-8 text-center">
        No agent matches these filters.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      role="grid"
      aria-label={`${agents.length} deployed agents`}
      onKeyDown={onKeyDown}
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(14px, 1fr))" }}
    >
      {agents.map((agent, index) => {
        const selected = agent.id === selectedId;
        return (
          <button
            key={agent.id}
            type="button"
            data-cell={index}
            role="gridcell"
            tabIndex={index === focused ? 0 : -1}
            onFocus={() => setFocused(index)}
            onClick={() => onSelect(agent.id)}
            aria-label={`${agent.role}, ${STATUS_LABEL[agent.status]}, agent ${agent.ordinal}`}
            aria-selected={selected}
            title={`#${agent.ordinal} ${agent.role} — ${STATUS_LABEL[agent.status]}`}
            className={`aspect-square rounded-[2px] transition-[outline-color,transform] ${
              selected ? "outline-2 outline-offset-2 outline-[var(--color-ink)]" : "outline-none"
            } ${agent.status === "running" ? "agent-live" : ""}`}
            style={{
              background: STATUS_VAR[agent.status],
              opacity: agent.status === "queued" ? 0.3 : 1,
            }}
          />
        );
      })}
    </div>
  );
}

/** The legend doubles as the filter control — clicking a status filters to it. */
export function StatusLegend({
  counts,
  active,
  onToggle,
}: {
  counts: Record<AgentStatus, number>;
  active: Set<AgentStatus>;
  onToggle: (status: AgentStatus) => void;
}) {
  const entries = (Object.entries(counts) as [AgentStatus, number][]).filter(([, n]) => n > 0);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {entries.map(([status, count]) => {
        const on = active.has(status);
        return (
          <button
            key={status}
            type="button"
            onClick={() => onToggle(status)}
            aria-pressed={on}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition-colors ${
              on
                ? "border-[var(--color-ink)] bg-[var(--color-raised)]"
                : "border-transparent hover:border-[var(--color-rule-strong)]"
            }`}
          >
            <span
              aria-hidden
              className="inline-block size-2 rounded-[2px]"
              style={{ background: STATUS_VAR[status] }}
            />
            <span className="label" style={{ color: STATUS_VAR[status] }}>
              {STATUS_LABEL[status]}
            </span>
            <span className="font-mono text-[0.75rem] tabular-nums">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
