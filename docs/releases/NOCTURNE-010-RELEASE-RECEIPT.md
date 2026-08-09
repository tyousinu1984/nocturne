# Nocturne Tokyo Attendance Alpha Release Receipt

- Release date: 2026-08-09
- Production site: `https://nocturne.shinpei.cc.cd`
- Deployment source commit:
  `263a6d3b48cc1a3fd299a7cd3ddae594a6844566`
- Sites version: 10
- Sites environment revision: 2
- Previous production rollback: Sites version 5 at commit
  `c1207954989317ead7c6eecf77091fd3cab82e83`
- Release authorization: the Human Owner explicitly stated that the Attendance
  Alpha could be released on 2026-08-09.

## Released scope

1. Route-scoped Sign in with ChatGPT for `/admin` while public catalogue routes
   remain anonymous.
2. One secret site-scoped Owner allowlist identity with server-side API checks.
3. D1-backed attendance drafts, review, approval, publication, cancellation,
   concurrency protection, idempotency and append-only events.
4. Published-only anonymous attendance projection with failure closure and no
   stale static fallback during storage failure.
5. Production and mobile operations UI for the Attendance vertical slice.
6. Cast, media and release tooling remain simulated and session-only.

## Release gates

- `npm run lint`: passed.
- `npm test`: 36 passed, zero failed.
- Vinext production build: passed.
- Production dependency audit: zero vulnerabilities.
- Independent backend and UI reviews: no remaining P1 or P2.
- Production `/`: HTTP 200.
- Production `/profile/yuna`: HTTP 200.
- Anonymous public attendance API: HTTP 200 and `availability: ready`.
- Anonymous `/admin`: HTTP 307 to Sign in with ChatGPT.
- Anonymous admin attendance API: HTTP 401 `authentication_required`.
- Authenticated Owner `/admin`: Operations Console rendered successfully.
- Authenticated Attendance view: `D1 READY` with zero initial records.
- Clean final browser console: zero warnings and zero errors.
- Temporary identity verification routes: removed and returning HTTP 404.

## Identity bootstrap and cleanup

The Sites access-policy account ID did not equal the Site's forwarded SIWC user
ID. A controlled, authenticated self-identity page briefly returned only the
current user's own site-scoped ID and boolean allowlist diagnostics. It never
returned the environment allowlist, email or other account data. The final
version removed both bootstrap routes before release.

## Rollback boundary

Sites version 5 remains the pre-attendance rollback version. Rolling back to it
removes production admin and attendance reads while preserving the public
catalogue and supplied-photo release. The new D1 schema is additive and begins
with no attendance records.
