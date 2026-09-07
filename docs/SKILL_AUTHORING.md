<!--
Agent Skills Compendium
Copyright © 2026 Jerson Boyd Milan
-->

# ✍️ Writing a skill

This is the practical guide: how to get from an idea to a definition the validator
accepts and a reviewer merges. For the conceptual model see
[ARCHITECTURE.md](ARCHITECTURE.md); for the admission standard as policy see
[CONTRIBUTING.md](../CONTRIBUTING.md).

## The bar, in one paragraph

A skill is not a prompt. A prompt produces a result once. A skill declares a trigger,
typed inputs, a procedure, validation criteria, failure modes and an escalation path — so
it can be tested, governed and composed. **If you cannot state how the skill knows it
succeeded, you do not have a skill yet.** That single question rejects most first drafts,
including ones that are genuinely useful as prompts.

## Before you write anything

1. **Search the registry.** `/skills?q=` or `curl localhost:3000/api/search?q=`. If an
   existing skill covers the outcome, propose an edit to it instead — a second definition
   of the same outcome makes composition ambiguous.
2. **Say the outcome out loud in one sentence.** If the sentence needs an "and", you have
   two skills. One skill, one outcome. Composite work belongs in the composer.
3. **Name the moment it fires.** If you cannot describe the situation an agent is in when
   it reaches for this, the trigger will be vague and the skill will never be selected.

## The ten questions

Every definition answers all ten, completely. The schema enforces that they are present;
review is about whether the answers are real.

| # | Question | Field |
|---|---|---|
| 1 | What does it do, and why does it need to exist? | `description`, `purpose` |
| 2 | When should an agent reach for it? | `trigger` |
| 3 | What does it need to start? | `inputs`, `prerequisites`, `dependencies` |
| 4 | What may it use? | `tools` |
| 5 | How does it execute? | `procedure` (2 steps minimum) |
| 6 | What does it decide along the way? | `decision_rules` |
| 7 | What does it produce? | `outputs` |
| 8 | How does it know it succeeded? | `validation` |
| 9 | What goes wrong, and what stops it? | `failure_modes` |
| 10 | When does it stop and hand over? | `escalation` |

Plus the governance surface — `risk_level`, `required_permissions`, `restricted_actions` —
and the graph, `related_skills`.

## Field by field, with the failure each rule prevents

### `slug`, `id`, `version`

Lowercase kebab-case. The filename must match the slug: `content/skills/<slug>.yaml`. The
id is `skl-<slug>`. New skills start at `1.0.0`.

### `layer`

Where the work happens, not where it is used.

| Layer | It is this layer if… |
|---|---|
| **L1 Cognitive** | the skill is about how the agent thinks before it acts |
| **L2 Knowledge** | it is about what the agent knows, and how it knows it is true |
| **L3 Action** | it changes something outside the agent |
| **L4 Domain** | it applies a specific field's standards |
| **L5 Agentic** | it is about the agent system itself — its authority, safety, evaluation, deployment |

### `purpose`

Not a restatement of the name. State the failure that happens without this skill.
Compare:

> ❌ "Assesses the credibility of sources."
>
> ✅ "Retrieval systems rank by relevance, not by trustworthiness, so an agent that treats
> retrieval order as credibility order will confidently repeat a marketing page."

The second tells a reader when they need it. The first does not.

### `trigger`

A situation, not a topic. "When doing research" is a topic. "Before any retrieved source
is used to support a claim in a deliverable, and whenever two sources disagree" is a
situation an agent can detect.

### `inputs`

At least one, each with `name`, `type`, `required`, `description`. Mark something required
only if the procedure genuinely cannot start without it. Say what the input is *for* in
the description — "the specific claim the source is being used to support; credibility is
claim-relative" earns its line, "the claim" does not.

### `tools`

Ids from [`content/tools.yaml`](../content/tools.yaml) only. The validator rejects
anything else. A tool is something the agent *uses*; if the thing you want to name is
something the agent *accomplishes*, it is a skill, and belongs in `related_skills`.

### `procedure`

Minimum two steps. Each step is a named action with a description that says how, not just
what. Steps are ordered and a reader should be able to follow them without the surrounding
prose.

### `decision_rules`

`condition` → `action`. This is where judgement gets written down. If the procedure says
"assess X" anywhere, there should be a rule saying what different assessments lead to.

### `validation`

**The admission test.** Each check must be verifiable by someone who did not run the
skill.

> ❌ "The output is high quality."
> ❌ "The analysis is thorough."
>
> ✅ "The verdict is stated relative to the specific claim, not to the publication in general."
> ✅ "Every deduction in the rationale names an observable property of the source."

If your checks all read like the first two, the skill is not ready.

### `failure_modes`

At least one, and each must be **real** — one that has occurred, or that follows directly
from the procedure. The `mitigation` must change the procedure, not just express care.

