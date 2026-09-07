<!--
Agent Skills Compendium
Copyright © 2026 Jerson Boyd Milan
-->

# Interoperability

The Compendium describes a layer that sits between tools and agents. It is
designed to coexist with the ecosystems either side of it rather than to
replace them.

## Six things that are routinely conflated

| Concern | What it answers | Examples |
|---|---|---|
| **Skill definition** | What is this capability, and how is it known to have succeeded? | This Compendium |
| **Skill metadata** | How is it categorised, versioned, governed? | `taxonomy`, `risk_level`, `version` |
| **Skill packaging** | How does one skill travel as a unit? | `SKILL.md`, a YAML or JSON file |
| **Tool protocol** | How does an agent reach a system? | MCP, function calling, plain HTTP |
| **Agent runtime** | What executes the work and enforces the boundaries? | Any agent framework |
| **Skill registry** | How are many skills discovered, served and versioned? | The API in this repo |

Most disagreement about "what a skill is" comes from two people meaning
different rows. The Compendium is the first row, with opinions about the second.

## What this does not replace

**Not a tool protocol.** MCP and equivalents answer *how an agent reaches a
system*. A skill definition answers *what the agent is trying to accomplish and
how it knows it succeeded*. A skill's `tools` field references capabilities by
identifier; it does not specify the transport. The two compose: MCP supplies
the tool, the skill supplies the procedure, validation and escalation.

**Not a replacement for `SKILL.md`.** SKILL.md-style formats are packaging. A
Compendium definition can be *rendered into* SKILL.md — `npm run export:skills`
does exactly that for all 76 skills. Packaging and definition are different
concerns, and the Compendium is deliberately not opinionated about which
packaging an ecosystem prefers.

**Not a runtime.** Nothing here requires a particular executor. The definitions
are data. The governance model explicitly places *enforcement* in whatever
runtime consumes them, precisely so the definitions stay portable.

**Not a finished standard.** The taxonomy and the five-layer model are an open
reference framework at v0.2. They are stable enough to build against and
expected to move.

## One definition, several representations

The canonical definition lives in `content/skills/<slug>.yaml`. Everything else
is derived, so nothing can drift:

```
content/skills/<slug>.yaml          ← canonical, single source of truth
        │
        ├── schema/skill.schema.json    generated · JSON Schema, validates all 76
        ├── schema/skill.schema.yaml    generated · same, YAML form
        ├── dist/skills/**/SKILL.md     generated · packaging format
        ├── GET /api/skills/:slug       served    · JSON
        └── GET /api/skills/:slug/export  served  · YAML, round-trippable
```

The round-trip property is tested: an exported YAML definition re-validates
against the schema unchanged.

## Stable identifiers

Skills are addressed by slug, which is also the filename, which is also the
route. The content validator enforces all three agreeing.

The registry uses flat slugs (`source-credibility-assessment`) with category as
a field, rather than encoding category into a path (`research.source_verification`).
The reason is that a skill's category can be revised without breaking every
reference to it — the slug is an identity, not a location. The dotted form is
still derivable for ecosystems that prefer it: `category` + `slug`.

## Versioning

Semantic versioning per skill:

- **Major** — a change to `inputs`, `outputs` or `validation`. These break
  consumers, because they change the contract.
- **Minor** — a change to `procedure` or `decision_rules`. Behaviour changes,
  contract holds.
- **Patch** — clarification with no behavioural change.

The schema is versioned separately from the skills it describes. Breaking schema
changes require a schema version change.

## Consuming the registry without this application

The application is one consumer of the content, not a dependency of it. Anything
that can read YAML can use the registry:

```bash
# validate a definition against the portable schema
npx ajv validate -s schema/skill.schema.json -d my-skill.json

# fetch a definition
curl https://<host>/api/skills/source-credibility-assessment/export?format=yaml
```

`src/lib/repository.ts` defines the read contract the application uses. Swapping
the file-backed store for a database means implementing that interface — no page
or route reaches past it.

---

**Agent Skills Compendium**  
Created and originally architected by **Jerson Boyd Milan**  
https://jersonboydmilan.com/

© 2026 Jerson Boyd Milan
