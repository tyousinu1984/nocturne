# Scope Contract

## Target

- Target slug: `hentaitokyo-public-reference`
- Source URL: `https://hentaitokyo.com/`
- Allowed public routes: `/` and one public detail route discovered from `/`
- Maximum route count: 2
- Capture date: 2026-08-06
- Allowed origins: `https://hentaitokyo.com`
- Maximum redirects: 5
- Maximum pages: 2
- Maximum elapsed minutes: 15
- Maximum DOM nodes per scenario: 20000
- Maximum retained resource records: 500
- Maximum retained bytes: 10485760
- Maximum screenshot pixels: 0
- Maximum image file bytes: 0

## Authority

- Mode: `reference-rebuild`
- Ownership or permission evidence: no ownership claim; public reference use only
- Permitted source assets: none
- Required license or attribution: no third-party source assets will ship

## Delivery

- Audience: project owner evaluating a local product prototype
- Primary outcome: original responsive catalogue and watch-page prototype
- Target stack: React 19, TypeScript, Vinext, CSS
- Required routes: `/`, `/watch/[slug]`
- Required viewports: 1440x900, 768x1024, 390x844
- Required interaction families: age gate, navigation, search, filters, card grid,
  pagination or load-more behavior, watch-page player shell, related cards
- Motion scope: subtle local transitions with reduced-motion fallback
- Accessibility scope: semantic landmarks, visible focus, keyboard access,
  dialog semantics, minimum contrast
- Local-only or separately authorized deployment: local-only

## Exclusions

- Authentication: excluded
- Personal data: excluded
- Checkout and payment: excluded
- Private APIs: excluded
- CAPTCHA and anti-bot: excluded
- Source bundles, source maps, and full stylesheet extraction: excluded
- Private network and excluded schemes: excluded
- Form submission, download, external navigation, and non-GET requests: excluded

## Acceptance gates

- Static: original identity, dense catalogue hierarchy, complete home and watch
  routes, safe local artwork
- Responsive: verified at all declared viewports
- Interaction: age gate, menu, search, filters, cards, watch navigation and
  recommendations function locally
- Motion: restrained transitions; no essential meaning depends on animation
- Accessibility and reduced motion: keyboard path, focus, dialog labels and
  reduced-motion stylesheet pass manual checks
- Build and runtime: lint, production build and local browser smoke test pass
- Brand and asset replacement: no reference brand or media appears in output

## Approved differences

| ID | Difference | Reason | Approver | Date |
| --- | --- | --- | --- | --- |
| D-001 | Original `Nocturne` identity and copy | Trademark and copy boundary | Project policy | 2026-08-06 |
| D-002 | Abstract, non-explicit card artwork | Adult-media safety boundary | Project policy | 2026-08-06 |
| D-003 | Local placeholder player with no source stream | Media and network boundary | Project policy | 2026-08-06 |
| D-004 | No account, payment, comments, ads or tracking | Delivery scope | Project policy | 2026-08-06 |
