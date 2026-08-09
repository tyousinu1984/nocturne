# Attendance Alpha Responsibility Ledger

Date: 2026-08-10

| Responsibility | Owner | Approver | Completion definition | Evidence | Current state |
|---|---|---|---|---|---|
| Alpha scope and production boundary | Human Owner | Human Owner | Durable attendance is developed without changing the current production site | User continuation plus production isolation record | Human confirmed |
| Domain and transition contract | Lead Agent | Human Owner | Normal path, illegal transitions, concurrency and cancellation are explicit | Domain model, exact event snapshots and 36 automated tests | Technical verification passed; waiting Human Owner |
| SIWC and owner allowlist | Lead Agent | Human Owner | Anonymous users redirect, unlisted users are denied, APIs recheck identity | Auth tests, Worker spoof test and production-build mock isolation | Technical verification passed; real site-scoped ID pending |
| D1 schema and migration | Lead Agent | Human Owner | Development database is isolated and migration is generated and inspected | Two Drizzle migrations, schema-equivalence test and local D1 runtime | Technical verification passed; hosted migration pending |
| Attendance API and audit | Lead Agent | Human Owner | Commands enforce validation, versions, idempotency and append-only events | API error-code tests, atomicity tests and six-event runtime ledger | Technical verification passed; waiting Human Owner |
| Admin attendance UI | Lead Agent | Human Owner | Owner can complete create through publish and cancel without database access | Desktop and 390px browser run, recovery-state review and contrast evidence | Technical verification passed; waiting Human Owner |
| Public projection | Lead Agent | Human Owner | Only published entries appear and cancellation removes them | Public API failure-closure test and profile browser run | Technical verification passed; waiting Human Owner |
| Independent technical review | Review Agent | Lead Agent | No unresolved P1 or P2 defects in auth, state, persistence or public leakage | Independent backend and UI review plus two repair-and-recheck cycles | Technical verification passed; no open P1/P2 |
| Production promotion | Human Owner | Human Owner | Current development commit is explicitly accepted | Human validation of the development version | Waiting for Human Owner |

## Ability and evidence boundary

- The AI can implement and technically verify the isolated slice.
- The Human Owner must confirm the real staffing workflow and accept the
  development experience.
- Real production allowlist IDs and hosted D1 promotion remain blocked until
  Human Owner validation.
- Payment, booking, customer identity and sensitive documents remain outside
  this slice.
