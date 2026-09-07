<!--
Agent Skills Compendium
Copyright © 2026 Jerson Boyd Milan
-->

# 🔐 Security Policy

## Supported versions

The Compendium is an open reference framework at `v0.1`. Security fixes land on
`main` and ship in the next release. Older tags are not patched.

| Version | Supported |
|---|---|
| `main` / latest release | ✅ |
| Earlier tags | ❌ |

## Reporting a vulnerability

**Do not open a public issue.**

Report privately through GitHub's
[private vulnerability reporting](https://github.com/linuxdel/Agent-Skills-Compendium/security/advisories/new)
on this repository. If that is unavailable to you, contact the maintainer through
https://jersonboydmilan.com/.

Please include:

- what the issue is, and the impact you believe it has
- a reproduction — a URL, a request, or a definition that triggers it
- the version or commit you tested
- any mitigation you have already identified

**Expectations.** Acknowledgement within 7 days, an assessment within 14, and a
fix or a stated decision not to fix before disclosure. Reporters are credited in
the advisory unless they ask not to be.

## Scope

In scope:

- the web interface and the public API under `/api/*`
- the content validator, the schema generator and the export pipeline
- registry definitions that would cause an agent to take an unsafe action if
  followed as written — a missing restricted action on a high-risk skill, an
  escalation path that cannot be enforced, a permission scope wider than the
  procedure needs

Out of scope:

- vulnerabilities in a runtime that *executes* these definitions. The Compendium
  is data; enforcement of the governance model belongs to the executor. See
  [docs/INTEROPERABILITY.md](docs/INTEROPERABILITY.md).
- findings from automated scanners with no demonstrated impact
- denial of service through volume alone against a deployment you do not own

## A note on the threat model

Skill definitions are **untrusted input to an agent**. A definition fetched from
any registry, this one included, should be validated against
[`/api/schema`](schema/) and its permission and risk fields honoured before it is
executed. The registry states what a skill may not do; it cannot stop it.