> ❌ failure: "The agent makes a mistake." mitigation: "Be careful."
>
> ✅ failure: "Circular corroboration from three restatements of one origin."
>    mitigation: "Resolve the origin chain first; deduplicate by origin before counting."

### `escalation`

Name the condition and the recipient or the resulting state. "Escalate if unsure" is not
an escalation rule. "The only available sources for a material claim all score low →
report the claim as unestablished and escalate the sourcing gap rather than lowering the
bar" is.

### `risk_level`, `required_permissions`, `restricted_actions`

Ask what the skill can do that you would not want done unattended.

- `risk_level`: `low` reads or advises; `medium` writes something reversible; `high`
  writes something hard to reverse or acts on others' behalf; `critical` moves money,
  changes access, or touches production without a gate.
- `required_permissions`: the narrowest scope that lets the procedure run — `web.read`,
  not `web.*`.
- `restricted_actions`: **mandatory above `low` risk.** State what the skill may not do,
  in terms a runtime could enforce. These are the lines the definition draws around
  itself.

### `related_skills`

Four kinds of edge: `prerequisites` (must run first), `complementary` (used alongside),
`successors` (naturally follows), `related` (worth knowing about). Every slug must resolve
— the validator rejects dangling edges, and the composer orders execution from
`prerequisites`, so a wrong edge produces a wrong plan.

## The loop

```bash
cp content/skills/source-credibility-assessment.yaml content/skills/<your-slug>.yaml
# edit it
npm run validate:content     # schema + every reference, exits non-zero on any error
npm run dev                  # read your skill at /skills/<your-slug>
```

`validate:content` checks the canonical schema on every file, that filenames match slugs,
that ids are unique, that every category, layer and tool exists, and that every
skill-to-skill edge resolves. Run it before you open the pull request; CI runs it too.

Then read your own skill on the site. A definition that is hard to read rendered is
usually a definition with prose where structure belongs.

## Versioning

| Change | Bump |
|---|---|
| New skill | starts at `1.0.0` |
| Wording, examples, tags | patch |
| Procedure, decision rules, failure modes | minor |
| **Inputs, outputs or validation** | **major** — it breaks consumers |

Set `updated_at` when you change a definition.

## What gets sent back in review

- validation checks that cannot be verified by a third party
- failure modes with mitigations that do not change the procedure
- "escalate if unsure"
- two outcomes in one skill
- a trigger that names a topic instead of a situation
- above-low risk with no restricted actions
- a `purpose` that restates the `name`
- tools invented rather than referenced from `content/tools.yaml`

## A complete minimal skill

Valid against the schema, and short enough to read in one go. Real definitions are longer
because real procedures are.

```yaml
skill:
  id: skl-example-minimal
  name: Example Minimal Skill
  slug: example-minimal
  version: 1.0.0
  category: knowledge-management
  layer: L2
  domain: null
  description: One sentence a reader can scan in a list of seventy-six.
  purpose: >-
    The failure that happens without this skill, stated concretely enough that a
    reader recognises the situation.
  trigger: The situation an agent is in when it should reach for this.
  inputs:
    - name: subject
      required: true
      type: string
      description: What the skill operates on, and what it is used for downstream.
  prerequisites: []
  tools: [llm-inference]
  dependencies: []
  procedure:
    - step: Establish the ground truth
      description: How the first move is made, not merely that it is made.
    - step: Produce the result
      description: How the output is assembled from what the first step established.
  decision_rules:
    - condition: The observable circumstance
      action: What the skill does about it.
  outputs:
    - name: result
      type: object
      description: What comes out, in terms a consumer can rely on.
  validation:
    - check: A property of the output a third party can check without rerunning the skill.
  failure_modes:
    - failure: Something that has actually gone wrong here.
      mitigation: A change to the procedure that prevents it.
  escalation:
    - condition: The named circumstance the skill cannot resolve.
      action: Who it goes to, and in what state it is handed over.
  examples:
    - title: A worked case
      input: {subject: an example subject}
      output: {result: what the skill produced}
  related_skills:
    prerequisites: []
    complementary: []
    successors: []
    related: [memory-hygiene]
  complexity: intermediate
  build_speed: 2
  shareability: 3
  maturity: prototype
  tags: [example]
  author: Your Name
  license: MIT
  risk_level: low
  required_permissions: []
  restricted_actions: []
  created_at: "2026-01-01T00:00:00Z"
  updated_at: "2026-01-01T00:00:00Z"
```

`build_speed` and `shareability` are 1–3. `complexity` is `beginner` · `intermediate` ·
`advanced` · `expert`. `maturity` is `experimental` · `prototype` · `beta` · `production` —
a first contribution is usually `prototype`, and `production` means it has been run in
anger.

---

**Agent Skills Compendium**
Created and originally architected by **Jerson Boyd Milan**

© 2026 Jerson Boyd Milan
