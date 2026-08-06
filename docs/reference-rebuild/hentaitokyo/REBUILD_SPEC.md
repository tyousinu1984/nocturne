# Nocturne Reference Rebuild Specification

## Confirmed source archetype

The public reference is a long-form Japanese adult companionship directory. Its
home route uses a black service masthead, five image entry tiles, a ten-item
horizontal navigation bar, a wide image carousel, an online-status strip, a
dense four-column cast directory, ranking, reviews, editorial content,
location information and an extensive footer.

Its public profile route uses a light dossier surface with a large image
carousel, profile information, statistics, schedule, gallery, journal entries,
long-form reviews and supporting content.

## Original product identity

- Name: `NOCTURNE TOKYO`
- Positioning: fictional adults-only cast directory and editorial showcase
- Voice: direct, energetic, compact and metropolitan
- Palette: black, white, hot pink, orange, gold and silver
- Typography: heavy condensed sans-serif with compact utility text
- Media: original AI-generated portraits of clearly adult, fully clothed
  fictional women

## Implemented home route

- Accessible 21+ confirmation dialog
- Original masthead and utility status
- Five equal portrait-led entry tiles
- Ten-item desktop navigation and ten-link mobile drawer
- 400px wide four-person lineup hero
- Animated online-status ticker with reduced-motion fallback
- Pink and orange daily update banner
- Search, district filters and editorial status filters
- Dense four-column desktop directory with twelve fictional profiles
- Controlled reveal from eight to twelve cards
- Two-column mobile directory without document overflow
- Five-profile ranking
- Three-step first guide
- Two-column review region
- Dark two-story editorial journal
- Three-district information band and dense footer

## Implemented profile route

- Breadcrumb and light 1200px dossier card
- Large portrait, four interactive thumbnail treatments and profile index
- Biography, statistics and local metadata
- Five-day dark schedule strip
- Six-image light gallery
- Two journal entries
- Five review notes
- Four related profile cards

## Reference-aligned geometry

- Desktop service region: 350px before navigation
- Entry rail: five tiles at approximately 189×228px
- Desktop navigation: ten items in a 65px region
- Hero: 400px
- Directory: four 291px columns at a 1280px viewport
- Directory card: approximately 291×550px
- Profile dossier: 1200px wide
- Mobile: two 183px cards at a 390px viewport

## Interaction states

- Age gate open, accepted and declined
- Search idle, focused, filtered and empty
- District and status selection
- Mobile menu open and closed
- Card hover, focus and active states
- Reveal-more from eight to twelve profiles
- Gallery selection
- Reduced-motion mode

## Rights and safety substitutions

- All names, copy, taxonomy, portraits and identity assets are newly authored.
- No source media URL, thumbnail, logo, font, code or private response is used.
- Every represented person is a fictional adult and fully clothed.
- Booking, payment, messaging, phone, address and review submission are absent.
- The footer and age gate disclose the fictional, non-transactional scope.

## Implementation stack

- React 19
- TypeScript
- Vinext
- Local static profile data
- Local generated portrait assets
- No external runtime API
