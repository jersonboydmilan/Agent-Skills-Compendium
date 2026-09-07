# Agent Skills Compendium

A structured intelligence layer for building, understanding, and deploying AI agent
capabilities.

This is a **capability registry**, not a prompt library. The distinction it is built on:

- A **tool** is something an agent can *use* — a browser, a SQL client, a deployment system.
- A **skill** is something an agent knows how to *accomplish* — with a trigger, inputs, a
  procedure, validation criteria, failure modes and an escalation path.

A skill may invoke several tools to produce a validated outcome.

## Where this sits

```
┌───────────────────────────────┐
│          AI MODELS            │
│    Intelligence / Reasoning   │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│        TOOL PROTOCOLS         │
│     Connectivity / Access     │   MCP, function calling, HTTP
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│             TOOLS             │
│      APIs / Data / Systems    │
└───────────────┬───────────────┘
                ↓
╔═══════════════════════════════╗
║    AGENT SKILLS COMPENDIUM    ║
║                               ║
║  Taxonomy                     ║
║  Ontology                     ║
║  Specification                ║
║  Composition                  ║
║  Evaluation                   ║
║  Governance                   ║
╚═══════════════╤═══════════════╝
                ↓
┌───────────────────────────────┐
│           WORKFLOWS           │
│      Skill Composition        │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│            AGENTS             │
│     Autonomous Execution      │
└───────────────────────────────┘
```

## What this is not

**Not a prompt library.** A prompt produces a result once. A skill declares a
trigger, typed inputs, a procedure, validation criteria, failure modes and an
escalation path — and can therefore be tested, governed and composed.

**Not a tool protocol.** MCP and equivalents answer how an agent *reaches* a
system. A skill answers what it is trying to *accomplish* and how it knows it
succeeded. They compose; neither replaces the other.

**Not a replacement for `SKILL.md`.** That is a packaging format. A definition
here renders *into* it — `npm run export:skills` produces all 76 as SKILL.md
packages.

**Not a runtime.** The definitions are data. Enforcement of the governance model
belongs to whatever executes them, deliberately, so the definitions stay
portable.

**Not a finished standard.** An open reference framework at v0.1, stable enough
to build against and expected to move.

See [docs/INTEROPERABILITY.md](docs/INTEROPERABILITY.md) for the full position.

## Authorship

**Created and originally architected by Jerson Boyd Milan**

The Agent Skills Compendium was initiated and developed as a structured
framework for defining, organizing, discovering, and composing reusable
capabilities for AI agents.

Website: https://jersonboydmilan.com/

Copyright © 2026 Jerson Boyd Milan. See [COPYRIGHT.md](COPYRIGHT.md),
[AUTHORS.md](AUTHORS.md) and [PROVENANCE.md](PROVENANCE.md).

Licensed under the [MIT License](LICENSE). Every skill definition also carries
`license: MIT` in its own metadata, so a definition extracted from the registry
travels with its license attached.

## What is here

| | |
|---|---|
| Skills | 76, each fully specified against one canonical schema |
| Categories | 20, stored as data — adding one is a content change, not a code change |
| Architectural layers | 5 — Cognitive, Knowledge, Action, Domain, Agentic |
| Tools | 49, in a normalised registry that skills reference by id |

Every skill answers ten questions completely: what it does, when to use it, what it needs,
what tools it may use, how it executes, how it validates the result, what goes wrong, when it
should escalate, what it produces, and which skills it connects to.

