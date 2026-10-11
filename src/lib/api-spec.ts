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
  method: "GET" | "POST";
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
  {
    method: "POST",
    path: "/api/fleet",
    summary: "Deploy a fleet",
    description:
      "Plans and starts a fleet of agents against one objective. Each agent carries a skill set drawn from the registry. Fleets are held in process memory and are not cached — they do not survive a restart.",
    params: [
      { name: "objective", type: "string", description: "What the fleet is for. Trimmed to 300 characters." },
      { name: "size", type: "1…500", description: "How many agents to deploy. Above the pool size, agents share a role on separate shards." },
      { name: "strategy", type: "spread | category | layer | explicit", description: "How the roster is drawn. explicit requires a skills array." },
      { name: "skills", type: "slug[]", description: "Required for the explicit strategy. Unknown slugs are reported in notices rather than dropped silently." },
      { name: "categories", type: "slug[]", description: "Narrows the pool for the category strategy." },
      { name: "layers", type: "L1…L5", description: "Narrows the pool for the layer strategy." },
      { name: "concurrency", type: "1…64", description: "How many agents run at once." },
      { name: "approvalThreshold", type: "none | medium | high | critical", description: "Agents at or above this risk are held at an approval gate before they run." },
      { name: "seed", type: "integer", description: "The same seed and registry replay the same fleet." },
    ],
    example: "POST /api/fleet {\"objective\":\"Harden the agent surface\",\"size\":120,\"strategy\":\"spread\"}",
    returns: "201 { fleet, aggregate, events[], agents[] } — 400 with { error } for an unknown strategy or a size above the cap.",
  },
  {
    method: "GET",
    path: "/api/fleet",
    summary: "List fleets",
    description: "Every fleet this process is holding, newest first, each with its aggregate.",
    params: [],
    example: "/api/fleet",
    returns: "{ count, fleets[] }",
  },
  {
    method: "GET",
    path: "/api/fleet/:id",
    summary: "One fleet",
    description: "A fleet's status, aggregate, notices and recent event feed. 404 once the process that held it has restarted.",
    params: [
      { name: ":id", type: "path", description: "Fleet identifier returned by the deploy call." },
      { name: "agents", type: "0", description: "Omit the agent roster from the response." },
    ],
    example: "/api/fleet/flt-1-abcd",
    returns: "{ fleet, aggregate, events[], agents[] }",
  },
  {
    method: "GET",
    path: "/api/fleet/:id/agents",
    summary: "The roster",
    description:
      "Agent summaries, filterable and paged. Summaries rather than whole agents, because a 500-agent fleet is too much to send in full.",
    params: [
      { name: "status", type: "queued | awaiting-approval | running | succeeded | failed | escalated | aborted", description: "Comma-separated." },
      { name: "layer", type: "L1…L5", description: "Comma-separated." },
      { name: "risk", type: "low | medium | high | critical", description: "Comma-separated." },
      { name: "skill", type: "slug", description: "Agents carrying this skill anywhere in their set." },
      { name: "q", type: "string", description: "Matches role, agent id or primary skill." },
      { name: "limit", type: "1…500", description: "Page size, default 50." },
      { name: "offset", type: "integer", description: "Page offset." },
    ],
    example: "/api/fleet/flt-1-abcd/agents?status=escalated&limit=20",
    returns: "{ count, total, offset, limit, agents[] }",
  },
  {
    method: "GET",
    path: "/api/fleet/:id/agents/:agentId",
    summary: "One agent in full",
    description:
      "The agent's whole run: skill set, every procedure step with any failure mode it hit and the mitigation its definition prescribes, validation checks, escalation, and the governance surface.",
    params: [
      { name: ":id", type: "path", description: "Fleet identifier." },
      { name: ":agentId", type: "path", description: "Agent identifier, e.g. agt-0042." },
    ],
    example: "/api/fleet/flt-1-abcd/agents/agt-0042",
    returns: "{ agent, events[] }",
  },
  {
    method: "GET",
    path: "/api/fleet/:id/stream",
    summary: "Live fleet updates",
    description:
      "Server-sent events. An event message per feed line as it happens, and a snapshot of the roster and aggregate on a timer. The stream closes itself when the fleet settles.",
    params: [{ name: ":id", type: "path", description: "Fleet identifier." }],
    example: "/api/fleet/flt-1-abcd/stream",
    returns: "text/event-stream — event: event | snapshot",
  },
  {
    method: "POST",
    path: "/api/fleet/:id/control",
    summary: "Pause, resume, abort, approve",
    description:
      "Operator control. approve clears the approval gate — pass an agentId to release one agent rather than all of them. An approval lifts a gate pause, but never an operator pause.",
    params: [
      { name: "action", type: "pause | resume | abort | approve", description: "What to do." },
      { name: "agentId", type: "string", description: "With approve, releases only that agent." },
    ],
    example: "POST /api/fleet/flt-1-abcd/control {\"action\":\"approve\"}",
    returns: "{ fleet, aggregate, events[], agents[] }",
  },
];
