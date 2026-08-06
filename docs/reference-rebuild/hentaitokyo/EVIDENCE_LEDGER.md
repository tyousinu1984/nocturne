# Evidence Ledger

| ID | Claim | Label | Route | Viewport | Scenario | Selector or region | Artifact | Unknown impact |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E-001 | The public home page uses a black document background and Helvetica-family body typography | measured | `/` | 1280x720 | home-desktop-structure | `body` | Browser computed style | Low |
| E-002 | Desktop has a 350 px upper service region followed by a 65 px horizontal navigation region | measured | `/` | 1280x720 | home-desktop-structure | `#ceiling`, `#fixedBox` | Browser geometry | Low |
| E-003 | The upper service region contains five equal visual tiles in a centered row | measured | `/` | 1280x720 | home-desktop-structure | `#ceiling ul > li` | Browser geometry | Low |
| E-004 | The primary navigation contains ten horizontally arranged items | measured | `/` | 1280x720 | home-desktop-structure | `#fixedBox ul > li` | Browser geometry | Low |
| E-005 | The home hero is a 400 px high wide carousel with 600 px slide items | measured | `/` | 1280x720 | home-desktop-structure | `.wideslider li` | Browser geometry | Medium, carousel timing excluded |
| E-006 | The home directory contains 51 repeated profile-card structures | measured | `/` | 1280x720 | home-desktop-structure | `.element-item`, `.flex-sections` | Browser DOM counts | Low |
| E-007 | Desktop profile cards are arranged in four 300 px columns and are approximately 525 px tall | measured | `/` | 1280x720 | home-desktop-structure | `.element-item` | Browser geometry | Low |
| E-008 | Home reviews use a two-column grid inside a 1200 px content region | measured | `/` | 1280x720 | home-desktop-structure | `.reviews-wrapper` | Browser computed style | Low |
| E-009 | Source mobile layout switches to a drawer navigation and hides the desktop navigation | observed | `/` | 390x844 | home-desktop-structure | `.drawer-nav`, `#fixedBox` | Browser computed style | Low |
| E-010 | Source mobile content retains an approximately 660 px internal width and creates horizontal overflow | measured | `/` | 390x844 | home-desktop-structure | `#bbg`, `.list` | Browser geometry | High; implementation intentionally corrects it |
| E-011 | A public profile route is exposed through same-origin links using `/profile?cc=<id>` | observed | `/` | 1280x720 | profile-desktop-structure | same-origin anchor paths | Browser DOM inspection | Low |
| E-012 | The public profile route begins with a light 1180 px wide image-forward dossier card | measured | `/profile?cc=1820` | 1280x720 | profile-desktop-structure | `.profile-card-wrapper`, `.profile-card` | Browser geometry | Low |
| E-013 | Supporting profile regions include statistics, schedule, gallery, journal, reviews and a review form | observed | `/profile?cc=1820` | 1280x720 | profile sections | Browser DOM inspection | Medium; form intentionally excluded |
| E-014 | Profile gallery content uses a three-column light panel at desktop width | measured | `/profile?cc=1820` | 1280x720 | profile-desktop-structure | `#selfies` | Browser computed style | Low |
| E-015 | Source age overlay is fixed, near full width, black-backed and above the page at z-index 9999 | measured | `/` | 1280x720 | home-desktop-structure | `.modal` | Browser computed style | Low |

Labels used: `measured`, `observed`, `inferred`, `chosen`, `unknown`.
