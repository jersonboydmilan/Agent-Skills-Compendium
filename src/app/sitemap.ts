import type { MetadataRoute } from "next";
import { repository } from "@/lib/content-store";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agent-skills-compendium.local";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [skills, categories, layers] = await Promise.all([
    repository.listSkills(),
    repository.listCategories(),
    repository.listLayers(),
  ]);

  const staticRoutes = [
    "",
    "/skills",
    "/categories",
    "/layers",
    "/compose",
    "/api-reference",
    "/contribute",
  ].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  return [
    ...staticRoutes,
    ...layers.map((l) => ({
      url: `${BASE}/layers/${l.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...categories.map((c) => ({
      url: `${BASE}/categories/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...skills.map((s) => ({
      url: `${BASE}/skills/${s.slug}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
