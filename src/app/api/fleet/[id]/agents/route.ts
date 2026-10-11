import type { NextRequest } from "next/server";
import { apiError, apiJson, parseLimit } from "@/lib/api";
import { fleetEngine } from "@/lib/fleet/engine";
import { AGENT_STATUSES, summarise } from "@/lib/fleet/types";
import { LAYER_IDS, RISK_LEVELS } from "@/lib/schema";

export const dynamic = "force-dynamic";

const VOCABULARY: Record<string, readonly string[]> = {
  status: AGENT_STATUSES,
  layer: LAYER_IDS,
  risk: RISK_LEVELS,
};

/**
 * GET /api/fleet/:id/agents — the roster, filterable and paged.
 *
 * A 500-agent fleet is too much to send as full agents, so this returns
 * summaries. One agent's full timeline is a separate request.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fleet = fleetEngine.get(id);
  if (!fleet) return apiError(`No fleet "${id}".`, 404);

  const search = request.nextUrl.searchParams;
  for (const [key, allowed] of Object.entries(VOCABULARY)) {
    const raw = search.get(key);
    if (!raw) continue;
    const unknown = raw
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v && !allowed.includes(v));
    if (unknown.length) {
      return apiError(
        `Unknown ${key} value ${unknown.map((v) => `"${v}"`).join(", ")}. Accepted: ${allowed.join(", ")}.`,
        400,
      );
    }
  }

  const list = (key: string) =>
    (search.get(key) ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  const statuses = new Set(list("status"));
  const layers = new Set(list("layer"));
  const risks = new Set(list("risk"));
  const skill = search.get("skill");
  const q = (search.get("q") ?? "").trim().toLowerCase();

  const matched = fleet.agents.filter((agent) => {
    if (statuses.size && !statuses.has(agent.status)) return false;
    if (layers.size && !layers.has(agent.layer)) return false;
    if (risks.size && !risks.has(agent.riskLevel)) return false;
    if (skill && !agent.skillSet.includes(skill)) return false;
    if (q && !`${agent.role} ${agent.id} ${agent.primarySkill}`.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const limit = parseLimit(search.get("limit"), 50, 500);
  const offset = Math.max(0, Number(search.get("offset") ?? 0) || 0);

  return apiJson({
    count: matched.length,
    total: fleet.agents.length,
    offset,
    limit,
    agents: matched.slice(offset, offset + limit).map(summarise),
  });
}
