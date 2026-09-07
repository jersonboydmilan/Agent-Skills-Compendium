/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

/**
 * The read API, described once. The reference page renders from this, so the
 * documentation cannot drift from the route list the way a hand-written page
 * would.
 */
export interface ApiParam {
  name: string;
  type: string;
  description: string;
}

export interface ApiEndpoint {
  method: "GET";
  path: string;
  summary: string;
  description: string;
  params: ApiParam[];
  example: string;
  returns: string;
}

export const FILTER_PARAMS: ApiParam[] = [
  { name: "q", type: "string", description: "Fuzzy search across name, slug, description, purpose, trigger, tags and tools. Every term must match somewhere." },
  { name: "layer", type: "L1…L5, comma-separated", description: "Architectural layer." },
  { name: "category", type: "slug, comma-separated", description: "Category slug, e.g. agent-security." },
  { name: "complexity", type: "beginner | intermediate | advanced | expert", description: "Comma-separated." },
  { name: "maturity", type: "experimental | prototype | beta | production", description: "Comma-separated." },
  { name: "risk", type: "low | medium | high | critical", description: "Comma-separated." },
  { name: "tag", type: "string, comma-separated", description: "Matches a skill declaring any of the given tags." },
  { name: "speed", type: "1 | 2 | 3", description: "Build speed. 3 is fastest." },
  { name: "share", type: "1 | 2 | 3", description: "Shareability. 3 is highest." },
];

export const ENDPOINTS: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/skills",
    summary: "List and filter skills",
    description:
      "Accepts the same query parameters as the /skills page, so a URL a person is looking at and a URL an agent fetches describe the same result set. Returns summaries by default; add view=full for complete definitions.",
    params: [
      ...FILTER_PARAMS,
      { name: "view", type: "full", description: "Return complete skill definitions rather than summaries." },
    ],
    example: "/api/skills?layer=L5&maturity=production",
    returns: "{ count, total, filters, skills[] } — 400 with { error } naming the accepted values if a closed-vocabulary parameter is misspelled.",
  },
  {
    method: "GET",
    path: "/api/skills/:slug",
    summary: "One complete skill definition",
    description: "The full canonical definition, identical in shape to the source YAML file. 404 if the slug does not exist.",
    params: [{ name: ":slug", type: "path", description: "Stable skill identifier, e.g. prompt-injection-defense." }],
    example: "/api/skills/prompt-injection-defense",
    returns: "{ skill }",
  },
  {
    method: "GET",
    path: "/api/skills/:slug/related",
    summary: "Resolved relationship edges",
    description:
      "Prerequisite, complementary, successor and related edges resolved to real skills, plus the inverse edge — which skills declare this one as a prerequisite.",
    params: [{ name: ":slug", type: "path", description: "Stable skill identifier." }],
    example: "/api/skills/executive-brief/related",
    returns: "{ slug, groups[], depended_on_by[] }",
  },
  {
    method: "GET",
    path: "/api/skills/:slug/export",
    summary: "Portable definition",
    description:
      "The definition as YAML or JSON. The YAML form is round-trippable: it re-validates against the schema unchanged, so it can be dropped straight into a content directory.",
    params: [
      { name: ":slug", type: "path", description: "Stable skill identifier." },
      { name: "format", type: "yaml | json", description: "Defaults to yaml." },
      { name: "download", type: "1", description: "Send as a file attachment rather than inline." },
    ],
    example: "/api/skills/executive-brief/export?format=yaml",
    returns: "text/yaml or application/json",
  },
  {
    method: "GET",
    path: "/api/categories",
    summary: "The taxonomy",
    description: "All categories with live skill counts and their primary architectural layers.",
    params: [],
    example: "/api/categories",
    returns: "{ count, categories[] }",
  },
  {
    method: "GET",
    path: "/api/layers",
    summary: "The five architectural layers",
    description: "Each layer with its description, characteristics and live skill count.",
    params: [],
    example: "/api/layers",
    returns: "{ count, layers[] }",
  },
  {
    method: "GET",
    path: "/api/schema",
    summary: "The canonical JSON Schema",
    description:
      "The JSON Schema every published definition validates against, generated from the same source of truth the application renders from. Fetch it to validate a definition you wrote without cloning the repository.",
    params: [],
    example: "/api/schema",
    returns: "JSON Schema draft-07 document",
  },
  {
    method: "GET",
    path: "/api/search",
    summary: "Search across all entity types",
    description: "Matches skills, categories and layers in one response. Returns empty arrays when q is absent.",
    params: [
      { name: "q", type: "string", description: "Required. Returns empty results if omitted." },
      { name: "limit", type: "number", description: "Maximum skills returned. Defaults to 20, capped at 100." },
    ],
    example: "/api/search?q=incident",
    returns: "{ query, skills[], categories[], layers[] }",
  },
];
