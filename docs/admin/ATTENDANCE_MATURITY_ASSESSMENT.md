---
assessment_id: MA-20260810-NOCTURNE-ATTENDANCE-001
assessment_date: 2026-08-10
subject: "Nocturne attendance operations alpha"
trigger: important_feature
depth: standard
version: "codex/feature/attendance-admin-alpha"
scope: "Isolated development attendance slice from authenticated command through anonymous public projection"
baseline_ref: null
supersedes: null
stage_readiness: 2
overall_maturity: L3
evolution_capability: E4
confidence: medium_high
decision_impact: controlled_validation
evidence_refs:
  - "docs/admin/ATTENDANCE_DOMAIN_MODEL.md"
  - "docs/admin/ATTENDANCE_ALPHA_VERIFICATION.md"
  - "tests/attendance-store.test.mjs"
  - "tests/rendered-html.test.mjs"
  - "drizzle/0000_minor_black_knight.sql"
  - "drizzle/0001_chilly_night_thrasher.sql"
next_gate: "Human Owner accepts the development experience and supplies or approves the site-scoped production allowlist identity"
---

# Attendance Alpha Maturity Assessment

Version `codex/feature/attendance-admin-alpha` / Overall Maturity L3 within the
isolated development attendance slice / Evolution Capability E4 / Confidence
medium-high.

## Evaluation context

The evaluated purpose is a narrow, durable attendance workflow for one owner and
one cast profile. It covers authenticated commands, D1 persistence, review and
publication states, anonymous projection, cancellation and audit events.
Production configuration, real staff separation of duties, booking, payment,
payroll, overnight shifts and business-value validation are outside this
assessment.

The target next stage is controlled Human Owner validation before any production
promotion. Stage readiness is 2 of 3 because technical evidence is complete,
while owner experience acceptance and the real site-scoped allowlist identity
remain open.

## Overall conclusion and decision impact

The slice is integrated across domain rules, persistence, API, authorization,
admin UI and public projection. Its weakest critical interface is the transition
from isolated development identity and D1 to the hosted production identity and
database. That interface has documented gates but no production run evidence.

The decision is `controlled_validation`: keep production on its current version,
retain the local development instance for owner review, and block deployment
until the remaining Human Owner gate is satisfied.

## 相关维度与证据

| Dimension | Level | Evidence status | Evidence | Main gap | Confidence | Uncertainty source | Upgrade condition |
|---|---:|---|---|---|---|---|---|
| Purpose and boundary | L3 | [REVIEWED] | Domain model and responsibility ledger | Real staff roles and same-day rules remain undefined | High | Human Owner has not supplied the operating policy | Confirm roles, cut-off rules and overnight-shift semantics |
| Concept and architecture | L3 | [REVIEWED] | State contract, invariants, API and public projection | Hosted identity-to-D1 interface remains unrun | High | Production is intentionally unchanged | Validate production identity and D1 wiring after authorization |
| Implementation quality | L3 | [TESTED] | Lint, production build and 36 tests | No hosted runtime evidence | Medium-high | Local D1 compatibility may not expose every hosted behavior | Add hosted smoke evidence before production claims |
| Verification and evidence | L3 | [TESTED] [OBSERVED] | SQLite-compatible D1 tests plus local browser and HTTP runs | Human Owner experience evidence remains absent | Medium-high | Browser run used isolated development data | Record Human Owner acceptance or revision request |
| Deployment reliability | L2 | [REVIEWED] | Explicit isolation, prior Sites version and rollback boundary | Migration and deployment have not run in production | Medium | Real hosted configuration is deliberately missing | Perform an authorized migration, deploy and smoke test |
| Security and permissions | L3 | [TESTED] | SIWC redirects, server allowlist, spoof resistance and production mock-auth isolation | Real site-scoped owner ID remains unknown | Medium-high | Local mock cannot establish hosted identity value | Obtain and test the real site-scoped owner ID |
| Documentation transfer | L3 | [REVIEWED] | Domain, runtime, verification, maturity and responsibility documents | Evidence will change after owner acceptance | High | Future production evidence does not exist yet | Synchronize documents with the accepted commit and deployment receipt |

## Topology and critical path

Human Owner goal → domain and transition contract → D1 aggregate and event
ledger → authenticated command API → Attendance editor → published-only public
projection → local runtime evidence → Human Owner acceptance → production
configuration and deployment.

The chain is closed through local runtime evidence. The final two interfaces are
intentionally gated and remain outside the current completion claim.

## Change quality, risks and debt

变更类型：系统能力提升、闭环补全、缺陷修复；依据：出勤从静态展示扩展为受鉴权、可持久化、可审计且可失败关闭的端到端切片，并通过独立审查反馈完成回归修正。

- No unresolved production side effects are introduced because no hosted
  environment, DNS or production D1 was changed.
- Production deployment remains blocked by the missing real allowlist identity
  and Human Owner acceptance.
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

1. Human Owner reviews the isolated Attendance experience and accepts, requests
   revision, narrows scope or stops.
2. After acceptance, capture the real site-scoped owner ID through controlled
   SIWC and configure only `ADMIN_ALLOWED_USER_IDS`.
3. Run the reviewed migration, save an exact version, deploy with the previous
   Sites version retained, and execute authenticated and anonymous smoke tests.
