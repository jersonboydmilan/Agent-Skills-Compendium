import type { NextRequest } from "next/server";
import { repository } from "@/lib/content-store";
import { apiError, apiJson } from "@/lib/api";
import { fleetEngine } from "@/lib/fleet/engine";
import { MAX_FLEET_SIZE, normaliseRequest } from "@/lib/fleet/planner";
import { fleetEnvelope, fleetListEnvelope } from "@/lib/fleet/api-shape";
import { ROSTER_STRATEGIES } from "@/lib/fleet/types";

/**
 * Fleets live in process memory and are never cached: a fleet's whole value is
 * that it is current. The registry routes stay cacheable; these cannot be.
 */
export const dynamic = "force-dynamic";

/** GET /api/fleet — every fleet this process is holding, newest first. */
export async function GET() {
  return apiJson(fleetListEnvelope(fleetEngine.list()));
}

/** POST /api/fleet — plan and deploy a fleet against an objective. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Body must be JSON.", 400);
  }

  const strategy = String(body.strategy ?? "spread");
  if (!(ROSTER_STRATEGIES as readonly string[]).includes(strategy)) {
    return apiError(
      `Unknown strategy "${strategy}". Accepted: ${ROSTER_STRATEGIES.join(", ")}.`,
      400,
    );
  }
  if (strategy === "explicit" && !Array.isArray(body.skills)) {
    return apiError('The "explicit" strategy needs a skills array.', 400);
  }
  if (Number(body.size) > MAX_FLEET_SIZE) {
    return apiError(`A fleet is capped at ${MAX_FLEET_SIZE} agents.`, 400);
  }

  const mission = normaliseRequest({
    objective: typeof body.objective === "string" ? body.objective : "",
    size: Number(body.size),
    strategy: strategy as never,
    skills: Array.isArray(body.skills) ? body.skills.map(String) : [],
    categories: Array.isArray(body.categories) ? body.categories.map(String) : [],
    layers: Array.isArray(body.layers) ? (body.layers.map(String) as never) : [],
    concurrency: Number(body.concurrency),
    approvalThreshold: body.approvalThreshold as never,
    seed: Number(body.seed),
  });

  const skills = await repository.listSkills();
  const fleet = fleetEngine.deploy(mission, skills);
  return apiJson(fleetEnvelope(fleet, { agents: true }), { status: 201 });
}
