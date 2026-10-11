<!--
Agent Skills Compendium
Copyright © 2026 Jerson Boyd Milan
-->

# 🛰️ Agent fleet

Deploy hundreds of agents against one objective, each carrying a skill set drawn from the
registry, and inspect every one of them while it runs. The interface is at `/fleet`; the
machine interface is under `/api/fleet`.

## What this is, precisely

**A rehearsal, not an execution.** No model is called and no tool is invoked. Each agent is
played out against the definitions it carries:

| What happens | Where it comes from |
|---|---|
| How long a step takes | the skill's declared `build_speed` and `complexity` |
| Whether a step goes wrong | the skill's `maturity`, weighted by complexity and risk |
| *What* went wrong | one of that skill's own `failure_modes` — never invented |
| Whether it recovers | the `mitigation` that failure mode declares |
| What happens when it does not | that skill's `escalation` rule, quoted verbatim |
| Whether the run succeeded | every one of the skill's `validation` checks |

The consequence is the point: **a fleet is only ever as good as the definitions it runs.**
A skill whose failure modes are imaginary produces imaginary failures. A skill whose
validation checks cannot be checked produces a run whose success means nothing. Deploying a
few hundred agents is a fast way to see which definitions are carrying their weight.

This is the same idea as the registry's own `dry-run-rehearsal` skill, applied to the
registry itself.

### Why this does not make the Compendium a runtime

[INTEROPERABILITY.md](INTEROPERABILITY.md) says the definitions are data and that enforcing
the governance model belongs to whatever executes them. That still holds. The fleet
*reads* definitions and plays them back; it has no tool access, no credentials and no side
effects beyond its own memory. The boundary it demonstrates is the one a real runtime would
have to implement — an approval gate above a risk threshold, aggregated permissions, and
restricted actions surfaced per agent — without crossing it.

## Deploying

```bash
curl -X POST localhost:3000/api/fleet \
  -H 'content-type: application/json' \
  -d '{
    "objective": "Harden the agent surface before launch",
    "size": 120,
    "strategy": "spread",
    "concurrency": 16,
    "approvalThreshold": "high",
    "seed": 1
  }'
```

### Roster strategies

| Strategy | The pool |
|---|---|
| `spread` | the whole registry |
| `category` | only the categories named in `categories` |
| `layer` | only the layers named in `layers` |
| `explicit` | exactly the slugs named in `skills` |

Agents are dealt from the pool in order, so **every skill gets an agent before any skill
gets a second one**. A fleet larger than its pool is a deliberate case: 300 agents over 76
skills means roughly four agents per role, each on its own shard of the objective.

### What an agent carries

A primary skill, its prerequisite closure in dependency order, and up to two complements —
resolved through the same `prerequisiteChain` the composer uses. Its risk level is the
highest in that whole set, not just the primary skill's, and its permissions and tools are
the union across it.

### The approval gate

`approvalThreshold` holds every agent at or above a risk level in `awaiting-approval`
before it runs. The fleet runs everything below the line, then **pauses and says it is
waiting on a person**. Clearing the gate resumes it; an operator pause is not lifted by an
approval.

This is the governance model the registry already describes, enforced for once rather than
documented.

## Watching

`/fleet` has two views over the same roster. **Swarm** is one cell per agent, coloured by
status — the shape of a few hundred agents at a glance. **Roster** is the same set as rows
with progress. Clicking any agent opens its full run: skill set, every step, the failure
modes it hit with their mitigations, the validation checks, and its governance surface.

The swarm grid shares one tab stop and moves with the arrow keys, because a 500-agent grid
with a tab stop per cell would be unusable with a keyboard.

Updates arrive over server-sent events from `/api/fleet/:id/stream`: feed lines as they
happen, and a roster snapshot on a timer, so a 500-agent fleet is one connection rather
than a poll per agent.

## Determinism

The same seed, size, strategy and registry produce the same fleet — the same agents, the
same shards, the same failures, the same outcome. Each agent's whole run is decided before
it starts, so the scheduler only controls *when* a transition becomes visible, never *what*
it is. Two rehearsals of the same seed are comparable; change the registry and the
difference is the registry's.

## Limits, stated

- **Fleets live in process memory.** They do not survive a restart, and they are not
  shared between server instances. A cap of 12 fleets and 400 feed events keeps one
  process bounded. The event feed is a live view; the per-agent timeline is the record.
- **500 agents, 64 concurrent** per fleet.
- **The `/api/fleet` routes are never cached**, unlike every registry route.
- **No persistence layer.** A fleet worth keeping should be exported by whatever consumes
  the API, the same way the composer's output is.

## Routes

| | |
|---|---|
| `POST /api/fleet` | plan and deploy |
| `GET /api/fleet` | every fleet in this process |
| `GET /api/fleet/:id` | one fleet, its aggregate and feed |
| `GET /api/fleet/:id/agents` | the roster, filterable and paged |
| `GET /api/fleet/:id/agents/:agentId` | one agent in full |
| `GET /api/fleet/:id/stream` | server-sent events |
| `POST /api/fleet/:id/control` | pause, resume, abort, approve |

Full parameters are at `/api-reference`, which renders from the same route list.

---

**Agent Skills Compendium**
Created and originally architected by **Jerson Boyd Milan**

© 2026 Jerson Boyd Milan
