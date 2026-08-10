# Attendance Alpha Responsibility Ledger

Date: 2026-08-10

| Responsibility | Owner | Approver | Completion definition | Evidence | Current state |
|---|---|---|---|---|---|
| Alpha scope and production boundary | Human Owner | Human Owner | Public catalogue stays anonymous while administrator and cast permissions remain separate | Explicit production request, self-hosted receipt and cast-access receipt | Production Alpha approved |
| Domain and transition contract | Lead Agent | Human Owner | Normal path, administrator corrections, illegal transitions, concurrency and terminal history are explicit | Cast access domain model, exact event snapshots and 37 automated tests | Production contract verified |
| Store administrator authentication | Lead Agent | Human Owner | Anonymous and spoofed requests are denied while the independent shop credential authorizes protected routes | Caddy Basic Auth, trusted marker tests and public HTTPS smoke | Production administrator verified |
| Cast account and session lifecycle | Lead Agent | Human Owner | Accounts can be created, rotated, disabled and enabled; prior sessions expire immediately after protected changes | Scrypt credential tests, session-version tests, Keychain-backed startup and production account API smoke | Production capability ready; no real account created yet |
| SQLite schema and migration | Lead Agent | Human Owner | Production migration is additive, backed up and preserves existing attendance history | Verified online backup, three Drizzle migrations, integrity `ok`, 1 attendance entry and 4 events retained | Production migration passed |
| Attendance API and audit | Lead Agent | Human Owner | Cast remains profile-bound and draft-limited; administrator can manage every profile and active lifecycle state | Permission tests, atomicity tests, administrator correction tests and production read smoke | Production endpoint ready |
| Staff attendance UI | Lead Agent | Human Owner | A cast member can sign in, manage her own draft and submit without an OpenAI or ChatGPT account | Rendered-route test, isolated release probe and public `/staff` HTTP 200 | Production portal ready; real onboarding pending |
| Admin attendance UI | Lead Agent | Human Owner | Administrator can create and edit every profile, then review, publish and cancel | Browser validation, administrator-wide tests and protected production HTTP 200 | Production administrator access passed |
| Public projection | Lead Agent | Human Owner | Only published entries appear and administrator correction updates the active public time | Production anonymous API preserved Yuna `2026-08-31 01:00-12:23` | Production projection ready |
| Independent technical review | Review Agent | Lead Agent | No unresolved P0, P1 or P2 defect in permission, session, migration, startup or identity boundaries | Worker job `20260810T064410Z-nocturne-release-gate-core-pvidL4` | Technical verification passed |
| Production promotion | Human Owner | Human Owner | Accepted source is deployed with backup, binary rollback, public smoke and release record | Explicit approval, commit `2b3a737`, migration 3, release receipt and production tag | Completed |

## Ability and evidence boundary

- The AI implemented and technically verified the slice and recorded the
  self-hosted production evidence.
- The Human Owner approved the shop Alpha and remains responsible for real
  staffing policy, access-code delivery and future access expansion.
- The production administrator remains one store-level Basic Auth identity.
- Cast accounts are independently profile-bound and currently contain no real
  account until the administrator creates one intentionally.
- Payment, booking, customer identity and sensitive documents remain outside
  this slice.
