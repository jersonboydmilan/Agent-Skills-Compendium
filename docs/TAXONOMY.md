<!--
Agent Skills Compendium
Copyright © 2026 Jerson Boyd Milan
-->

# Agent Skills Taxonomy

The taxonomy is stored as data in `content/categories.yaml`, not encoded in the
application. Adding or retiring a category is a content change validated by
`npm run validate:content`.

Every skill has exactly one category (the *domain* of the work) and exactly one
architectural layer (the *kind* of work). See [ARCHITECTURE.md](ARCHITECTURE.md)
for the layer model.

All 20 categories below are **implemented** — each has at least one fully
specified skill, which the content validator enforces. Counts reflect registry
version 0.2.0 (76 skills).

## Summary

| # | Category | Skills | Primary layers |
|---|---|---|---|
| 1 | [Research & Intelligence](#research-intelligence) | 5 | L2, L1 |
| 2 | [Writing & Communication](#writing-communication) | 5 | L3, L1 |
| 3 | [Data & Analysis](#data-analysis) | 7 | L3, L1 |
| 4 | [Coding & Engineering](#coding-engineering) | 7 | L3, L1 |
| 5 | [Business Strategy](#business-strategy) | 5 | L1, L4 |
| 6 | [Workflow Automation](#workflow-automation) | 5 | L3, L5 |
| 7 | [Knowledge Management](#knowledge-management) | 4 | L2 |
| 8 | [Sales & GTM](#sales-gtm) | 2 | L4, L2 |
| 9 | [Marketing & Content](#marketing-content) | 3 | L3, L4 |
| 10 | [Finance & Operations](#finance-operations) | 3 | L4 |
| 11 | [Governance & Compliance](#governance-compliance) | 2 | L4, L5 |
| 12 | [Cybersecurity](#cybersecurity) | 4 | L4 |
| 13 | [DevOps & Infrastructure](#devops-infrastructure) | 4 | L3, L4 |
| 14 | [Physical AI & Robotics](#physical-ai-robotics) | 3 | L4, L5 |
| 15 | [Multi-Agent Systems](#multi-agent-systems) | 3 | L5 |
| 16 | [Executive & Institutional Intelligence](#executive-intelligence) | 3 | L1, L2 |
| 17 | [Personal Productivity](#personal-productivity) | 2 | L1, L3 |
| 18 | [Agent Evaluation](#agent-evaluation) | 3 | L5 |
| 19 | [Agent Security](#agent-security) | 3 | L5, L4 |
| 20 | [Agent Deployment](#agent-deployment) | 3 | L5, L3 |

## Categories

### <a id="research-intelligence"></a>1. Research & Intelligence

**Purpose** — Finding, triangulating and verifying information under time pressure. Market landscapes, competitor movement, technical due diligence, source credibility, evidence synthesis.

**Architectural layers present** — L1 Cognitive · L2 Knowledge

**Capabilities (5)**

- `competitive-intelligence-report` — Produce a sourced, confidence-scored assessment of a named competitor's position, movement and likely next actions. *(L2, production)*
- `evidence-synthesis` — Reconcile a body of conflicting sources into a single position that states what is established, what is contested, and what remains unknown. *(L1, production)*
- `market-landscape-mapping` — Build a defensible map of who serves a market, along axes that discriminate between players rather than flatter them. *(L2, beta)*
- `source-credibility-assessment` — Classify a source by class, independence, incentive and recency, and assign a defensible trust score before its content is used. *(L2, production)*
- `technical-due-diligence` — Assess whether a technology claim is real, durable and transferable, and quantify the risk of assuming it is. *(L2, beta)*

**Related categories** — Agent Security, Business Strategy, Coding & Engineering, Cybersecurity, Data & Analysis, Executive & Institutional Intelligence, Knowledge Management, Marketing & Content, Sales & GTM, Writing & Communication

### <a id="writing-communication"></a>2. Writing & Communication

**Purpose** — Turning intent and evidence into artifacts people act on. Briefs, specs, narratives, executive summaries, correspondence, editing against a standard.

**Architectural layers present** — L1 Cognitive · L3 Action

**Capabilities (5)**

- `audience-adaptive-rewrite` — Re-express existing content for a different audience while holding every factual claim invariant. *(L3, production)*
- `document-restructuring` — Rebuild a document's structure around its actual argument, so that reading order matches reasoning order. *(L3, beta)*
- `executive-brief` — Compress a body of analysis into a one-page brief that leads with the decision, not with the background. *(L3, production)*
- `structured-critique` — Evaluate an artifact against an explicit standard and return ranked, actionable findings rather than impressions. *(L1, production)*
- `technical-specification` — Turn an intent into a specification precise enough that two independent engineers would build the same thing. *(L3, production)*

**Related categories** — Coding & Engineering, Executive & Institutional Intelligence, Knowledge Management, Marketing & Content, Research & Intelligence, Workflow Automation

### <a id="data-analysis"></a>3. Data & Analysis

**Purpose** — Getting a defensible number and knowing what it means. Profiling, cleaning, querying, statistical testing, cohort work, anomaly explanation, visualisation.

**Architectural layers present** — L1 Cognitive · L3 Action

**Capabilities (7)**

- `cohort-analysis` — Compare groups defined by a shared starting condition over time, separating cohort effects from period effects. *(L3, production)*
- `dataset-profiling` — Establish what a dataset actually contains — shape, quality, coverage and traps — before any analysis is run against it. *(L3, production)*
- `metric-anomaly-diagnosis` — Explain why a metric moved, separating instrumentation artifacts, mix shifts and genuine behaviour change. *(L1, production)*
- `metric-definition` — Turn a vague business concept into a metric with an unambiguous computable definition, boundaries and known failure behaviour. *(L1, production)*
- `statistical-significance-test` — Choose, run and interpret the correct test for a comparison, and report effect size and uncertainty rather than a bare verdict. *(L3, production)*
- `validate-analysis-assumptions` — Surface the unstated assumptions an analysis rests on and test which of them would change the conclusion if false. *(L1, beta)*
- `visualization-design` — Choose an encoding that makes the intended comparison perceptually easy, and build the chart so it cannot be misread. *(L3, production)*

**Related categories** — Agent Deployment, Agent Evaluation, Business Strategy, Coding & Engineering, DevOps & Infrastructure, Executive & Institutional Intelligence, Finance & Operations, Knowledge Management, Marketing & Content, Sales & GTM, Writing & Communication

### <a id="coding-engineering"></a>4. Coding & Engineering

**Purpose** — Reading, changing and verifying software. Codebase orientation, feature implementation, refactoring, review, debugging, test authoring, migration.

**Architectural layers present** — L1 Cognitive · L2 Knowledge · L3 Action

**Capabilities (7)**

- `architecture-decision-record` — Capture a consequential technical decision with its context, options, trade-offs and reversal conditions, so it can be understood and revisited later. *(L1, production)*
- `code-review` — Evaluate a diff for defects that matter, ranked by consequence, with a concrete failure scenario behind every claim. *(L1, production)*
- `codebase-orientation` — Build an accurate working model of an unfamiliar codebase — its boundaries, conventions, invariants and hazards — before changing anything. *(L2, production)*
- `debug-root-cause-analysis` — Find why a defect occurs by narrowing the search space with evidence, rather than by pattern-matching to a familiar cause. *(L1, production)*
- `dependency-upgrade` — Move a dependency to a new version with the behavioural risk identified, staged and verified rather than discovered in production. *(L3, production)*
- `feature-implementation` — Implement a specified change so that it fits the codebase, is verified before submission, and is reviewable as a single coherent diff. *(L3, production)*
- `test-suite-authoring` — Write tests that fail for the right reasons — driven by behaviour and failure modes rather than by coverage targets. *(L3, production)*

**Related categories** — Agent Evaluation, Business Strategy, Cybersecurity, Data & Analysis, DevOps & Infrastructure, Executive & Institutional Intelligence, Knowledge Management, Research & Intelligence, Writing & Communication

### <a id="business-strategy"></a>5. Business Strategy

**Purpose** — Structuring consequential decisions. Market sizing, positioning, pricing, build-buy-partner, scenario planning, strategic option evaluation.

**Architectural layers present** — L1 Cognitive · L4 Domain

**Capabilities (5)**

- `build-buy-partner-decision` — Decide how to acquire a capability by comparing total cost, control, speed and reversibility across build, buy and partner paths. *(L1, beta)*
- `market-sizing` — Estimate the size of a market from named assumptions, with the estimate's sensitivity to each assumption made explicit. *(L1, beta)*
- `positioning-framework` — Determine what a product is for, who it is for, and what it is better than — as claims that competitors could not truthfully make. *(L1, beta)*
- `pricing-strategy` — Set price and packaging from buyer value and willingness to pay, and model the revenue consequences before committing. *(L4, beta)*
- `scenario-planning` — Build a small set of internally consistent futures and identify the decisions that hold up across all of them. *(L1, beta)*

**Related categories** — Coding & Engineering, Data & Analysis, DevOps & Infrastructure, Executive & Institutional Intelligence, Finance & Operations, Marketing & Content, Research & Intelligence, Writing & Communication

### <a id="workflow-automation"></a>6. Workflow Automation

**Purpose** — Removing recurring human steps safely. Process capture, automation design, integration wiring, idempotency, dry-run rehearsal, rollout and rollback.

**Architectural layers present** — L1 Cognitive · L2 Knowledge · L3 Action · L5 Agentic

**Capabilities (5)**

- `automation-opportunity-assessment` — Decide whether a process should be automated at all, and which part of it, by comparing benefit against the full cost of automation ownership. *(L1, beta)*
- `dry-run-rehearsal` — Execute a change or automation in a mode that produces the full plan and its predicted effects without committing any of them. *(L5, production)*
- `idempotent-integration-design` — Design an integration between systems that produces correct results under retries, duplicates, reordering and partial failure. *(L3, production)*
- `process-capture` — Document how a process actually runs, including the exceptions and workarounds that the official version omits. *(L2, production)*
- `runbook-authoring` — Write an operational procedure that a tired person or an agent can execute correctly at three in the morning without prior context. *(L3, production)*

**Related categories** — Agent Deployment, Coding & Engineering, DevOps & Infrastructure, Executive & Institutional Intelligence, Governance & Compliance, Knowledge Management, Writing & Communication

### <a id="knowledge-management"></a>7. Knowledge Management

**Purpose** — Making an organisation's knowledge retrievable and current. Taxonomy design, document structuring, knowledge graphs, memory hygiene, decay and contradiction handling.

**Architectural layers present** — L2 Knowledge

**Capabilities (4)**

- `knowledge-graph-construction` — Extract entities and typed relationships from a corpus into a graph that answers multi-hop questions with traceable provenance. *(L2, prototype)*
- `knowledge-synthesis-brief` — Answer an organisational question from internal knowledge, distinguishing what is documented, what is contradicted and what is only in people's heads. *(L2, beta)*
- `memory-hygiene` — Decide what an agent should durably remember, how it decays, and how contradictions between memories are resolved. *(L2, beta)*
- `taxonomy-design` — Design a classification scheme that people can apply consistently and that survives the arrival of things it did not anticipate. *(L2, beta)*

**Related categories** — Agent Deployment, Coding & Engineering, Data & Analysis, Executive & Institutional Intelligence, Research & Intelligence, Sales & GTM, Workflow Automation, Writing & Communication

### <a id="sales-gtm"></a>8. Sales & GTM

**Purpose** — Account intelligence and revenue motion. Prospect research, qualification, call preparation, objection handling, pipeline hygiene, deal risk.

**Architectural layers present** — L1 Cognitive · L2 Knowledge

**Capabilities (2)**

- `account-research` — Build an account picture that identifies the buying situation, not just the company profile. *(L2, production)*
- `deal-risk-assessment` — Assess whether an opportunity will close, based on evidence of the buyer's process rather than on seller optimism. *(L1, production)*

**Related categories** — Business Strategy, Data & Analysis, Executive & Institutional Intelligence, Finance & Operations, Knowledge Management, Research & Intelligence, Writing & Communication

### <a id="marketing-content"></a>9. Marketing & Content

**Purpose** — Positioning and distribution. Messaging frameworks, campaign structure, content production against a brand standard, SEO, performance readouts.

**Architectural layers present** — L1 Cognitive · L3 Action

**Capabilities (3)**

- `campaign-performance-readout` — Report what a campaign actually caused, separating incremental effect from activity that would have happened anyway. *(L3, beta)*
- `content-brief-production` — Specify a piece of content precisely enough that a writer produces the intended thing on the first attempt. *(L3, production)*
- `messaging-framework` — Convert a position into a message hierarchy that survives being repeated by people who did not write it. *(L1, beta)*

**Related categories** — Business Strategy, Data & Analysis, Finance & Operations, Sales & GTM, Writing & Communication

### <a id="finance-operations"></a>10. Finance & Operations

**Purpose** — The numbers a business is accountable for. Reconciliation, variance analysis, forecasting, close support, vendor and capacity decisions.

**Architectural layers present** — L4 Domain

**Capabilities (3)**

- `account-reconciliation` — Reconcile two records of the same activity, explain every difference, and produce audit-ready evidence of the resolution. *(L4, production)*
- `variance-analysis` — Explain the gap between plan and actual by decomposing it into drivers a manager can act on. *(L4, production)*
- `vendor-evaluation` — Compare vendors against weighted requirements derived from actual use, including exit cost and dependency risk. *(L4, beta)*

**Related categories** — Business Strategy, Coding & Engineering, Cybersecurity, Data & Analysis, DevOps & Infrastructure, Executive & Institutional Intelligence, Governance & Compliance, Marketing & Content, Research & Intelligence, Workflow Automation, Writing & Communication

### <a id="governance-compliance"></a>11. Governance & Compliance

**Purpose** — Operating inside rules that carry consequence. Policy mapping, control testing, evidence collection, regulatory change tracking, audit trails, agent governance.

**Architectural layers present** — L4 Domain

**Capabilities (2)**

- `control-evidence-collection` — Collect evidence that a control operated as designed throughout a period, in a form an auditor will accept without rework. *(L4, production)*
- `regulatory-change-impact` — Translate a regulatory change into the specific obligations, systems and controls it affects, with owners and deadlines. *(L4, beta)*

**Related categories** — Agent Deployment, Cybersecurity, Executive & Institutional Intelligence, Finance & Operations, Research & Intelligence, Workflow Automation, Writing & Communication

### <a id="cybersecurity"></a>12. Cybersecurity

**Purpose** — Defensive security work. Threat modelling, vulnerability triage, log and alert investigation, incident response, secure code review, exposure assessment.

**Architectural layers present** — L4 Domain

**Capabilities (4)**

- `secure-code-review` — Review code for security defects by tracing untrusted input to dangerous sinks and checking authorisation at every new path. *(L4, production)*
- `security-alert-investigation` — Investigate a security alert to a defensible verdict, preserving evidence and establishing scope before any remediation. *(L4, production)*
- `threat-model-construction` — Identify how a system could be attacked by reasoning from its trust boundaries, assets and adversaries rather than from a checklist. *(L4, production)*
- `vulnerability-triage` — Decide which reported vulnerabilities actually matter here, using exploitability in this environment rather than the published severity score. *(L4, production)*

**Related categories** — Agent Security, Coding & Engineering, DevOps & Infrastructure, Executive & Institutional Intelligence, Research & Intelligence

### <a id="devops-infrastructure"></a>13. DevOps & Infrastructure

**Purpose** — Running systems in production. Pipelines, infrastructure as code, release and rollback, observability, capacity, cost, production incident handling.

**Architectural layers present** — L4 Domain · L5 Agentic

**Capabilities (4)**

- `capacity-forecasting` — Project when a system will run out of headroom, based on the resource that actually binds rather than on average utilisation. *(L4, beta)*
- `infrastructure-change-review` — Review an infrastructure change by reading its actual plan output, focusing on replacements, deletions and blast radius. *(L4, production)*
- `production-incident-diagnosis` — Find what is breaking a live system fast enough to restore service, without destroying the evidence needed afterwards. *(L4, production)*
- `release-readiness-check` — Determine whether a change is safe to release by verifying reversibility, observability and exposure control rather than by ticking a checklist. *(L5, production)*

**Related categories** — Agent Deployment, Business Strategy, Coding & Engineering, Cybersecurity, Data & Analysis, Executive & Institutional Intelligence, Finance & Operations, Workflow Automation

### <a id="physical-ai-robotics"></a>14. Physical AI & Robotics

**Purpose** — Capabilities that move mass in the real world. Perception grounding, motion planning, manipulation, teleoperation handoff, safety envelopes, sim-to-real transfer.

**Architectural layers present** — L4 Domain

**Capabilities (3)**

- `manipulation-task-planning` — Plan a physical manipulation sequence that respects safety envelopes, remains recoverable at each step, and fails safe. *(L4, prototype)*
- `perception-grounding` — Convert raw sensor data into a spatial world model with explicit uncertainty, so that downstream planning knows what it does not know. *(L4, prototype)*
- `sim-to-real-validation` — Establish how far a policy validated in simulation can be trusted on hardware, and stage its deployment accordingly. *(L4, prototype)*

**Related categories** — Agent Deployment, Agent Evaluation, Data & Analysis, DevOps & Infrastructure, Workflow Automation

### <a id="multi-agent-systems"></a>15. Multi-Agent Systems

**Purpose** — Many agents, one outcome. Task decomposition, delegation, role design, shared state, conflict resolution, consensus, cost and loop control.

**Architectural layers present** — L5 Agentic

**Capabilities (3)**

- `agent-role-design` — Define what each agent in a system is responsible for, what it may use, and where its authority ends. *(L5, beta)*
- `multi-agent-conflict-resolution` — Resolve contradictory outputs or competing actions between agents by rule rather than by whichever finished last. *(L5, prototype)*
- `task-decomposition-delegation` — Split work across sub-agents only where parallelism pays, with interfaces precise enough that results compose. *(L5, beta)*

**Related categories** — Agent Deployment, Agent Evaluation, Agent Security, Cybersecurity, Knowledge Management, Research & Intelligence, Workflow Automation

### <a id="executive-intelligence"></a>16. Executive & Institutional Intelligence

**Purpose** — Decision support at the top of an organisation. Board material, situation assessment, stakeholder mapping, option framing, institutional memory, briefings under uncertainty.

**Architectural layers present** — L1 Cognitive

**Capabilities (3)**

- `risk-weighted-recommendation` — Produce a recommendation that accounts for the asymmetry between upside and downside, not just for the expected value. *(L1, beta)*
- `situation-assessment` — Establish what is actually happening in a complex, fast-moving situation, separating fact from report from inference. *(L1, beta)*
- `stakeholder-mapping` — Identify who can advance or block a decision, what each of them actually optimises for, and where the real influence sits. *(L1, beta)*

**Related categories** — Business Strategy, Coding & Engineering, Cybersecurity, Data & Analysis, DevOps & Infrastructure, Research & Intelligence, Sales & GTM, Writing & Communication

### <a id="personal-productivity"></a>17. Personal Productivity

**Purpose** — Individual throughput. Inbox and commitment triage, planning, meeting capture, context restoration, personal knowledge routing.

**Architectural layers present** — L1 Cognitive · L3 Action

**Capabilities (2)**

- `commitment-triage` — Turn an undifferentiated stream of requests into a small set of commitments with owners, dates and explicit declines. *(L1, production)*
- `meeting-capture` — Turn a discussion into decisions, owned actions and open questions, discarding the rest. *(L3, production)*

**Related categories** — Coding & Engineering, Executive & Institutional Intelligence, Knowledge Management, Writing & Communication

### <a id="agent-evaluation"></a>18. Agent Evaluation

**Purpose** — Knowing whether an agent is actually good. Eval set design, rubric authoring, LLM-as-judge calibration, regression suites, failure taxonomy, benchmark honesty.

**Architectural layers present** — L5 Agentic

**Capabilities (3)**

- `eval-set-design` — Build an evaluation set that discriminates between systems on the dimensions that matter, and that cannot be passed by memorisation. *(L5, beta)*
- `failure-taxonomy` — Classify an agent's failures by mechanism so that remediation targets causes rather than symptoms. *(L5, beta)*
- `llm-judge-calibration` — Establish whether a model-based grader agrees with human judgement before its scores are used to make decisions. *(L5, beta)*

**Related categories** — Agent Deployment, Agent Security, Coding & Engineering, Data & Analysis, Multi-Agent Systems, Physical AI & Robotics, Research & Intelligence

### <a id="agent-security"></a>19. Agent Security

**Purpose** — Securing the agent itself. Prompt-injection defence, tool permission scoping, output sanitisation, secret handling, untrusted-content boundaries, red-teaming.

**Architectural layers present** — L5 Agentic

**Capabilities (3)**

- `agent-red-teaming` — Attack an agent system deliberately to find the inputs and situations that make it act against its operator's interest. *(L5, beta)*
- `prompt-injection-defense` — Keep instructions found in retrieved content from becoming actions, by enforcing a boundary between what the agent reads and what it obeys. *(L5, production)*
- `tool-permission-scoping` — Grant an agent the narrowest tool and permission set that lets it complete its task, and bound the damage of any single call. *(L5, production)*

**Related categories** — Agent Deployment, Agent Evaluation, Cybersecurity, Knowledge Management, Multi-Agent Systems, Research & Intelligence, Workflow Automation

### <a id="agent-deployment"></a>20. Agent Deployment

**Purpose** — Getting agents into production and keeping them there. Environment promotion, autonomy staging, human-in-the-loop wiring, telemetry, cost ceilings, kill switches, versioned rollout.

**Architectural layers present** — L5 Agentic

**Capabilities (3)**

- `agent-rollback` — Stop a misbehaving agent and reverse what it did, across every system it touched, without making the situation worse. *(L5, beta)*
- `agent-telemetry-instrumentation` — Instrument an agent so that its decisions, not just its outcomes, are observable enough to diagnose and to govern. *(L5, beta)*
- `autonomy-staging` — Increase an agent's autonomy in stages, each gated on measured evidence rather than on elapsed time or confidence. *(L5, beta)*

**Related categories** — Agent Evaluation, Agent Security, Data & Analysis, DevOps & Infrastructure, Governance & Compliance, Physical AI & Robotics, Workflow Automation

---

**Agent Skills Compendium**  
Created and originally architected by **Jerson Boyd Milan**  
https://jersonboydmilan.com/

© 2026 Jerson Boyd Milan
