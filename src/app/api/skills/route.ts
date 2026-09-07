import type { NextRequest } from "next/server";
import { repository } from "@/lib/content-store";
import { applyFilters, filtersFromParams } from "@/lib/search";
import { apiError, apiJson } from "@/lib/api";
import { COMPLEXITIES, LAYER_IDS, MATURITIES, RISK_LEVELS } from "@/lib/schema";

/**
 * Closed vocabularies. A typo in one of these otherwise returns an empty list,
 * which reads as "no such skill" rather than "no such value".
 */
const VOCABULARY: Record<string, readonly string[]> = {
  layer: LAYER_IDS,
  complexity: COMPLEXITIES,
  maturity: MATURITIES,
  risk: RISK_LEVELS,
  speed: ["1", "2", "3"],
  share: ["1", "2", "3"],
};

/** GET /api/skills — the full registry, filterable with the same params as /skills. */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());

  for (const [key, allowed] of Object.entries(VOCABULARY)) {
    const raw = request.nextUrl.searchParams.get(key);
    if (!raw) continue;
    const unknown = raw
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v && !allowed.includes(v));
    if (unknown.length) {
      return apiError(
        `Unknown ${key} value${unknown.length > 1 ? "s" : ""} ${unknown
          .map((v) => `"${v}"`)
          .join(", ")}. Accepted: ${allowed.join(", ")}.`,
        400,
      );
    }
  }

  const filters = filtersFromParams(params);
  const skills = await repository.listSkills();
  const results = applyFilters(skills, filters);

  const summary = request.nextUrl.searchParams.get("view") !== "full";
  return apiJson({
    count: results.length,
    total: skills.length,
    filters,
    skills: summary
      ? results.map((s) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          version: s.version,
          category: s.category,
          layer: s.layer,
          domain: s.domain,
          description: s.description,
          complexity: s.complexity,
          maturity: s.maturity,
          build_speed: s.build_speed,
          shareability: s.shareability,
          risk_level: s.risk_level,
          tags: s.tags,
          href: `/skills/${s.slug}`,
        }))
      : results,
  });
}
