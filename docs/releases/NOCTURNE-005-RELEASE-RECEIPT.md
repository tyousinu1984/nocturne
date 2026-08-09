# Nocturne Tokyo Operations Foundation Release Receipt

- Release date: 2026-08-09
- Production site: `https://nocturne.shinpei.cc.cd`
- Deployment source commit:
  `c1207954989317ead7c6eecf77091fd3cab82e83`
- Sites version: 5
- Sites deployment:
  `https://nocturne-tokyo-2026.xlbljz698876.chatgpt.site`
- Previous production rollback: Sites version 4 at commit
  `3d40b750ced24fc1871734d81968a4f152cdf6f0`
- Release authorization: the Human Owner accepted the D0 admin workflow probe
  on 2026-08-09 and instructed development to continue.

## Released scope

1. Added the source for a one-profile operations workflow covering a locked
   revision snapshot, deterministic rights gates, independent simulated review,
   publication pointers, rollback and emergency takedown.
2. Added pure state-machine tests for edit permissions, identity separation,
   publish and rollback pointer swaps, and takedown republish blocking.
3. Kept production `/admin` unconditionally unavailable.
4. Kept the public catalogue, supplied photographs, routes and custom domain
   behaviour unchanged.

## Release gates

- `npm run lint`: passed.
- `npm run test`: seven passed, zero failed.
- Production dependency audit: zero vulnerabilities.
- Independent review: passed with no remaining P1 or P2.
- Development browser: complete editor-to-reviewer workflow passed.
- Mobile browser: 390-pixel viewport had no horizontal overflow.
- Production `/`: HTTP 200.
- Production `/profile/yuna`: HTTP 200.
- Production `/photos-preview/yuna-01.jpg`: HTTP 200 and `image/jpeg`.
- Production `/admin`: HTTP 404 with no operations-probe copy.
- Public root page: no ChatGPT sign-in surface.
- Custom domain: active.
- Custom-domain SSL: active.
- Recent Sites Worker error log: empty.

## Production and rollback boundary

Sites version 5 is the current production version. Sites version 4 remains the
immediate rollback version with the same public catalogue and supplied-photo
release.

The operations probe remains development-only. Authentication, D1 persistence,
real uploads, durable audit and attendance writes require a separately
validated development slice before any production exposure.
