<!--
Agent Skills Compendium
Copyright © 2026 Jerson Boyd Milan
-->

# Changelog

All notable changes to the Agent Skills Compendium are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/), and the
project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Test suite (`npm test`) covering search scoring and filtering, relationship
  resolution and ordering, export round-tripping, and registry integrity
- `npm run check` — typecheck, lint, content validation and tests in one command
- `GET /api/schema` — the canonical JSON Schema, so a definition can be
  validated without cloning the repository
- Collapsible filter panel on the skill registry below the `lg` breakpoint
- Active-section marking in the primary navigation
- Empty states for a category or layer with no published skills, and a
  clear-all-filters action in the registry's no-results state

### Changed

- The composer keeps its selection and workflow name in the address bar, so a
  composition survives a refresh and can be shared as a link
- "Compose with this skill" now opens the composer with that skill selected
- The skill page's table of contents is derived from the sections actually
  rendered, so a definition with empty optional sections has no dead anchors
- The header search index no longer carries `purpose` or duplicated name and
  slug text, cutting roughly a quarter off the transferred weight of every
  page; the dialog offers a full-registry search for anything it does not match
- `--color-ink-faint` darkened in both themes so every text token meets
  WCAG AA 4.5:1 on every surface
- `/api/skills` returns 400 naming the accepted values when a closed-vocabulary
  filter is misspelled, instead of an empty result set
- `npm run lint` runs ESLint against a flat config instead of prompting for
  interactive setup
- Content is re-read per request in development, so a YAML edit no longer
  requires a server restart

### Fixed

- The skill page's link to the export endpoint replaced the page with raw YAML
  instead of opening it alongside
- `GET /api/search?limit=` with a value below 1 silently dropped results off the
  end of the list rather than returning the default page size
- The search dialog now traps focus, locks background scrolling, restores focus
  on close, and exposes combobox semantics to assistive technology
- Copy actions in the composer and on skill pages report success, and explain
  the fallback when the browser refuses clipboard access
- Skill pages no longer render an empty Tools panel when a definition declares
  no tools
- The 404 page has its own title and is excluded from indexing

## [0.1.0] — 2026-09-01

> Published to GitHub on 2026-09-01. Not yet tagged: no `v0.1.0` Git tag or
> GitHub release exists, pending commit-signing configuration.

### Added

- Canonical Agent Skill Specification, enforced by a schema validator
- Five-layer capability architecture (L1 Cognitive, L2 Knowledge, L3 Action,
  L4 Domain, L5 Agentic), stored as data
- Agent Skills taxonomy: 20 categories, stored as data rather than encoded in
  the application
- Initial skill registry: 76 fully specified skills across all 20 categories
- Normalized tool registry: 49 tools referenced by skills by identifier
- Skill relationship model — prerequisite, complementary, successor, related —
  with referential integrity enforced across the registry
- `SkillRepository` interface with a file-backed implementation, so the storage
  backend can be replaced without changing pages or routes
- Content validator (`npm run validate:content`) enforcing schema conformance,
  slug/filename agreement, unique identifiers, and resolution of every
  category, layer, tool and skill-to-skill reference
- Web application: homepage, skill registry with search and seven filter
  facets, skill detail pages, category pages, layer pages
- Skill composer: prerequisite resolution, execution ordering, aggregation of
  required permissions, tools and risk level, and workflow specification export
- Machine interface: read API over skills, categories, layers, search, skill
  relationships, and YAML/JSON export
- Round-trippable YAML export — an exported definition re-validates against the
  schema unchanged
- SEO surface: unique routes for every skill, category and layer, plus sitemap
  and robots
- Typed analytics event surface (queued client-side; no collector wired)
- Node-link logo rendered as inline SVG, themed via `currentColor`, with
  stroke weight derived from render size; matching favicon
- Interface screenshots in `docs/screenshots/`, captured at 1440w @2x against
  a production build, referenced from the README
- Skill evaluation framework: nine scored dimensions, validity conditions for a
  reportable result, and a deployment bar, with a machine-readable result schema
- Skill governance framework: risk classification, permission scoping,
  human-approval triggers, audit, escalation and data-handling requirements,
  with a runtime-enforceable policy schema
- Portable schema artifacts (`schema/skill.schema.json`, `.yaml`) generated from
  the canonical zod definition and self-tested against all 76 skills
- `SKILL.md` package exporter, rendering every skill into a portable packaging
  format without introducing a second source of truth
- Interoperability documentation positioning the project relative to tool
  protocols, packaging formats and agent runtimes
- `/api-reference` page documenting all seven endpoints with parameters,
  response shapes and working examples, rendered from a single route definition
  so the documentation cannot drift from the API
- README sections covering ecosystem position and what the project is not
- Authorship and provenance documentation

### Fixed

- Footer API links used `next/link`, which prefetches on hover and on viewport
  entry, firing real requests against four endpoints just from scrolling the
  footer into view; and their screen-reader hints polluted the page's text
  content, which matters on a site meant to be read by agents

- Registry filter input could be clipped by the CLEAR control, truncating its
  placeholder text; the input now shrinks correctly within its row
- Header logo stroke rendered as a 0.22px hairline, because a fixed stroke in
  the 200-unit viewBox does not survive scaling down to header size
- Header logo sat 7.6px above the wordmark: the link used baseline alignment,
  and an inline SVG's baseline is its bottom edge rather than a text baseline
- Header logo recoloured from the accent to the ink token, so it matches the
  wordmark and inverts correctly in dark mode

### Changed

- Commit and tag signing enabled using an Ed25519 SSH key, configured
  repository-local so no global Git configuration was modified. Signatures
  verify locally via `gpg.ssh.allowedSignersFile`.

- Licensing unified on MIT. The skill schema previously defaulted the per-skill
  `license` field to `CC-BY-4.0`, which propagated into all 76 definitions and
  contradicted the repository's MIT LICENSE. The schema default and every
  definition now read MIT.

### Known limitations

- Skill execution is out of scope for this release; the data model does not
  preclude it
- Commits before this point are unsigned; they were not rewritten, because
  re-signing published history would change every commit SHA
- Typography uses system font stacks rather than a licensed webface
