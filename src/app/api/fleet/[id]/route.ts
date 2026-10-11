import type { NextRequest } from "next/server";
import { apiError, apiJson } from "@/lib/api";
import { fleetEngine } from "@/lib/fleet/engine";
import { fleetEnvelope } from "@/lib/fleet/api-shape";

export const dynamic = "force-dynamic";

/** GET /api/fleet/:id — one fleet, its aggregate, and the recent event feed. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fleet = fleetEngine.get(id);
  if (!fleet) return apiError(`No fleet "${id}". Fleets are held in memory and do not survive a restart.`, 404);
  const withAgents = request.nextUrl.searchParams.get("agents") !== "0";
  return apiJson(fleetEnvelope(fleet, { agents: withAgents }));
}
