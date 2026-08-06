# Fidelity Report

## Replay inputs

- Source scenarios: `home-desktop-structure`, `profile-desktop-structure`
- Implementation routes: `/`, `/profile/aika`
- Browser: Codex In-app Browser
- Source viewport: 1280x720 and 390x844
- Implementation viewport: 1280x720 and 390x844
- Locale: English
- Color scheme: dark masthead with warm light catalogue surfaces
- Reduced motion: implemented through media query
- Readiness: DOM complete, client interactions hydrated
- Comparison method: structural, geometric and interaction checkpoints

## Gates

| Gate ID | Domain | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| G-001 | Brand and asset replacement | pass | App source and rendered HTML | No source mark, copy, media URL or external asset |
| G-002 | Home hierarchy | pass | Local browser checks | Masthead, feature rail, navigation, hero, ticker, directory, reviews and journal present |
| G-003 | Directory behavior | pass | Local browser checks | Ginza filter returns 4, `tea` search returns Rin, reveal expands 8 to 12 |
| G-004 | Profile navigation | pass | Local browser checks | Card navigation reaches `/profile/aika` with schedule, gallery and reviews |
| G-005 | Desktop overflow | pass | 1280 body and client widths equal | No horizontal page overflow |
| G-006 | Mobile navigation | pass | 390x844 browser check | Drawer exposes six links and reports expanded state |
| G-007 | Mobile overflow | pass | 390 body and client widths equal | Source overflow is intentionally corrected |
| G-008 | Build and static checks | pass | `npm run lint`, `npm run build`, Node tests | All checks pass |
| G-009 | Runtime console | pass | Browser console | No warning or error entries |
| G-010 | Deployment boundary | pass | Local project state | No deployment or production change performed |

## Discrepancies

| ID | Classification | Severity | Status | Evidence | Owner | Replay proof |
| --- | --- | --- | --- | --- | --- | --- |
| D-001 | approved-difference | high | accepted | Scope D-001 | Project policy | Original Nocturne identity |
| D-002 | approved-difference | high | accepted | Scope D-002 | Project policy | CSS abstract artwork |
| D-003 | approved-difference | high | accepted | Scope D-004 | Project policy | Booking, payment and contact flows absent |
| D-004 | approved-difference | medium | accepted | E-010, G-007 | Implementation | Mobile overflow corrected |
| D-005 | approved-difference | medium | accepted | E-005 | Implementation | Hero uses restrained composition instead of copying carousel media |

## Final status

- Status: pass
- Open evidence risks: source post-age-gate animation timing and transactional
  behavior were intentionally excluded
- Human Owner acceptance: pending user review