## Running it

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build             # production build; prerenders every skill, category and layer route
npm run check             # typecheck + lint + content validation + tests
npm run typecheck         # tsc --noEmit
npm run lint              # eslint, flat config
npm run validate:content  # schema + referential integrity across the whole registry
npm test                  # node --test over the search, relation, export and registry logic
```

`validate:content` is the gate. It enforces the canonical schema on every YAML file, checks
that filenames match slugs, that ids are unique, that every category, layer and tool exists,
and that every skill-to-skill relationship resolves to a real skill. It exits non-zero on any
error.

`npm test` runs on Node's built-in test runner, so the suite adds no test dependency to the
project. It covers search scoring and facet filtering, relationship resolution and execution
ordering, YAML/JSON export round-tripping, and the integrity of the published registry —
every category, layer and tool reference, every relationship edge, and slug uniqueness.

## Architecture

```
content/                     the registry — this is the product
  layers.yaml                5 architectural layers
  categories.yaml            20 categories
  tools.yaml                 49 normalised tools
  skills/<slug>.yaml         one skill per file, `skill:` root

src/lib/
  schema.ts                  THE canonical Agent Skill Specification (zod)
  repository.ts              SkillRepository — the read contract every backend implements
  content-store.ts           file-backed implementation; cached per process in production
  search.ts                  fuzzy scoring + facet filtering, shared by UI and API
  relations.ts               related groups, inverse edges, prerequisite closure, ordering
  export.ts                  YAML / JSON serialisation
  api.ts                     response envelopes, cache headers, query-parameter parsing
  api-spec.ts                the route list /api-reference renders from
  analytics.ts               typed event surface (skill_view, skill_search, skill_copy, …)

