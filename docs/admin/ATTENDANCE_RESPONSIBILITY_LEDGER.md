# Attendance Alpha Responsibility Ledger

Date: 2026-08-09

| Responsibility | Owner | Approver | Completion definition | Evidence | Current state |
|---|---|---|---|---|---|
| Alpha scope and production boundary | Human Owner | Human Owner | Durable attendance is released without changing anonymous catalogue access | Explicit production approval and Sites version 10 receipt | Production Alpha approved |
| Domain and transition contract | Lead Agent | Human Owner | Normal path, illegal transitions, concurrency and cancellation are explicit | Domain model, exact event snapshots and 36 automated tests | Approved for the single-Owner Alpha |
| SIWC and owner allowlist | Lead Agent | Human Owner | Anonymous users redirect, unlisted users are denied, APIs recheck identity | Auth tests, spoof resistance and controlled production SIWC verification | Production Owner verified |
| D1 schema and migration | Lead Agent | Human Owner | Database is isolated and migration is generated, inspected and hosted | Two Drizzle migrations, schema equivalence and production `D1 READY` | Production migration passed |
| Attendance API and audit | Lead Agent | Human Owner | Commands enforce validation, versions, idempotency and append-only events | API tests, atomicity tests and local six-event runtime ledger | Production endpoint ready |
| Admin attendance UI | Lead Agent | Human Owner | Owner can complete create through publish and cancel without database access | Desktop, 390px and authenticated production browser evidence | Production Owner access passed |
| Public projection | Lead Agent | Human Owner | Only published entries appear and cancellation removes them | Failure-closure tests and production anonymous API smoke | Production projection ready |
| Independent technical review | Review Agent | Lead Agent | No unresolved P1 or P2 defects in auth, state, persistence or public leakage | Independent backend and UI review plus two repair-and-recheck cycles | Technical verification passed; no open P1/P2 |
| Production promotion | Human Owner | Human Owner | Accepted source is deployed with rollback and smoke evidence | Explicit approval, Sites version 10 and release receipt | Completed |

## Ability and evidence boundary

- The AI implemented and technically verified the slice and recorded the hosted
  production evidence.
- The Human Owner approved the single-Owner Alpha and remains responsible for
  real staffing policy and future access expansion.
- The production allowlist is limited to one verified site-scoped Owner ID.
- Payment, booking, customer identity and sensitive documents remain outside
  this slice.
