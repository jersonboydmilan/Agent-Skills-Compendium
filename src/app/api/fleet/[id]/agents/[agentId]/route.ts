import { apiError, apiJson } from "@/lib/api";
import { fleetEngine } from "@/lib/fleet/engine";

export const dynamic = "force-dynamic";

/** GET /api/fleet/:id/agents/:agentId — one agent in full: skill set, steps, checks. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; agentId: string }> },
) {
  const { id, agentId } = await params;
  const fleet = fleetEngine.get(id);
  if (!fleet) return apiError(`No fleet "${id}".`, 404);
  const agent = fleet.agents.find((a) => a.id === agentId);
  if (!agent) return apiError(`No agent "${agentId}" in fleet "${id}".`, 404);
  return apiJson({
    agent,
    events: fleet.events.filter((e) => e.agentId === agentId).slice(-40),
  });
}