src/app/                     routes; every page is a server component reading the repository
src/app/api/                 the machine interface
tests/                       node --test suites over the lib layer and the registry
```

### Swapping the storage backend

Nothing outside `src/lib/content-store.ts` knows the registry lives on disk. Pages and API
routes depend on the `SkillRepository` interface only. Moving to Postgres, a KV store or a
remote registry means implementing that interface and exporting a different `repository` —
no page, component or route changes.

## Machine interface

```
GET /api/skills                              filterable; add ?view=full for whole definitions
GET /api/skills/:slug
GET /api/skills/:slug/related                resolved edges, including inverse dependents
GET /api/skills/:slug/export?format=yaml     also json; add &download=1 for a file
GET /api/categories                          with live skill counts
GET /api/layers                              with live skill counts
GET /api/schema                              the canonical JSON Schema
GET /api/search?q=                           matches skills, categories and layers
```

The `/api/skills` route accepts the same query parameters as the `/skills` page — `q`,
`category`, `layer`, `complexity`, `maturity`, `risk`, `tag`, `speed`, `share` — so a URL a
person is looking at and a URL an agent fetches describe the same result set.

Filters with a closed vocabulary (`layer`, `complexity`, `maturity`, `risk`, `speed`,
`share`) answer a misspelled value with `400` and the accepted values, rather than an empty
list that reads as "no such skill". Unknown slugs return `404` with `{ error }`. Every
response is public, CORS-open and cacheable, and needs no authentication.

`/api/schema` serves the same generated JSON Schema that lives in `schema/`, so a definition
can be validated without cloning the repository:

```bash
curl <host>/api/skills/source-credibility-assessment/export?format=json > skill.json
curl <host>/api/schema > skill.schema.json
npx ajv validate -s skill.schema.json -d skill.json
```

YAML export is round-trippable: the exported document has the same shape as the source file
and re-validates against the schema unchanged.

## Adding a skill

1. Copy an existing definition (every skill page exposes its YAML).
2. Write it to `content/skills/<slug>.yaml`. The filename must match the slug.
3. Run `npm run validate:content`.
4. Version it. New skills start at `1.0.0`. A procedure change is a minor bump; a change to
   inputs, outputs or validation is a major bump, because it breaks consumers.

The full admission standard is at `/contribute`.

## Notes on the current build

- Typography uses system font stacks rather than a webfont, so the build has no network
  dependency. Swapping in a licensed face is a change to `--font-sans` / `--font-mono` in
  `src/app/globals.css`.
- Analytics events are queued on `window.__skillCompendiumEvents` for a collector to drain.
  No vendor is wired up.
- The composer is client-side and produces a workflow specification; it does not execute
  anything. Execution is deliberately out of scope for v1 but nothing in the data model
  blocks it. Its selection and workflow name live in the query string, so a composition
  survives a refresh and can be shared as a link — `/compose?skills=<slug>,<slug>`.
- Content is parsed once per process in production and re-read per request in development,
  so editing a YAML file shows up on the next reload without restarting the server.
- Colour tokens in `src/app/globals.css` are held to WCAG AA (4.5:1) against every surface
  they are used on, in both the light and dark palettes.

## Interface

### Registry

Search and seven filter facets over the whole registry — architectural layer,
category, complexity, maturity, build speed, shareability and risk level. Facet
counts are live, and options that would return nothing are disabled rather than
hidden. Filter state is held in the URL, so a filtered view is shareable and
survives a refresh. Below the `lg` breakpoint the facets collapse behind a
disclosure carrying the active count, so results stay at the top of a phone
screen.

![Skill registry filtered to the L5 Agentic layer](docs/screenshots/02-skill-registry.png)

### Skill detail

Every skill renders its full specification: purpose, trigger, typed inputs,
tools, procedure, decision rules, outputs, validation, failure modes,
escalation, worked examples, relationships and the governance surface
(risk level, required permissions, restricted actions).

![Prompt Injection Defence skill specification](docs/screenshots/03-skill-detail.png)

### Architectural layers

![The five architectural layers](docs/screenshots/04-layers.png)

### Category view

![Agent Security category](docs/screenshots/05-category.png)

### Composer

Select skills and the composer resolves their prerequisites, orders them for
execution, aggregates required permissions and tools, reports the highest risk
level in the chain, and exports the result as an agent specification.

![Skill composer](docs/screenshots/06-composer.png)

### Home

![Agent Skills Compendium home](docs/screenshots/01-home.png)

## Frameworks

Beyond the registry itself, three framework layers make the definitions
testable, governable and portable:

| | |
|---|---|
| [Evaluation](evaluation/evaluation-framework.md) | Nine scored dimensions with validity conditions for a reportable result. Machine-readable via [`evaluation-schema.yaml`](evaluation/evaluation-schema.yaml). |
| [Governance](governance/skill-governance.md) | Risk classification, permission scoping, human-approval triggers, audit and escalation requirements. Machine-readable via [`governance-schema.yaml`](governance/governance-schema.yaml). |
| [Portable schema](schema/) | JSON Schema and YAML generated from the canonical zod definition, self-tested against all 76 skills. Served at `/api/schema`. |

Generated artifacts are never hand-maintained:

```bash
npm run generate:schema   # schema/ from src/lib/schema.ts, self-tests on all 76 skills
npm run export:skills     # dist/skills/**/SKILL.md packages
```

## Project documents

| Document | Purpose |
|---|---|
| [AUTHORS.md](AUTHORS.md) | Creator and contributors |
| [COPYRIGHT.md](COPYRIGHT.md) | Copyright, third-party materials, licensing status |
| [PROVENANCE.md](PROVENANCE.md) | Origin, attribution policy, verification status |
| [CITATION.cff](CITATION.cff) | Machine-readable citation metadata |
| [CHANGELOG.md](CHANGELOG.md) | Release history |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute a skill |
| [LICENSE](LICENSE) | MIT License |
| [docs/ORIGIN.md](docs/ORIGIN.md) | Conceptual origin of the framework |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | The five-layer model and skill specification |
| [docs/TAXONOMY.md](docs/TAXONOMY.md) | All 20 categories with their capabilities |
| [docs/INTEROPERABILITY.md](docs/INTEROPERABILITY.md) | Position relative to MCP, SKILL.md and agent runtimes |
| `/api-reference` | Live API documentation, rendered from the route definitions |
| [evaluation/](evaluation/evaluation-framework.md) | Skill evaluation framework and result schema |
| [governance/](governance/skill-governance.md) | Skill governance model and policy schema |

---

**Agent Skills Compendium**  
Created and originally architected by **Jerson Boyd Milan**  
https://jersonboydmilan.com/

© 2026 Jerson Boyd Milan
