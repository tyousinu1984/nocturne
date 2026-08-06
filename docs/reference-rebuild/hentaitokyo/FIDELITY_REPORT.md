# Fidelity Report

## Replay inputs

- Source scenarios: `home-desktop-structure` and
  `profile-desktop-structure`
- Implementation routes: `/` and `/profile/aika`
- Browser: Codex In-app Browser
- Viewports: 1280×720 and 390×844
- Capture date: 2026-08-06
- Comparison method: structural, geometric, visual-system and interaction
  checkpoints

## Visual-system correction

The earlier candidate used warm ivory, purple accents, serif typography,
orbital graphics and low-density editorial spacing. Human Owner feedback
identified that direction as visually unrelated to the reference.

The replacement candidate removes those signals and uses black, white, hot
pink, orange, condensed sans-serif typography, rectangular utility bands,
image-led navigation and a high-density catalogue rhythm.

## Gates

| Gate ID | Domain | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| G-001 | Brand and asset replacement | pass | App source and local assets | No source mark, copy, font, code or media |
| G-002 | Service-region hierarchy | pass | Browser geometry | Five 189×228px tiles before ten-item navigation |
| G-003 | Hero geometry | pass | Browser geometry | 400px high image-led hero |
| G-004 | Directory geometry | pass | Browser geometry | Four 291×550px cards at 1280px |
| G-005 | Directory behavior | pass | Browser interaction | `tea` returns Rin; reveal expands 8 to 12 |
| G-006 | Desktop overflow | pass | Browser geometry | Client and scroll width both 1280 |
| G-007 | Mobile hierarchy | pass | 390×844 browser check | Scrollable five-tile rail, hero, ticker and notice |
| G-008 | Mobile navigation | pass | Browser interaction | Ten-link drawer reports expanded state |
| G-009 | Mobile directory | pass | Browser geometry | Two 183px cards; document width remains 390 |
| G-010 | Profile route | pass | Browser check | Large dossier, four thumbnails and five schedule cells |
| G-011 | Runtime console | pass | Browser logs | No warning or error entries |
| G-012 | Static checks | pass | Lint, build, Node tests and diff check | Lint has image optimization warnings only |
| G-013 | Keyboard containment | pass | Independent review fix and browser state check | Age gate isolates background; closed mobile drawer is inert and hidden |
| G-014 | Public deployment | pass | Sites version 3 and public browser checks | Home, profile, favicon and OG return 200; console and Worker error logs are clear |

## Approved differences

| ID | Classification | Severity | Status | Evidence | Reason |
| --- | --- | --- | --- | --- | --- |
| D-001 | approved difference | high | accepted | Scope D-001 | Original identity and copy |
| D-002 | approved difference | high | accepted | Scope D-002 | Original fictional adult portraits |
| D-003 | approved difference | high | accepted | Scope D-003 | No booking, phone, address, payment or messaging |
| D-004 | approved difference | medium | accepted | E-010, G-009 | Source mobile overflow corrected |
| D-005 | approved difference | medium | accepted | E-005, G-003 | Static hero preserves rhythm without copying media |

## Current status

- Candidate status: released as Sites version 3
- Public deployment: passed at `https://nocturne.shinpei.cc.cd`
- Production source:
  `ff69adaa1d06aeef38b23894748b00cf2f006f70`
- Human Owner visual acceptance: pending review of the replacement production
  release
