/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

import type { AgentStatus, FleetStatus } from "@/lib/fleet/types";

/** One vocabulary for agent status, so the grid, roster and drawer agree. */
export const STATUS_LABEL: Record<AgentStatus, string> = {
  queued: "Queued",
  "awaiting-approval": "Awaiting approval",
  running: "Running",
  succeeded: "Succeeded",
  failed: "Failed",
  escalated: "Escalated",
  aborted: "Aborted",
};

export const STATUS_VAR: Record<AgentStatus, string> = {
  queued: "var(--color-idle)",
  "awaiting-approval": "var(--color-gate)",
  running: "var(--color-accent)",
  succeeded: "var(--color-ok)",
  failed: "var(--color-bad)",
  escalated: "var(--color-escalate)",
  aborted: "var(--color-idle)",
};

/** The order the stat row and the filter chips read in: live first, then outcomes. */
export const STATUS_ORDER: AgentStatus[] = [
  "running",
  "queued",
  "awaiting-approval",
  "succeeded",
  "failed",
  "escalated",
  "aborted",
];

export const FLEET_STATUS_LABEL: Record<FleetStatus, string> = {
  planned: "Planned",
  running: "Running",
  paused: "Paused",
  complete: "Complete",
  aborted: "Aborted",
};

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}
