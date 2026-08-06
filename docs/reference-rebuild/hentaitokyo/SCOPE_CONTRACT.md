# Scope Contract

## Target

- Target slug: `hentaitokyo-public-reference`
- Source URL: `https://hentaitokyo.com/`
- Allowed public routes: `/` and one public detail route discovered from `/`
- Capture date: 2026-08-06
- Allowed origins: `https://hentaitokyo.com`
- Maximum route count: 2
- Retained evidence: structural measurements and written observations only
- Retained source screenshots or adult media: none

## Authority

- Mode: public reference rebuild
- Ownership claim: none
- Permitted source assets: none
- Required source attribution in product UI: none, because no source asset ships
- Original deployment identity: `NOCTURNE TOKYO`
- Production hostname authorized by the Human Owner:
  `https://nocturne.shinpei.cc.cd`

## Delivery

- Audience: project owner and invited friends using a public URL
- Primary outcome: high-fidelity visual reconstruction of the reference
  directory archetype under an original identity and safe content boundary
- Target stack: React 19, TypeScript, Vinext and CSS
- Required routes: `/` and `/profile/[slug]`
- Required viewports: 1280x720 and 390x844
- Required interaction families: age gate, desktop navigation, mobile drawer,
  search, district filters, status filters, reveal-more, profile gallery and
  profile navigation
- Motion scope: status ticker and restrained local transitions with
  reduced-motion fallback
- Accessibility scope: semantic landmarks, visible focus, keyboard-capable
  controls, dialog labels and responsive touch targets
- Deployment: versioned Sites production release to the existing public
  custom domain

## Visual fidelity acceptance

- Black masthead and document framing
- Five equal portrait-led entry tiles
- Ten-item horizontal desktop navigation
- 400px wide lineup hero
- High-frequency online status band
- White catalogue surface with compact toolbar
- Four approximately 300px desktop cards and two-column mobile cards
- Hot pink, orange, gold and silver operational labels
- Heavy condensed sans-serif type
- Light, image-forward profile dossier with schedule, gallery, journal and
  reviews
- No purple astronomy palette, serif display typography, orbital graphics,
  luxury-magazine spacing or warm ivory editorial system

## Exclusions

- Source name, logo, written copy, code, font and media
- Explicit sexual media
- Authentication, personal data, checkout, payment and messaging
- Phone numbers, real addresses, booking and transaction paths
- Private APIs, anti-bot bypass, downloads and form submission
- Analytics, ads and external runtime content

## Acceptance gates

- Static: original identity, safe original portrait assets and no source brand
- Geometry: five entry tiles, ten navigation links, 400px hero and four
  desktop profile columns
- Responsive: two-column mobile catalogue with no document overflow
- Interaction: search, filters, reveal-more, gallery and mobile menu work
- Accessibility: visible focus, semantic controls and reduced-motion support
- Build: lint has no errors, production build and rendered HTML tests pass
- Runtime: desktop and mobile browser smoke checks have no console errors
- Production: saved Sites version succeeds and both public routes pass HTTPS
  smoke checks

## Approved differences

| ID | Difference | Reason | Approver | Date |
| --- | --- | --- | --- | --- |
| D-001 | Original `NOCTURNE TOKYO` identity and copy | Trademark and copyright boundary | Project policy | 2026-08-06 |
| D-002 | Original portraits of fictional adults aged 21+ | Rights and adult-media safety boundary | Project policy | 2026-08-06 |
| D-003 | No booking, payment, phone, address or messaging path | Product and safety boundary | Project policy | 2026-08-06 |
| D-004 | Mobile overflow corrected | Usability and accessibility | Project policy | 2026-08-06 |
