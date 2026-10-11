"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LAYER_NAMES, LAYER_VAR, RISK_LABEL } from "@/lib/format";
import type { AgentInstance } from "@/lib/fleet/types";
import { STATUS_LABEL, STATUS_VAR, formatDuration } from "./status";
import { useNow } from "./use-now";

/**
 * One agent, in full: the skill set it carries, every step as it ran, the
 * failure modes it hit with the mitigation its own definition prescribes, the
 * validation checks that decided the outcome, and the governance surface.
 */
export function AgentDrawer({
  fleetId,
  agentId,
  onClose,
  onApprove,
}: {
  fleetId: string;
  agentId: string;
  onClose: () => void;
  onApprove: (agentId: string) => void;
}) {
  const [agent, setAgent] = useState<AgentInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Poll while the agent is still moving; a settled agent needs one fetch.
  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout>;

    const load = async () => {
      try {
        const res = await fetch(`/api/fleet/${fleetId}/agents/${agentId}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!live) return;
        setAgent(data.agent);
        setError(null);
        if (data.agent.status === "running" || data.agent.status === "queued") {
          timer = setTimeout(load, 500);
        }
      } catch {
        if (live) setError("That agent could not be loaded.");
      }
    };

    load();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [fleetId, agentId]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const now = useNow(agent?.status === "running");
  const elapsed = agent?.startedAt != null ? (agent.endedAt ?? now) - agent.startedAt : null;

  // Validation only runs once the procedure finishes. An agent that escalated
  // or was aborted never reached its own exit test, and rendering those checks
  // as failures would claim something the run never established.
  const reachedValidation = Boolean(
    agent &&
      agent.steps.length > 0 &&
      agent.steps.every((step) => step.status === "done" || step.status === "recovered"),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[var(--color-ink)]/25"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={agent ? `Agent ${agent.ordinal}: ${agent.role}` : "Agent detail"}
        className="h-full w-full max-w-xl overflow-y-auto border-l border-[var(--color-rule)] bg-[var(--color-surface)] p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="label">Agent {agent ? `#${agent.ordinal}` : ""}</span>
            <h2 className="mt-1 text-xl font-medium tracking-[-0.015em]">
              {agent?.role ?? "Loading…"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="border border-[var(--color-rule)] px-2.5 py-1 font-mono text-[0.75rem]"
          >
            Close ✕
          </button>
        </div>

        {error ? <p className="mt-6 text-[var(--color-bad)]">{error}</p> : null}

        {agent ? (
          <div className="mt-5 space-y-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="label" style={{ color: STATUS_VAR[agent.status] }}>
                ● {STATUS_LABEL[agent.status]}
              </span>
              <span className="label" style={{ color: LAYER_VAR[agent.layer] }}>
                {agent.layer} {LAYER_NAMES[agent.layer]}
              </span>
              <span className="label">Risk {RISK_LABEL[agent.riskLevel]}</span>
              <span className="label">{agent.assignment}</span>
              {elapsed != null ? (
                <span className="label">{formatDuration(elapsed)}</span>
              ) : null}
            </div>

            {agent.status === "awaiting-approval" ? (
              <div className="border border-[var(--color-gate)] bg-[var(--color-raised)] p-4">
                <p className="text-[0.875rem]">
                  Held at the approval gate: this agent carries {RISK_LABEL[agent.riskLevel]} risk.
                </p>
                <button
                  type="button"
                  onClick={() => onApprove(agent.id)}
                  className="mt-3 bg-[var(--color-ink)] px-3 py-1.5 font-mono text-[0.75rem] text-[var(--color-paper)]"
                >
                  Approve this agent
                </button>
              </div>
            ) : null}

            {agent.escalation ? (
              <div className="border border-[var(--color-escalate)] p-4">
                <span className="label" style={{ color: "var(--color-escalate)" }}>
                  Escalated
                </span>
                <p className="mt-2 text-[0.875rem]">{agent.escalation.condition}</p>
                <p className="mt-1.5 text-[0.875rem] text-[var(--color-ink-muted)]">
                  → {agent.escalation.action}
                </p>
              </div>
            ) : null}

            <section>
              <h3 className="label">Skill set</h3>
              <ul className="mt-2 space-y-1">
                {agent.skillSet.map((slug, i) => (
                  <li key={slug} className="flex items-baseline gap-2">
                    <span className="font-mono text-[0.6875rem] text-[var(--color-ink-faint)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Link
                      href={`/skills/${slug}`}
                      className="text-[0.875rem] text-[var(--color-accent)] hover:underline"
                    >
                      {slug}
                    </Link>
                    {slug === agent.primarySkill ? (
                      <span className="label">primary</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="label">
                Procedure — {agent.steps.filter((s) => s.status !== "pending").length} of{" "}
                {agent.steps.length}
              </h3>
              <ol className="mt-2 space-y-2">
                {agent.steps.map((step) => (
                  <li
                    key={step.index}
                    className="border-l-2 pl-3"
                    style={{
                      borderColor:
                        step.status === "pending"
                          ? "var(--color-rule)"
                          : step.status === "failed"
                            ? "var(--color-bad)"
                            : step.status === "recovered"
                              ? "var(--color-gate)"
                              : step.status === "running"
                                ? "var(--color-accent)"
                                : "var(--color-ok)",
                    }}
                  >
                    <p
                      className={`text-[0.8125rem] ${
                        step.status === "pending"
                          ? "text-[var(--color-ink-faint)]"
                          : "text-[var(--color-ink)]"
                      }`}
                    >
                      {step.name}
                    </p>
                    {step.failure ? (
                      <div className="mt-1 text-[0.8125rem]">
                        <p style={{ color: "var(--color-bad)" }}>
                          Failure mode: {step.failure.failure}
                        </p>
                        <p className="text-[var(--color-ink-muted)]">
                          Mitigation: {step.failure.mitigation}
                          {step.failure.recovered ? " — recovered" : " — did not hold"}
                        </p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h3 className="label">
                Validation — the exit test
                {reachedValidation ? "" : " · not reached"}
              </h3>
              {reachedValidation ? null : (
                <p className="mt-1 text-[0.8125rem] text-[var(--color-ink-muted)]">
                  The procedure stopped before its exit test, so these checks were never
                  evaluated — neither passed nor failed.
                </p>
              )}
              <ul className="mt-2 space-y-1.5">
                {agent.validation.map((check, i) => {
                  const settled = reachedValidation;
                  return (
                    <li key={i} className="flex items-start gap-2 text-[0.8125rem]">
                      <span
                        aria-hidden
                        style={{
                          color: !settled
                            ? "var(--color-idle)"
                            : check.passed
                              ? "var(--color-ok)"
                              : "var(--color-bad)",
                        }}
                      >
                        {!settled ? "○" : check.passed ? "✓" : "✕"}
                      </span>
                      <span className={check.passed ? "" : "text-[var(--color-ink-muted)]"}>
                        {check.check}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="label">Permissions</h3>
                <p className="mt-1.5 font-mono text-[0.75rem] text-[var(--color-ink-muted)]">
                  {agent.permissions.length ? agent.permissions.join(", ") : "none declared"}
                </p>
              </div>
              <div>
                <h3 className="label">Tools</h3>
                <p className="mt-1.5 font-mono text-[0.75rem] text-[var(--color-ink-muted)]">
                  {agent.tools.length ? agent.tools.join(", ") : "none declared"}
                </p>
              </div>
            </section>

            {agent.restrictedActions.length ? (
              <section>
                <h3 className="label">May not</h3>
                <ul className="mt-1.5 space-y-1">
                  {agent.restrictedActions.map((action) => (
                    <li key={action} className="text-[0.8125rem] text-[var(--color-ink-muted)]">
                      — {action}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
