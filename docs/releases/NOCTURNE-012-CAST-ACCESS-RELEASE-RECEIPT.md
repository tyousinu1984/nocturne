# Nocturne Tokyo Cast Access Production Release Receipt

- Release date: 2026-08-10
- Production site: `https://nocturne.shinpei.cc.cd`
- Deployment source commit:
  `2b3a737257492abc21348d4f3e080b2e0cb8de1f`
- Release tag: `production-nocturne-2026-08-10-cast-access`
- Runtime release:
  `/Users/shinpei/Library/Application Support/NocturneTokyo/releases/20260810T153247+0900-2b3a73725749`
- LaunchAgent: `cc.shinpei.nocturne-tokyo`
- Loopback listener: `127.0.0.1:4189`
- Persistent SQLite:
  `/Users/shinpei/Library/Application Support/NocturneTokyo/data/nocturne.sqlite`
- Runtime receipt:
  `/Users/shinpei/Library/Application Support/NocturneTokyo/receipts/20260810T155100+0900-cast-access.json`

## Authorization and released scope

The Human Owner explicitly requested production promotion after accepting the
administrator-wide attendance behavior. This release adds a normal-browser
staff portal while preserving the anonymous public catalogue and the existing
independent shop administrator credential.

Released behavior:

1. A cast member can sign in through `/staff`, manage only the profile bound to
   her account, save drafts and submit them for review.
2. The store administrator can create or edit attendance for every profile,
   then submit, approve, reject, publish or cancel records as allowed by the
   lifecycle.
3. An administrator edit to an active published record preserves `published`
   status, updates the anonymous projection immediately and appends an
   `ADMIN UPDATE` audit event.
4. The administrator can create accounts, rotate access codes, disable accounts
   and enable accounts. Rotation and status changes increment the session
   version, invalidating prior staff sessions.
5. Rejected and cancelled records remain immutable history. A new active record
   is created when a replacement is required.

No cast account was created during release smoke. The administrator must create
each account intentionally and deliver its one-time temporary access code through
the shop's chosen private channel.

## Access and security boundary

1. `/`, profile pages, photographs, public attendance reads and `/staff` are
   accessible in a normal browser without an OpenAI or ChatGPT account.
2. `/api/staff/*` uses the site's own cast account, scrypt credential hash and
   signed HttpOnly session cookie.
3. `/admin`, `/admin/*` and `/api/admin/*` remain protected by Caddy Basic Auth.
4. Caddy removes incoming trust markers and injects
   `X-Nocturne-Admin-Authenticated: 1` only after successful Basic Auth.
5. The Node service listens only on loopback and fails closed when the trusted
   administrator marker is missing.
6. The staff session secret is read from macOS Keychain at process startup and
   is absent from Git, manifests, release receipts and logs.

## Release gates

- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- Vinext standalone build: passed.
- Automated tests: 37 passed, zero failed.
- Production dependency audit: zero vulnerabilities.
- Gitleaks: about 136 KB across two commits scanned, no leaks found.
- App Deployer `plan`, `render`, `check` and `apply --dry-run`: passed.
- Isolated standalone probe: HTTP 200, migration count 3, SQLite integrity
  `ok`, `/staff` 200, anonymous staff session 401 and administrator trust marker
  fail-closed behavior passed.
- Independent read-only review job
  `20260810T064410Z-nocturne-release-gate-core-pvidL4`: high-confidence pass with
  no P0, P1 or P2 blocker across the five release questions.

## Backup and migration evidence

The pre-release online SQLite backup is:

`/Users/shinpei/Library/Application Support/NocturneTokyo/backups/pre-cast-access-20260810T152727+0900/nocturne.sqlite`

- Backup SHA-256:
  `e1864fd819edaefe91ce5a4a0bda24499defa57059b7ab5c755c6f25a71de586`
- Backup integrity: `ok`.
- Backup contents: 2 migrations, 1 attendance entry and 4 attendance events.
- LaunchAgent rollback copy:
  `cc.shinpei.nocturne-tokyo.before.plist` in the same backup directory.
