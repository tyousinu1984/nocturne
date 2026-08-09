---
assessment_id: MA-20260809-NOCTURNE-ATTENDANCE-001
assessment_date: 2026-08-09
subject: "Nocturne attendance operations alpha"
trigger: important_feature
depth: standard
version: "263a6d3b48cc1a3fd299a7cd3ddae594a6844566 / Sites version 10"
scope: "Single-Owner production Attendance Alpha from authenticated command through anonymous public projection"
baseline_ref: MA-20260809-NOCTURNE-005
supersedes: MA-20260809-NOCTURNE-005
stage_readiness: 3
overall_maturity: L3
evolution_capability: E4
confidence: medium_high
decision_impact: release
evidence_refs:
  - "docs/admin/ATTENDANCE_DOMAIN_MODEL.md"
  - "docs/admin/ATTENDANCE_ALPHA_VERIFICATION.md"
  - "tests/attendance-store.test.mjs"
  - "tests/rendered-html.test.mjs"
  - "drizzle/0000_minor_black_knight.sql"
  - "drizzle/0001_chilly_night_thrasher.sql"
  - "docs/releases/NOCTURNE-010-RELEASE-RECEIPT.md"
next_gate: "Observe the first real attendance publication and define staff roles before expanding access beyond the Human Owner"
---

# Attendance Alpha Maturity Assessment

Version `263a6d3` / Sites version 10 / Overall Maturity L3 within the
single-Owner production Attendance Alpha / Evolution Capability E4 / Confidence
medium-high.

## Evaluation context

The evaluated purpose is a narrow, durable attendance workflow for one owner and
one cast profile. It covers authenticated commands, D1 persistence, review and
publication states, anonymous projection, cancellation and audit events.
Real staff separation of duties, booking, payment, payroll, overnight shifts
and business-value validation are outside this assessment.

The production target is a deliberately narrow single-Owner Alpha. Stage
readiness is 3 of 3 because technical verification, Human Owner approval,
site-scoped identity configuration, hosted D1 migration and production smoke
evidence are complete.

Target stage: controlled single-Owner production Alpha with anonymous public
attendance projection and no staff access expansion.

## Overall conclusion and decision impact

The slice is integrated across domain rules, persistence, API, authorization,
admin UI and public projection. The hosted identity and D1 boundary now has
production evidence. The weakest critical interface is the future transition
from one Owner to multiple operational staff roles.

The decision is `release`: keep Sites version 10 live for the single-Owner
Attendance Alpha, retain version 5 as the pre-attendance rollback boundary and
block access expansion until staffing policy and offboarding are defined.

## 相关维度与证据

| Dimension | Level | Evidence status | Evidence | Main gap | Confidence | Uncertainty source | Upgrade condition |
|---|---:|---|---|---|---|---|---|
| Purpose and boundary | L3 | [REVIEWED] | Domain model and responsibility ledger | Real staff roles and same-day rules remain undefined | High | Human Owner has not supplied the operating policy | Confirm roles, cut-off rules and overnight-shift semantics |
| Concept and architecture | L3 | [REVIEWED] [OBSERVED] | State contract, API, hosted D1 and anonymous projection | Multiple staff roles remain undefined | High | Future operating policy is a Human Owner decision | Define role and offboarding rules before access expansion |
| Implementation quality | L3 | [TESTED] | Lint, production build and 36 tests | No real attendance record has been entered yet | Medium-high | Production smoke intentionally avoided business writes | Observe the first Owner-created record |
| Verification and evidence | L3 | [TESTED] [OBSERVED] [HUMAN-CONFIRMED] | Local closed loop plus authenticated and anonymous production smoke | Business-value evidence remains early | Medium-high | Alpha has no operational history | Record first real publication and cancellation evidence |
| Deployment reliability | L3 | [OBSERVED] | Sites version 10, environment revision 2, migrations and version 5 rollback | Automated recurring health checks are absent | Medium-high | Current evidence is release-time smoke | Add monitoring when usage frequency justifies it |
| Security and permissions | L3 | [TESTED] [OBSERVED] | SIWC, secret site-scoped allowlist, spoof resistance and production Owner login | Single Owner has all workflow powers | Medium-high | Separation of duties is outside Alpha scope | Define staff roles before adding identities |
| Documentation transfer | L3 | [REVIEWED] | Domain, runtime, verification, maturity, responsibility and release receipt | Future staff playbook is absent | High | Only one Owner currently operates the system | Add an operating playbook with the next staff role |

## Topology and critical path

Human Owner goal → domain and transition contract → D1 aggregate and event
ledger → authenticated command API → Attendance editor → published-only public
projection → local runtime evidence → Human Owner acceptance → production
configuration → hosted D1 migration → authenticated and anonymous smoke.

The production Alpha chain is closed. Future role expansion begins a new chain
with its own authorization and operating-policy gates.

## Change quality, risks and debt

变更类型：系统能力提升、闭环补全、缺陷修复；依据：出勤从静态展示扩展为受鉴权、可持久化、可审计且可失败关闭的端到端切片，并通过独立审查反馈完成回归修正。

- Sites version 10 and environment revision 2 are live; version 5 is the
  pre-attendance rollback boundary.
- The site-scoped Owner ID was captured through controlled SIWC, stored as a
  secret environment value and verified against the server allowlist.
- The alpha uses one owner for all state transitions. Separation of duties is a
  known business-policy debt, not an implied production guarantee.
- Local development schema initialization duplicates generated migration DDL;
  a canonical schema-equivalence test limits drift.
- Dependency audit findings belong to the inherited application baseline and
  were not changed by this slice. They require a separate scoped dependency
  review before a broader production-security claim.

## Evolution capability

E4 is supported within this slice by a recorded loop: independent review found
production mock-auth and stale-schedule risks; diagnosis separated build-time
identity, runtime allowlist, storage availability and UI state; the implementation
was changed; automated and browser regressions then revalidated the chain. The
previous Sites version remains the rollback boundary.

## Next gate

1. Record the first real attendance entry and confirm the public projection
   appears only after publication.
2. Define staff roles, approval separation and offboarding before adding another
   allowlisted identity.
3. Keep booking, customer identity, payment and sensitive-document workflows
   outside this Alpha until separately modeled and approved.
