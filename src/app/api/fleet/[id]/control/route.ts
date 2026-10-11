import type { NextRequest } from "next/server";
import { apiError, apiJson } from "@/lib/api";
import { fleetEngine } from "@/lib/fleet/engine";
import { fleetEnvelope } from "@/lib/fleet/api-shape";

export const dynamic = "force-dynamic";

const ACTIONS = ["pause", "resume", "abort", "approve"] as const;
type Action = (typeof ACTIONS)[number];

/**
 * POST /api/fleet/:id/control — pause, resume, abort, or clear the approval
 * gate. `approve` takes an optional agentId to release one agent rather than
 * every gated agent at once.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!fleetEngine.get(id)) return apiError(`No fleet "${id}".`, 404);

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // An action-only call with no body is fine.
  }

  const action = String(body.action ?? "");
  if (!(ACTIONS as readonly string[]).includes(action)) {
    return apiError(`Unknown action "${action}". Accepted: ${ACTIONS.join(", ")}.`, 400);
  }

  const agentId = typeof body.agentId === "string" ? body.agentId : undefined;
  const fleet = {
    pause: () => fleetEngine.pause(id),
    resume: () => fleetEngine.resume(id),
    abort: () => fleetEngine.abort(id),
    approve: () => fleetEngine.approve(id, agentId),
  }[action as Action]();

  if (!fleet) return apiError(`No fleet "${id}".`, 404);
  return apiJson(fleetEnvelope(fleet, { agents: true }));
}