- Binary rollback pointer: `current-before` in the same backup directory.

Production startup applied `0002_strange_sugar_man`, adding `cast_accounts` and
`cast_account_events`. Post-release integrity is `ok`; migration count is 3;
the existing 1 attendance entry and 4 attendance events remain unchanged; both
new account tables contain zero records.

## Deployment sequence

App Deployer was used for rendering and preflight only. Its generic Caddy
renderer does not preserve the existing Basic Auth block, so formal `apply` was
intentionally skipped.

The first manual pointer attempt used the default macOS `mv` behavior. Because
`current` points to a directory, `mv` followed the link and refused the nested
write. The rollback handler restored the old plist, restarted the previous
release and verified migration count 2 with a healthy local response. The new
release had not started and production data remained unchanged.

The successful attempt used `mv -h` for exact symlink replacement, installed the
rendered LaunchAgent plist, waited for the old launchd state to clear and
bootstrapped the service. The service started as PID `35779`, applied migration
3 and passed local health. Caddy, DNS and TLS were not changed.

## Final production smoke

- Public `/health`, `/`, `/profile/yuna`, photograph asset, `/staff` and public
  attendance API: HTTP 200.
- Anonymous `/api/staff/session`: HTTP 401.
- Anonymous `/admin`: HTTP 401.
- Spoofed administrator trust header through public HTTPS: HTTP 401.
- Incorrect shop access code: HTTP 401.
- Correct shop access code: administrator page, attendance API and cast-account
  API return HTTP 200.
- Authenticated same-origin invalid attendance write: HTTP 400 with no data
  change.
- Authenticated cross-origin attendance write: HTTP 403
  `cross_origin_blocked`.
- Invalid cast sign-in: HTTP 401 `invalid_credentials`.
- Public Yuna projection remained `2026-08-31 01:00-12:23`.
- Root and staff HTML contain no OpenAI or ChatGPT account dependency text.
- LaunchAgent stderr stayed at 342 bytes, with no new release error.
- Caddy site checksum remained unchanged.

## Artifact checksums

- Standalone `server.js` SHA-256:
  `b8e6d68c6533cdd91b88a7de591639e1aba139c490e0484cc85b2cbc0fa7e1c3`
- Production startup script SHA-256:
  `d7f9a2cf158079d067f994bd02a1adb94c6a9b732c1d9a733b51bb8e346ab594`
- LaunchAgent plist SHA-256:
  `1ea51a1e2441c5efa86550fd96555966cb4351ca10359a69e35ea68609326047`
- Deployment manifest SHA-256:
  `344e5c24e993ece86fb65bd6f621afe553e80a9df88b7bd9fb454dfd4d81266e`
- Caddy site SHA-256:
  `2984e8ee9a642e43a66d62cd547a79a53760d7ee267fed5fd2b4ed40d88bc68e`

## Rollback boundary

The binary rollback target is release
`20260810T104407+0900-035a8d985cf7`. Restore the `current` symlink and the saved
LaunchAgent plist, then bootstrap the label and verify local and public health.
Migration 3 is additive and compatible with the previous binary. If data-level
recovery is required, stop the service and restore the verified pre-release
SQLite backup before restarting the previous release.

## Artifact lifecycle

The current release `20260810T153247+0900-2b3a73725749` and the verified
rollback release `20260810T104407+0900-035a8d985cf7` are retained. The merged
feature branch was deleted, no process listens on the former development ports
4191 or 4193, and the two temporary symlinks from the failed pointer attempt
were removed.

The older 49 MB release `20260810T104136+0900-022610e8b750` has no active
process, current pointer, rollback pointer or LaunchAgent reference. Both direct
move and the macOS recoverable `trash` command were denied by local Trash
permissions, so the directory remains unchanged. It can be rechecked at the
next maintenance window after the local Trash permission is repaired. No
permanent deletion was attempted.
