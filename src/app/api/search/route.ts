import type { NextRequest } from "next/server";
import { repository } from "@/lib/content-store";
import { searchSkills } from "@/lib/search";
import { apiJson, parseLimit } from "@/lib/api";

/** GET /api/search?q= — matches skills, categories and layers in one response. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  const [skills, categories, layers] = await Promise.all([
    repository.listSkills(),
    repository.listCategories(),
    repository.listLayers(),
  ]);

  if (!q) return apiJson({ query: q, skills: [], categories: [], layers: [] });
  const needle = q.toLowerCase();

  return apiJson({
    query: q,
    skills: searchSkills(q, skills)
      .slice(0, limit)
      .map((s) => ({
        slug: s.slug,
        name: s.name,
        layer: s.layer,
        category: s.category,
        description: s.description,
        href: `/skills/${s.slug}`,
      })),
    categories: categories
      .filter(
        (c) =>
          c.name.toLowerCase().includes(needle) || c.description.toLowerCase().includes(needle),
      )
      .map((c) => ({ slug: c.slug, name: c.name, href: `/categories/${c.slug}` })),
    layers: layers
      .filter(
        (l) =>
          l.name.toLowerCase().includes(needle) ||
          l.id.toLowerCase() === needle ||
          l.description.toLowerCase().includes(needle),
      )
      .map((l) => ({ id: l.id, name: l.name, href: `/layers/${l.slug}` })),
  });
}
