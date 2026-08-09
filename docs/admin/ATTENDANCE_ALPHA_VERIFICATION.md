# Attendance Alpha Verification

Date: 2026-08-09
Environment: isolated local development and Sites production
Production impact: Nocturne Sites version 10 is live

## Automated evidence

- ESLint passes.
- Vinext production build passes.
- Thirty-six automated tests pass.
- Tests cover SIWC redirect behavior, owner allowlist denial and approval,
  attendance state transitions, invalid dates and times, required reasons,
  profile probe regressions, public page rendering, production development-auth
  isolation, public D1 failure closure, HTTP conflict semantics, idempotency
  fingerprints, version races, same-date uniqueness, batch atomicity,
  cancellation visibility, editor resynchronization and migration equivalence.
  Additional request regressions cover missing D1 on writes and valid JSON values
  that are not command objects. API identity, allowlist and cross-origin failures
  also carry distinct codes for deterministic client recovery.

## D1 integration evidence

The following command path completed against disposable local D1:

1. Create `draft`.
2. Submit to `pending`.
3. Approve to `approved`.
4. Publish to `published`.
5. Confirm one anonymous public record.
6. Cancel to `cancelled`.
7. Confirm the anonymous public record count returns to zero while `managed`
   remains true.
8. Create a replacement draft for the same date after cancellation.
9. Confirm the append-only event ledger contains the six completed commands.

Additional observed controls:

- A stale version returns `concurrency_conflict`.
- A second active entry for the same cast member and date returns
  `schedule_conflict`.
- A draft leaves `managed` false. A legacy static schedule is eligible only
  after a successful D1 response explicitly reports no managed history.
- After cancellation, `managed` remains true with zero public entries, so the
  cancelled shift cannot reappear through the static fallback.
- A missing or failing D1 response returns HTTP 503 with
  `availability: unavailable`; the profile renders a neutral unavailable state
  with no static schedule.
- An injected failure in the second statement of a create batch leaves both
  entry and event counts at zero.
- Two commands using the same expected version produce exactly one winner and
  one `concurrency_conflict` carrying the latest readable entry.
- Replaying the original create key after the aggregate reaches `pending`
  returns the original `draft` version 1 snapshot with the version 1 create
  event.
- Runtime development DDL and the generated Drizzle migration produce the same
  canonical SQLite schema.
- Event timestamps are stored as ISO UTC values.

## SQLite evidence

`EXPLAIN QUERY PLAN` confirms:

- Public attendance uses `idx_attendance_entries_public`.
- Status and service-date operations use
  `idx_attendance_entries_status_date`.

## Production promotion evidence

- The Human Owner explicitly approved the Attendance Alpha for production on
  2026-08-09.
- Sites version 10 deploys commit
  `263a6d3b48cc1a3fd299a7cd3ddae594a6844566` with environment revision 2.
- `ADMIN_ALLOWED_USER_IDS` contains the controlled SIWC-derived site-scoped
  Owner ID as a secret value; `NOCTURNE_DEV_AUTH` is absent.
- The production D1 migrations completed and the anonymous attendance API
  returns `availability: ready`, `managed: false` and zero initial entries.
- Anonymous `/admin` requests redirect to Sign in with ChatGPT and anonymous
  admin API requests return `authentication_required` with HTTP 401.
- The authenticated Owner opens `/admin`, passes the server allowlist and sees
  Attendance report `D1 READY`.
- The temporary identity bootstrap routes were removed before the final version
  was saved and both now return HTTP 404.
- A clean final browser session recorded no console warning or error on the
  authenticated Attendance view.

## Browser evidence

- Authenticated development `/admin` exposes Attendance as a dedicated sidebar
  destination and renders durable records from local D1.
- The browser verified the editor, public projection, records and append-only
  timeline after the full command path.
- Selecting a cancelled record shows `NO PUBLISHED SHIFTS` and
  `REMOVED FROM PUBLIC PROFILE`, with no stale hours in the preview.
- Desktop document width matched its viewport with no horizontal overflow.
- At the mobile override, the effective viewport and scroll width both measured
  375px, the Attendance editor preceded summary cards, and primary actions had
  a 46px minimum height.
- Mobile navigation labels fit within their buttons without clipping.
- Browser console error and warning logs were empty during the completed path.
- Authentication, authorization, storage availability, general service errors
  and command validation use separate UI states. Identity or storage failures
  lock writes and mark records, audit and summaries unknown; 401 offers a sign-in
  path, 403 shows the allowlist denial, and a 400 or normal 409 leaves the
  editable form available.
- Brand-color contrast for the reviewed operations controls measures 6.07:1 on
  bright pink, 8.61:1 on orange, 4.94:1 on deep-pink hover and 7.87:1 on the
  danger action.

## Next operating gate

The production Alpha is ready for the Owner's first real attendance record. A
future slice must define additional staff roles, offboarding and separation of
duties before expanding access beyond the single Owner allowlist.
