/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  categorySchema,
  layerSchema,
  skillFileSchema,
  toolSchema,
  type Category,
  type Layer,
  type Skill,
  type Tool,
} from "./schema";
import type { Contributor, SkillRepository, TagCount } from "./repository";

const CONTENT_ROOT = join(process.cwd(), "content");

interface ContentIndex {
  skills: Skill[];
  skillsBySlug: Map<string, Skill>;
  categories: Category[];
  layers: Layer[];
  tools: Tool[];
}

let cache: ContentIndex | null = null;

function readYaml(relativePath: string): unknown {
  return parse(readFileSync(join(CONTENT_ROOT, relativePath), "utf8"));
}

function loadTaxonomy() {
  const layersRaw = readYaml("layers.yaml") as { layers: unknown[] };
  const categoriesRaw = readYaml("categories.yaml") as { categories: unknown[] };
  const toolsRaw = readYaml("tools.yaml") as { tools: unknown[] };

  return {
    layers: layersRaw.layers.map((l) => layerSchema.parse(l)),
    categories: categoriesRaw.categories
      .map((c) => categorySchema.parse(c))
      .sort((a, b) => a.order - b.order),
    tools: toolsRaw.tools.map((t) => toolSchema.parse(t)).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function loadSkills(): Skill[] {
  const dir = join(CONTENT_ROOT, "skills");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map((file) => {
      const raw = parse(readFileSync(join(dir, file), "utf8"));
      const parsed = skillFileSchema.safeParse(raw);
      if (!parsed.success) {
        throw new Error(
          `Invalid skill file content/skills/${file}:\n${parsed.error.issues
            .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
            .join("\n")}`,
        );
      }
      return parsed.data.skill;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildIndex(): ContentIndex {
  const { layers, categories, tools } = loadTaxonomy();
  const skills = loadSkills();
  return {
    skills,
    skillsBySlug: new Map(skills.map((s) => [s.slug, s])),
    categories,
    layers,
    tools,
  };
}

/**
 * Parse once per process in production, where content is immutable at runtime.
 * In development the index is rebuilt per call so an edit to a YAML file shows
 * up on the next reload instead of after a server restart.
 */
export function index(): ContentIndex {
  if (process.env.NODE_ENV !== "production") return buildIndex();
  if (!cache) cache = buildIndex();
  return cache;
}

class FileContentStore implements SkillRepository {
  async listSkills(): Promise<Skill[]> {
    return index().skills;
  }

  async getSkill(slug: string): Promise<Skill | null> {
    return index().skillsBySlug.get(slug) ?? null;
  }

  async listCategories(): Promise<Category[]> {
    return index().categories;
  }

  async getCategory(slug: string): Promise<Category | null> {
    return index().categories.find((c) => c.slug === slug) ?? null;
  }

  async listLayers(): Promise<Layer[]> {
    return index().layers;
  }

  async getLayer(idOrSlug: string): Promise<Layer | null> {
    const key = idOrSlug.toLowerCase();
    return (
      index().layers.find((l) => l.id.toLowerCase() === key || l.slug === key) ?? null
    );
  }

  async listTools(): Promise<Tool[]> {
    return index().tools;
  }

  async getTool(id: string): Promise<Tool | null> {
    return index().tools.find((t) => t.id === id) ?? null;
  }

  async listTags(): Promise<TagCount[]> {
    const counts = new Map<string, number>();
    for (const skill of index().skills) {
      for (const tag of skill.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }

  async listDomains(): Promise<string[]> {
    const domains = new Set<string>();
    for (const skill of index().skills) if (skill.domain) domains.add(skill.domain);
    return [...domains].sort();
  }

  async listContributors(): Promise<Contributor[]> {
    const counts = new Map<string, number>();
    for (const skill of index().skills) {
      counts.set(skill.author, (counts.get(skill.author) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, skillCount]) => ({ name, skillCount }))
      .sort((a, b) => b.skillCount - a.skillCount);
  }
}

export const repository: SkillRepository = new FileContentStore();
