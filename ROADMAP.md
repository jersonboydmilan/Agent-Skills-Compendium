<!--
Agent Skills Compendium
Copyright © 2026 Jerson Boyd Milan
-->

# 🗺️ Roadmap

Direction, not promises. The framework is at `v0.1` — stable enough to build against, and
expected to move. Items here are open to contribution; the ones marked 🙌 are good places
to start, and most are issues waiting to be written up rather than work already underway.

## Now — the registry itself

The registry is the product, and it is the part that benefits most from people who know a
domain.

- **More skills, at the current depth.** 76 today across 20 categories. The bar is
  [docs/SKILL_AUTHORING.md](docs/SKILL_AUTHORING.md), not volume — a category with four
  well-specified skills is worth more than one with twenty thin ones. 🙌
- **Corrections from practitioners.** A failure mode that is not real, a validation check
  that cannot be checked, a procedure that is not how the work is actually done. These are
  the most valuable pull requests the project can receive. 🙌
- **Coverage gaps.** Categories where the existing skills assume a narrower context than
  the category name promises.

## Next — making definitions provable

- **Worked evaluation results.** The [evaluation framework](evaluation/evaluation-framework.md)
  defines nine scored dimensions and the validity conditions for a reportable result.
  Applying it to real skills and publishing the scores would turn a framework into
  evidence.
- **Governance conformance checking.** [`governance-schema.yaml`](governance/governance-schema.yaml)
  describes risk classification, permission scoping and approval triggers. A checker that
  reads a definition and reports whether its declared permissions match what its procedure
  actually needs is a self-contained, testable contribution. 🙌
- **Cross-registry interoperability.** [docs/INTEROPERABILITY.md](docs/INTEROPERABILITY.md)
  positions the specification against MCP and `SKILL.md`. Importers and exporters for other
  formats keep definitions portable rather than captive.

## Later — deliberately out of scope for now

- **Execution.** The composer plans; it does not run anything. Nothing in the data model
  blocks a runtime, and enforcement of the governance model belongs to whatever executes
  the definitions. That separation is the point, so a runtime would live beside this
  project rather than inside it.
- **A hosted deployment.** The site runs locally with no database, no API key and no
  environment file. A public deployment is a question of hosting, not of code.
- **A storage backend other than the filesystem.** Nothing outside
  `src/lib/content-store.ts` knows the registry lives on disk; pages and API routes depend
  on the `SkillRepository` interface only. Postgres, KV or a remote registry means
  implementing that interface.

## Known loose ends

Honest list of things the current build does not do:

- Analytics events are queued on `window.__skillCompendiumEvents` for a collector to
  drain. No vendor is wired up.
- Typography uses system font stacks rather than a licensed webfont, so the build has no
  network dependency.
- The framework version is `0.1`; the API contract may still change with a minor bump.

## Proposing something not listed

Open an [enhancement issue](../../issues/new?template=enhancement.yml). Describe the
situation that is hard today before describing the solution — the problem is the part
worth agreeing on first.

---

**Agent Skills Compendium**
Created and originally architected by **Jerson Boyd Milan**

© 2026 Jerson Boyd Milan
