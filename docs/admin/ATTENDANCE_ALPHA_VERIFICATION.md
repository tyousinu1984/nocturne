# Attendance Alpha verification

Updated: 2026-08-10

## Required evidence

1. `npm run lint` succeeds.
2. `npm test` builds the standalone server and passes unit plus HTTP integration
   tests.
3. `/health` returns `200`, storage `sqlite` and migration count `2`.
4. The public homepage and profile routes return `200` without credentials.
5. Direct access to `/admin` without the trusted local proxy marker fails
   closed.
6. Caddy returns `401` for unauthenticated public requests to `/admin`.
7. Caddy ignores a client-supplied trust marker until Basic Auth succeeds.
8. Authenticated attendance create, submit, approve and publish commands persist
   in SQLite and appear in the public projection.
9. Cancelling a published shift removes it from the public projection while
   preserving the audit trail.
10. The Caddy access log deletes the Authorization request header.

## Production boundary

- Public directory and profiles: anonymous browser access.
- Operations console: shop username and independent access code.
- Persistent data: local SQLite under the NocturneTokyo application support
  directory.
- Rollback: restore the previous DNS record and leave the former hosted release
  unchanged.
