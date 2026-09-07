<!--
Agent Skills Compendium
Copyright © 2026 Jerson Boyd Milan
-->

# 📦 Releasing

Two cadences run in parallel, deliberately.

**The registry ships continuously.** A new or corrected skill is merged to `main` as soon
as it passes review and CI. Consumers reading the API or the site get it immediately.
Nothing waits for a release.

**Tagged releases collect the changes.** They exist so someone can pin a version, cite a
version, and read what changed between two of them without a commit log. Roughly monthly
when there is something to say, and immediately for a security fix.

## What a version number means here

The project version tracks the **framework** — the schema, the API contract and the
architecture. Individual skills carry their own semver, independently.

| Change | Bump |
|---|---|
| A field added to the canonical schema, or an API response shape changed | major, until 1.0 minor |
| Skills added or revised; a new route; a new framework document | minor |
| Corrections, wording, dependency bumps | patch |

Every skill definition versions itself: new skills start at `1.0.0`, a procedure change is
a minor bump, and a change to inputs, outputs or validation is a major bump because it
breaks consumers.

## Cutting a release

1. **Move `[Unreleased]` into a version section** in [CHANGELOG.md](CHANGELOG.md), with
   the date and the compare link. Keep the Keep a Changelog headings — the release
   workflow reads this section verbatim and fails the release if it is missing.

   ```markdown
   ## [0.2.0] — 2026-03-14
   ```

2. **Bump `version` in `package.json`** to match.

3. **Update `CITATION.cff`** — `version` and `date-released`. It is the machine-readable
   citation record; a release that leaves it stale makes every citation wrong.

4. **Verify locally.**

   ```bash
   npm run check
   npm run build
   ```

5. **Commit, tag and push.**

   ```bash
   git commit -am "chore: release v0.2.0"
   git tag -a v0.2.0 -m "v0.2.0"
   git push origin main --follow-tags
   ```

The tag push triggers [`.github/workflows/release.yml`](.github/workflows/release.yml),
which re-runs `npm run check` and the production build against the tag — a tag is not a
release until it passes what `main` has to pass — then packages every skill as a `SKILL.md`
bundle, attaches the generated JSON Schema and YAML schema, and publishes a GitHub Release
whose notes are that version's changelog section.

`workflow_dispatch` re-runs the same job against an existing tag if a release needs
rebuilding.

## Release contents

| Asset | What it is |
|---|---|
| `agent-skills-compendium-<version>-skill-md.tar.gz` | Every skill as a `SKILL.md` package, by category |
| `skill.schema.json` | The canonical JSON Schema, generated from `src/lib/schema.ts` |
| `skill.schema.yaml` | The same schema in YAML |

## Security releases

A fix for a reported vulnerability does not wait for the next scheduled release. Ship it,
tag it, and publish the advisory alongside. See [SECURITY.md](SECURITY.md).

## Keeping the changelog honest

Every merged pull request that changes behaviour adds a line to `[Unreleased]` under
Added, Changed, Fixed, Deprecated, Removed or Security. Dependency bumps do not need a
line unless they change behaviour. If a change is not worth a changelog line, it probably
did not need to be a release-visible change.

---

**Agent Skills Compendium**
Created and originally architected by **Jerson Boyd Milan**

© 2026 Jerson Boyd Milan
