<div align="center">

<img src="docs/assets/banner.svg" alt="Agent Skills Compendium" width="100%">

<br>

[![CI](https://img.shields.io/github/actions/workflow/status/jersonboydmilan/Agent-Skills-Compendium/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI&labelColor=0b1020&color=22c55e)](https://github.com/jersonboydmilan/Agent-Skills-Compendium/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-a78bfa?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=0b1020)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0-38bdf8?style=for-the-badge&logo=semanticrelease&logoColor=white&labelColor=0b1020)](CHANGELOG.md)
[![Skills](https://img.shields.io/badge/skills-76-e879f9?style=for-the-badge&logo=databricks&logoColor=white&labelColor=0b1020)](content/skills)
[![JSON Schema](https://img.shields.io/badge/schema-JSON%20Schema-f59e0b?style=for-the-badge&logo=json&logoColor=white&labelColor=0b1020)](schema/)

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Zod-3-3E67B1?style=flat-square&logo=zod&logoColor=white)](https://zod.dev/)
[![Node](https://img.shields.io/badge/Node-%E2%89%A520-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22c55e?style=flat-square&logo=github&logoColor=white)](CONTRIBUTING.md)

**[📚 Architecture](docs/ARCHITECTURE.md)** ·
**[🗂️ Taxonomy](docs/TAXONOMY.md)** ·
**[🔌 Interoperability](docs/INTEROPERABILITY.md)** ·
**[⚖️ Governance](governance/skill-governance.md)** ·
**[🧪 Evaluation](evaluation/evaluation-framework.md)** ·
**[🤝 Contributing](CONTRIBUTING.md)**

</div>

---

A structured intelligence layer for building, understanding, and deploying AI agent
capabilities.

This is a **capability registry**, not a prompt library. The distinction it is built on:

- 🔧 A **tool** is something an agent can *use* — a browser, a SQL client, a deployment system.
- 🧠 A **skill** is something an agent knows how to *accomplish* — with a trigger, inputs, a
  procedure, validation criteria, failure modes and an escalation path.

A skill may invoke several tools to produce a validated outcome.

<table>
<tr>
<td align="center"><strong>76</strong><br><sub>skills</sub></td>
<td align="center"><strong>20</strong><br><sub>categories</sub></td>
<td align="center"><strong>5</strong><br><sub>architectural layers</sub></td>
<td align="center"><strong>49</strong><br><sub>normalised tools</sub></td>
<td align="center"><strong>8</strong><br><sub>public API routes</sub></td>
<td align="center"><strong>MIT</strong><br><sub>per definition</sub></td>
</tr>
</table>

## 🧭 Contents

| | | |
|---|---|---|
| [📐 Where this sits](#-where-this-sits) | [🚫 What this is not](#-what-this-is-not) | [✍️ Authorship](#️-authorship) |
| [📦 What is here](#-what-is-here) | [⚡ Running it](#-running-it) | [🏛️ Architecture](#️-architecture) |
| [🔌 Machine interface](#-machine-interface) | [🎬 **Examples**](#-examples) | [➕ Adding a skill](#-adding-a-skill) |
| [🗒️ Notes on the current build](#️-notes-on-the-current-build) | [🖥️ Interface](#️-interface) | [🧱 Frameworks](#-frameworks) |
| [🙌 Contributing](#-contributing) | [📄 Project documents](#-project-documents) | [🗺️ Roadmap](ROADMAP.md) |

## 📐 Where this sits

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

## 🚫 What this is not

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

**Not a finished standard.** An open reference framework at v0.2, stable enough
to build against and expected to move.

See [docs/INTEROPERABILITY.md](docs/INTEROPERABILITY.md) for the full position.

## ✍️ Authorship

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

## 📦 What is here

| | |
|---|---|
| 🧠 **Skills** | 76, each fully specified against one canonical schema |
| 🗂️ **Categories** | 20, stored as data — adding one is a content change, not a code change |
| 🧬 **Architectural layers** | 5 — Cognitive, Knowledge, Action, Domain, Agentic |
| 🔧 **Tools** | 49, in a normalised registry that skills reference by id |

Every skill answers ten questions completely: what it does, when to use it, what it needs,
what tools it may use, how it executes, how it validates the result, what goes wrong, when it
should escalate, what it produces, and which skills it connects to.

## ⚡ Running it

```bash
git clone https://github.com/jersonboydmilan/Agent-Skills-Compendium.git
cd Agent-Skills-Compendium
npm install
npm run dev          # http://localhost:3000
```

Requires Node 20 or newer. There is no database, no API key and no environment file —
the registry is YAML on disk, read at request time.

Five minutes well spent, once it is up:

| | |
|---|---|
| 🔍 | Press <kbd>⌘K</kbd> anywhere and search skills, categories and layers |
| 📄 | Open any skill and read the whole specification, then copy its YAML |
| 🧩 | Open [`/compose`](http://localhost:3000/compose), select three skills, and watch prerequisites resolve and order themselves |
| 📡 | `curl localhost:3000/api/skills?layer=L5&risk=high` — the filters the UI uses, as JSON |

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

## 🏛️ Architecture

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

### 🔄 Swapping the storage backend

Nothing outside `src/lib/content-store.ts` knows the registry lives on disk. Pages and API
routes depend on the `SkillRepository` interface only. Moving to Postgres, a KV store or a
remote registry means implementing that interface and exporting a different `repository` —
no page, component or route changes.

## 🔌 Machine interface

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

## 🎬 Examples

### What a definition actually looks like

An excerpt from [`content/skills/source-credibility-assessment.yaml`](content/skills/source-credibility-assessment.yaml).
The parts that make it a skill rather than a prompt are the ones most registries leave
out — decision rules, validation, failure modes with mitigations, and escalation.

```yaml
skill:
  name: Source Credibility Assessment
  layer: L2
  purpose: >-
    Retrieval systems rank by relevance, not by trustworthiness, so an agent that
    treats retrieval order as credibility order will confidently repeat a
    marketing page or a content farm.
  trigger: >-
    Before any retrieved source is used to support a claim in a deliverable, and
    whenever two sources disagree.

  decision_rules:
    - condition: The publisher sells the thing the claim endorses
      action: Cap trust at low and label the claim vendor-sourced.
    - condition: No author, no date and no citations are present
      action: Reject the source for material claims regardless of apparent plausibility.

  validation:
    - check: The verdict is stated relative to the specific claim, not to the publication in general.
    - check: Every deduction in the rationale names an observable property of the source.

  failure_modes:
    - failure: Circular corroboration from three restatements of one origin.
      mitigation: Resolve the origin chain first; deduplicate by origin before counting.

  escalation:
    - condition: The only available sources for a material claim all score low.
      action: Report the claim as unestablished and escalate the sourcing gap rather than lowering the bar.

  risk_level: low
  required_permissions: [web.read]
  restricted_actions: [Bypassing paywalls, Circumventing access controls to inspect a source]
```

Ten more fields are omitted here — inputs, tools, the procedure, outputs, worked examples
and the relationship graph. The [full file](content/skills/source-credibility-assessment.yaml)
is 150 lines, and every one of the 76 is specified to the same depth.

### Ask the registry a question

```bash
curl -s 'localhost:3000/api/skills?layer=L5&risk=high' | jq '{count, total, skills: [.skills[].slug]}'
```

```json
{
  "count": 5,
  "total": 76,
  "skills": [
    "agent-role-design",
    "autonomy-staging",
    "dry-run-rehearsal",
    "llm-judge-calibration",
    "release-readiness-check"
  ]
}
```

A misspelled facet value answers with `400` and the vocabulary, rather than an empty list
that reads as "no such skill":

```bash
curl -s 'localhost:3000/api/skills?risk=hgih'
# {"error":"Unknown risk value \"hgih\". Accepted: low, medium, high, critical."}
```

### Follow the graph

Every skill declares prerequisites, complements and successors, and the API resolves the
inverse edges too — so you can ask what depends on a skill, not only what it depends on.

```bash
curl -s localhost:3000/api/skills/prompt-injection-defense/related \
  | jq '[.groups[] | {relation, skills: [.skills[].slug]}]'
```

```json
[
  {
    "relation": "complementary",
    "skills": ["tool-permission-scoping", "agent-red-teaming", "secure-code-review"]
  },
  {
    "relation": "successors",
    "skills": ["agent-red-teaming", "autonomy-staging"]
  },
  {
    "relation": "related",
    "skills": ["source-credibility-assessment", "memory-hygiene"]
  }
]
```

### Drive an agent from a definition

The definitions are data, so this is the whole integration. Nothing here is
Compendium-specific beyond the two URLs.

```ts
const REGISTRY = "http://localhost:3000";

// 1. Find candidates for the situation the agent is actually in.
const { skills } = await fetch(
  `${REGISTRY}/api/skills?q=untrusted+content&layer=L5`,
).then((r) => r.json());

// 2. Pull the full definition of the one you picked.
const { skill } = await fetch(`${REGISTRY}/api/skills/${skills[0].slug}`).then((r) =>
  r.json(),
);

// 3. Honour the governance surface before anything executes. The registry states
//    what a skill may not do; enforcing it is the runtime's job, deliberately.
if (!hasPermissions(skill.required_permissions)) {
  return escalate(skill.escalation);
}

// 4. The procedure is the plan. `validation` is the exit test — a run that cannot
//    satisfy every check has not succeeded, whatever the model reports.
for (const step of skill.procedure) await run(step);
return skill.validation.every(check);
```

### Compose a workflow

Selection and workflow name live in the query string, so a composition is a link:

```
/compose?skills=source-credibility-assessment,evidence-synthesis,competitive-intelligence-report
```

The composer resolves prerequisites, orders the chain so nothing runs before its
precondition, aggregates the permissions and tools the whole workflow needs, reports the
highest risk level in it, and exports the result as an agent specification. It plans; it
does not execute.

### Export the registry into your own agent

```bash
npm run export:skills     # dist/skills/<category>/<slug>/SKILL.md — all 76
```

```markdown
---
name: source-credibility-assessment
description: Classify a source by class, independence, incentive and recency, and
  assign a defensible trust score before its content is used.
version: 1.1.0
category: research_intelligence
layer: L2
risk: low
license: MIT
---

# Source Credibility Assessment
```

Each definition carries `license: MIT` in its own metadata, so a skill extracted from the
registry travels with its license attached. YAML export is round-trippable: the exported
document has the same shape as the source file and re-validates against the schema
unchanged.

## ➕ Adding a skill

1. Copy an existing definition (every skill page exposes its YAML).
2. Write it to `content/skills/<slug>.yaml`. The filename must match the slug.
3. Run `npm run validate:content`.
4. Version it. New skills start at `1.0.0`. A procedure change is a minor bump; a change to
   inputs, outputs or validation is a major bump, because it breaks consumers.

[**docs/SKILL_AUTHORING.md**](docs/SKILL_AUTHORING.md) is the practical guide — what each
field is for, the failure each admission rule prevents, worked ✅/❌ pairs for the fields
that get sent back in review, and a complete minimal skill that validates as written. The
same standard is rendered at `/contribute` in the running application.

The one question that decides admission: **can you state how the skill knows it
succeeded?** If not, it is a prompt.

## 🙌 Contributing

The most valuable contribution is not a new skill — it is a correction to an existing one
from someone who does the work. A failure mode that is not real, a validation check that
cannot be checked, a procedure that is not how it is actually done: those pull requests
are the ones that make the registry worth consuming.

| | |
|---|---|
| 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, the admission rules, the workflow, what review looks for |
| ✍️ [docs/SKILL_AUTHORING.md](docs/SKILL_AUTHORING.md) | How to write a definition that passes |
| 🗺️ [ROADMAP.md](ROADMAP.md) | Where this is going, and which parts are open |
| 📦 [RELEASING.md](RELEASING.md) | How versions are cut, and what a version number means |

Everything runs locally with `npm install && npm run dev` — no database, no API key, no
environment file. `npm run check` is exactly what CI runs.

## 🗒️ Notes on the current build

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

## 🖥️ Interface

### 🔍 Registry

Search and seven filter facets over the whole registry — architectural layer,
category, complexity, maturity, build speed, shareability and risk level. Facet
counts are live, and options that would return nothing are disabled rather than
hidden. Filter state is held in the URL, so a filtered view is shareable and
survives a refresh. Below the `lg` breakpoint the facets collapse behind a
disclosure carrying the active count, so results stay at the top of a phone
screen.

![Skill registry filtered to the L5 Agentic layer](docs/screenshots/02-skill-registry.png)

### 📄 Skill detail

Every skill renders its full specification: purpose, trigger, typed inputs,
tools, procedure, decision rules, outputs, validation, failure modes,
escalation, worked examples, relationships and the governance surface
(risk level, required permissions, restricted actions).

![Prompt Injection Defence skill specification](docs/screenshots/03-skill-detail.png)

<details>
<summary><b>🧬 Architectural layers</b> — the five-layer model, with live skill counts</summary>

<br>

![The five architectural layers](docs/screenshots/04-layers.png)

</details>

<details>
<summary><b>🗂️ Category view</b> — one of twenty capability categories</summary>

<br>

![Agent Security category](docs/screenshots/05-category.png)

</details>

### 🧩 Composer

Select skills and the composer resolves their prerequisites, orders them for
execution, aggregates required permissions and tools, reports the highest risk
level in the chain, and exports the result as an agent specification.

![Skill composer](docs/screenshots/06-composer.png)

<details>
<summary><b>🏠 Home</b></summary>

<br>

![Agent Skills Compendium home](docs/screenshots/01-home.png)

</details>

## 🧱 Frameworks

Beyond the registry itself, three framework layers make the definitions
testable, governable and portable:

| | |
|---|---|
| 🧪 [**Evaluation**](evaluation/evaluation-framework.md) | Nine scored dimensions with validity conditions for a reportable result. Machine-readable via [`evaluation-schema.yaml`](evaluation/evaluation-schema.yaml). |
| ⚖️ [**Governance**](governance/skill-governance.md) | Risk classification, permission scoping, human-approval triggers, audit and escalation requirements. Machine-readable via [`governance-schema.yaml`](governance/governance-schema.yaml). |
| 📐 [**Portable schema**](schema/) | JSON Schema and YAML generated from the canonical zod definition, self-tested against all 76 skills. Served at `/api/schema`. |

Generated artifacts are never hand-maintained:

```bash
npm run generate:schema   # schema/ from src/lib/schema.ts, self-tests on all 76 skills
npm run export:skills     # dist/skills/**/SKILL.md packages
```

## 📄 Project documents

| | Document | Purpose |
|---|---|---|
| ✍️ | [AUTHORS.md](AUTHORS.md) | Creator and contributors |
| ©️ | [COPYRIGHT.md](COPYRIGHT.md) | Copyright, third-party materials, licensing status |
| 🔗 | [PROVENANCE.md](PROVENANCE.md) | Origin, attribution policy, verification status |
| 🎓 | [CITATION.cff](CITATION.cff) | Machine-readable citation metadata |
| 📝 | [CHANGELOG.md](CHANGELOG.md) | Release history |
| 🤝 | [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, admission rules, workflow, review standard |
| ✍️ | [docs/SKILL_AUTHORING.md](docs/SKILL_AUTHORING.md) | Field-by-field guide to writing a definition |
| 🗺️ | [ROADMAP.md](ROADMAP.md) | Direction, and which parts are open to contribution |
| 📦 | [RELEASING.md](RELEASING.md) | Release cadence, versioning policy, release contents |
| 📜 | [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards and enforcement |
| 🔐 | [SECURITY.md](SECURITY.md) | Vulnerability reporting, scope and threat model |
| ⚖️ | [LICENSE](LICENSE) | MIT License |
| 🌱 | [docs/ORIGIN.md](docs/ORIGIN.md) | Conceptual origin of the framework |
| 🏛️ | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | The five-layer model and skill specification |
| 🗂️ | [docs/TAXONOMY.md](docs/TAXONOMY.md) | All 20 categories with their capabilities |
| 🔌 | [docs/INTEROPERABILITY.md](docs/INTEROPERABILITY.md) | Position relative to MCP, SKILL.md and agent runtimes |
| 📡 | `/api-reference` | Live API documentation, rendered from the route definitions |
| 🧪 | [evaluation/](evaluation/evaluation-framework.md) | Skill evaluation framework and result schema |
| ⚖️ | [governance/](governance/skill-governance.md) | Skill governance model and policy schema |
| 🤖 | [.github/](.github) | CI, issue forms, pull request template, Dependabot policy |

---

<div align="center">

### ⭐ Agent Skills Compendium

Created and originally architected by **Jerson Boyd Milan**

[![Website](https://img.shields.io/badge/jersonboydmilan.com-a78bfa?style=for-the-badge&logo=safari&logoColor=white&labelColor=0b1020)](https://jersonboydmilan.com/)
[![License](https://img.shields.io/badge/MIT-38bdf8?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=0b1020)](LICENSE)
[![Cite](https://img.shields.io/badge/cite%20this-CITATION.cff-e879f9?style=for-the-badge&logo=googlescholar&logoColor=white&labelColor=0b1020)](CITATION.cff)

If the framework is useful to you, a star helps other people find it.

© 2026 Jerson Boyd Milan

</div>
