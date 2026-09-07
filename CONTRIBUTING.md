<!--
Agent Skills Compendium
Copyright © 2026 Jerson Boyd Milan
-->

# 🤝 Contributing

Contributions to the Agent Skills Compendium are welcome — new skills, corrections to
existing ones, and improvements to the site, the API and the tooling.

**New here?** The fastest useful contribution is usually a correction to a skill you know
something about. Every skill page exposes its own YAML, so you can read the definition,
disagree with it concretely, and open a pull request against one file.

| I want to… | Start here |
|---|---|
| 🧩 Add a skill | [docs/SKILL_AUTHORING.md](docs/SKILL_AUTHORING.md), then [open a skill proposal](../../issues/new?template=skill_proposal.yml) |
| ✏️ Fix or sharpen an existing skill | Edit `content/skills/<slug>.yaml` and open a PR |
| 🐞 Report something broken | [Open a bug report](../../issues/new?template=bug_report.yml) |
| ✨ Propose a change to the framework | [Open an enhancement](../../issues/new?template=enhancement.yml) |
| 🔐 Report a vulnerability | Privately — see [SECURITY.md](SECURITY.md). Not a public issue. |

## Setting up

```bash
git clone https://github.com/jersonboydmilan/Agent-Skills-Compendium.git
cd Agent-Skills-Compendium
npm install
npm run dev          # http://localhost:3000
```

Node 20 or newer. No database, no API key, no environment file.

```bash
npm run check             # what CI runs: typecheck + lint + content validation + tests
npm run validate:content  # schema + referential integrity across the whole registry
npm test                  # node --test, no test framework dependency
npm run build             # production build; run this for any code change
```

`npm run check` must exit zero before you open a pull request. CI runs the same commands
on Node 20 and 22, plus a build and a check that generated artifacts have not drifted.

## Attribution

Contributors retain attribution for their original contributions.

The original project and architecture were created by **Jerson Boyd Milan**.

Contributors should not remove or alter existing copyright, authorship, license, or
provenance notices. Add yourself to [AUTHORS.md](AUTHORS.md) and set the `author` field on
any skill definition you write to your own name.

## What the registry admits

**Capabilities, not prompts.** A prompt produces a result once. A skill declares a
trigger, typed inputs, a procedure, validation criteria, failure modes and an escalation
path — so it can be tested, governed and composed.

If an entry cannot state how it validates its own output, it is a prompt and does not
belong here. See `/contribute` in the running application for the same standard rendered,
and [docs/SKILL_AUTHORING.md](docs/SKILL_AUTHORING.md) for how to meet it.

## Skill contributions

New skills must include:

skill name · purpose · trigger · inputs · tools · procedure · decision rules · outputs ·
validation · failure modes · escalation · examples · related skills

Additional admission rules:

- **Validation must be third-party checkable.** "The output is high quality" is not a
  check. "Every deduction in the rationale names an observable property of the source" is.
- **Failure modes must be real.** Each must be one that has occurred or that follows from
  the procedure, with a mitigation that changes the procedure.
- **Escalation must be specific.** Name the condition and the recipient. "Escalate if
  unsure" is not an escalation rule.
- **Relationships must resolve.** The validator rejects dangling edges.
- **Restricted actions are mandatory above low risk.** State what the skill may not do, in
  terms a runtime could enforce.
- **One skill, one outcome.** Composite work belongs in the composer.
- **Tools are referenced, not invented.** Ids come from `content/tools.yaml`.

Contributors should clearly identify third-party material and comply with applicable
licenses.

## Workflow

1. Fork, and branch from `main`. Branch names like `skill/<slug>` or `fix/<short-thing>`.
2. Write the definition to `content/skills/<slug>.yaml`. The filename must match the slug.
3. Run `npm run validate:content`. It enforces the schema and resolves every reference. It
   must exit zero.
4. Run `npm run check`, and `npm run build` for code changes.
5. Version it. New skills start at `1.0.0`. A procedure change is a minor bump; a change to
   inputs, outputs or validation is a major bump, because it breaks consumers. Set
   `updated_at`.
6. Open the pull request. The template asks what changed, why, what it affects, and how you
   versioned it.

### Commit messages

`type: imperative summary`, then a body explaining *why* rather than restating the diff.
Types in use: `feat`, `fix`, `docs`, `chore`, `ci`, `refactor`, `test`.

```
fix: stop the composer dropping a prerequisite outside the selection

An unselected prerequisite was being ordered into the sequence but never
added to it, so the exported specification referenced a skill the workflow
did not contain.
```

## Pull requests

Pull requests should explain:

1. What changed.
2. Why it changed.
3. Which skills or architecture are affected.
4. Whether new dependencies were introduced.
5. Whether licensing or attribution is affected.

Small and single-purpose merges faster than large and mixed. A pull request that adds a
skill *and* refactors the search index is two pull requests.

### What review looks for

For a skill: the seven admission rules above, and whether the definition is one a
competent practitioner would recognise as how the work is actually done.

For code: whether it belongs in the layer it was put in — pages and API routes depend on
the `SkillRepository` interface only, and nothing outside `src/lib/content-store.ts` may
assume the registry lives on disk.

Expect at least one round of comments on a first skill. That is normal, and it is the
point: the standard is what makes the registry worth consuming.

## Releases

See [RELEASING.md](RELEASING.md). Registry additions ship continuously on `main`; tagged
releases collect them with a [CHANGELOG](CHANGELOG.md) entry.

---

**Agent Skills Compendium**
Created and originally architected by **Jerson Boyd Milan**
https://jersonboydmilan.com/

© 2026 Jerson Boyd Milan
