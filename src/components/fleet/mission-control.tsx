"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { RISK_LABEL } from "@/lib/format";
import type { RiskLevel } from "@/lib/schema";
import type {
  AgentStatus,
  AgentSummary,
  FleetAggregate,
  FleetEvent,
  FleetStatus,
  MissionRequest,
} from "@/lib/fleet/types";
import { DeployPanel, type RosterOption } from "./deploy-panel";
import { AgentRoster } from "./agent-roster";
import { AgentDrawer } from "./agent-drawer";
import { StatusLegend, SwarmGrid } from "./swarm-grid";
import { FLEET_STATUS_LABEL, STATUS_VAR, formatDuration } from "./status";
import { useNow } from "./use-now";

interface FleetMeta {
  id: string;
  objective: string;
  status: FleetStatus;
  request: MissionRequest;
  createdAt: number;
  startedAt: number | null;
  endedAt: number | null;
  notices: string[];
}

interface Envelope {
  fleet: FleetMeta;
  aggregate: FleetAggregate;
  events: FleetEvent[];
  agents?: AgentSummary[];
}

export function MissionControl({
  options,
  categories,
}: {
  options: RosterOption[];
  categories: { slug: string; name: string }[];
}) {
  const [fleet, setFleet] = useState<FleetMeta | null>(null);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [summary, setSummary] = useState<FleetAggregate | null>(null);
  const [events, setEvents] = useState<FleetEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<AgentStatus>>(new Set());
  const [view, setView] = useState<"grid" | "roster">("grid");
  const [selected, setSelected] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const apply = useCallback((data: Envelope) => {
    setFleet(data.fleet);
    setSummary(data.aggregate);
    setEvents(data.events);
    if (data.agents) setAgents(data.agents);
  }, []);

  // One stream per fleet. The server pushes the roster on a timer and the feed
  // as it happens, so a 500-agent fleet is one connection rather than a poll
  // per agent.
  useEffect(() => {
    if (!fleet) return;
    const source = new EventSource(`/api/fleet/${fleet.id}/stream`);
    sourceRef.current = source;

    source.addEventListener("snapshot", (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      setAgents(data.agents);
      setSummary(data.aggregate);
      setFleet((current) => (current ? { ...current, status: data.status } : current));
    });
    source.addEventListener("event", (event) => {
      const line = JSON.parse((event as MessageEvent).data) as FleetEvent;
      setEvents((current) => [...current.slice(-59), line]);
    });
    source.onerror = () => {
      // The server closes the stream when a fleet settles; that is not a fault.
      source.close();
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [fleet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const deploy = async (request: Partial<MissionRequest>) => {
    setBusy(true);
    setError(null);
    setSelected(null);
    setStatusFilter(new Set());
    sourceRef.current?.close();
    try {
      const res = await fetch("/api/fleet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "The fleet could not be deployed.");
      apply(data);
      track({ name: "composer_export", count: data.agents?.length ?? 0 });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The fleet could not be deployed.");
    } finally {
      setBusy(false);
    }
  };

  const control = async (action: "pause" | "resume" | "abort" | "approve", agentId?: string) => {
    if (!fleet) return;
    try {
      const res = await fetch(`/api/fleet/${fleet.id}/control`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, agentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "That control failed.");
      apply(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That control failed.");
    }
  };

  // Hooks run before the early return below, so the clock ticks for every
  // render path rather than only the one with a fleet on screen.
  const now = useNow(fleet?.status === "running");

  const visible = useMemo(
    () => (statusFilter.size ? agents.filter((a) => statusFilter.has(a.status)) : agents),
    [agents, statusFilter],
  );

  const toggleStatus = (status: AgentStatus) =>
    setStatusFilter((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });

  if (!fleet) {
    return (
      <div className="space-y-4">
        {error ? (
          <p className="border border-[var(--color-bad)] px-4 py-3 text-[0.875rem] text-[var(--color-bad)]">
            {error}
          </p>
        ) : null}
        <DeployPanel options={options} categories={categories} busy={busy} onDeploy={deploy} />
      </div>
    );
  }

  const elapsed = fleet.startedAt ? (fleet.endedAt ?? now) - fleet.startedAt : 0;
  const live = fleet.status === "running";

  return (
    <div className="space-y-6">
      {error ? (
        <p className="border border-[var(--color-bad)] px-4 py-3 text-[0.875rem] text-[var(--color-bad)]">
          {error}
        </p>
      ) : null}

      <header className="border border-[var(--color-rule)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="label">
              {fleet.id} · {FLEET_STATUS_LABEL[fleet.status]}
              {live ? " ●" : ""}
            </span>
            <h2 className="mt-1 text-xl font-medium tracking-[-0.015em]">{fleet.objective}</h2>
            <p className="mt-1 font-mono text-[0.75rem] text-[var(--color-ink-faint)]">
              {summary?.total ?? 0} agents · {summary?.skillsInUse ?? 0} skills ·{" "}
              {fleet.request.concurrency} at a time · seed {fleet.request.seed} ·{" "}
              {formatDuration(elapsed)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary?.gated ? (
              <button
                type="button"
                onClick={() => control("approve")}
                className="border border-[var(--color-gate)] px-3 py-1.5 font-mono text-[0.75rem]"
                style={{ color: "var(--color-gate)" }}
              >
                Approve {summary.gated} gated
              </button>
            ) : null}
            {fleet.status === "running" ? (
              <button
                type="button"
                onClick={() => control("pause")}
                className="border border-[var(--color-rule)] px-3 py-1.5 font-mono text-[0.75rem]"
              >
                Pause
              </button>
            ) : null}
            {fleet.status === "paused" ? (
              <button
                type="button"
                onClick={() => control("resume")}
                className="border border-[var(--color-rule)] px-3 py-1.5 font-mono text-[0.75rem]"
              >
                Resume
              </button>
            ) : null}
            {fleet.status === "running" || fleet.status === "paused" ? (
              <button
                type="button"
                onClick={() => control("abort")}
                className="border border-[var(--color-bad)] px-3 py-1.5 font-mono text-[0.75rem]"
                style={{ color: "var(--color-bad)" }}
              >
                Abort
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                sourceRef.current?.close();
                setFleet(null);
                setAgents([]);
                setSummary(null);
                setEvents([]);
              }}
              className="border border-[var(--color-rule)] px-3 py-1.5 font-mono text-[0.75rem]"
            >
              New fleet
            </button>
          </div>
        </div>

        <div
          aria-hidden
          className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--color-rule)]"
        >
          <span
            className="block h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300"
            style={{ width: `${Math.round((summary?.completion ?? 0) * 100)}%` }}
          />
        </div>

        {fleet.notices.length ? (
          <ul className="mt-3 space-y-1">
            {fleet.notices.map((notice) => (
              <li key={notice} className="text-[0.8125rem] text-[var(--color-ink-muted)]">
                — {notice}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {summary ? (
        <section className="grid grid-cols-2 gap-px border border-[var(--color-rule)] bg-[var(--color-rule)] sm:grid-cols-4">
          <Stat label="Deployed" value={summary.total} />
          <Stat
            label="Succeeded"
            value={summary.byStatus.succeeded}
            tone={STATUS_VAR.succeeded}
          />
          <Stat
            label="Failed or escalated"
            value={summary.byStatus.failed + summary.byStatus.escalated}
            tone={STATUS_VAR.failed}
          />
          <Stat
            label="Highest risk in fleet"
            text={RISK_LABEL[summary.highestRisk as RiskLevel]}
          />
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          {summary ? (
            <StatusLegend
              counts={summary.byStatus}
              active={statusFilter}
              onToggle={toggleStatus}
            />
          ) : null}
          <div className="flex gap-2">
            {(["grid", "roster"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                aria-pressed={view === mode}
                className={`border px-3 py-1 font-mono text-[0.75rem] ${
                  view === mode
                    ? "border-[var(--color-ink)] bg-[var(--color-raised)]"
                    : "border-[var(--color-rule)] text-[var(--color-ink-muted)]"
                }`}
              >
                {mode === "grid" ? "Swarm" : "Roster"}
              </button>
            ))}
          </div>
        </div>

        {view === "grid" ? (
          <SwarmGrid agents={visible} selectedId={selected} onSelect={setSelected} />
        ) : (
          <AgentRoster agents={visible} selectedId={selected} onSelect={setSelected} />
        )}
        <p className="mt-2 label">
          {visible.length} of {agents.length} agents shown · click any agent to inspect it
        </p>
      </section>

      <section>
        <h3 className="label">Feed</h3>
        <ul className="mt-2 max-h-56 overflow-y-auto border border-[var(--color-rule)] bg-[var(--color-surface)] p-3 font-mono text-[0.75rem]">
          {[...events].reverse().map((event) => (
            <li key={event.seq} className="flex gap-3 py-0.5">
              <span className="shrink-0 text-[var(--color-ink-faint)] tabular-nums">
                {String(event.seq).padStart(4, "0")}
              </span>
              <span
                className={
                  event.kind.startsWith("fleet")
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)]"
                }
              >
                {event.message}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {selected ? (
        <AgentDrawer
          fleetId={fleet.id}
          agentId={selected}
          onClose={() => setSelected(null)}
          onApprove={(agentId) => control("approve", agentId)}
        />
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  text,
  tone,
}: {
  label: string;
  value?: number;
  text?: string;
  tone?: string;
}) {
  return (
    <div className="bg-[var(--color-surface)] p-4">
      <span className="label">{label}</span>
      <p
        className="mt-1 text-2xl font-medium tabular-nums tracking-[-0.02em]"
        style={tone ? { color: tone } : undefined}
      >
        {text ?? value}
      </p>
    </div>
  );
}
