# Nocturne Reference Rebuild Specification

## Confirmed source archetype

The public reference is a long-form adult companionship directory rather than a
video catalogue. Its home route uses a dark branded masthead, five prominent
entry tiles, a ten-item horizontal navigation bar, a wide carousel, a status
ticker, a dense four-column profile directory, reviews, journal content,
location information, payment promotion and an extensive footer.

Its public profile route uses a light dossier surface with a large image
carousel, profile information, statistics, schedule, gallery, journal entries,
long-form reviews, a review form and a large footer.

## Original product identity

- Name: `Nocturne`
- Positioning: fictional adults-only artist directory and editorial study
- Voice: concise, editorial, private, restrained
- Palette: ink black, warm ivory, ultraviolet, rose and mint accents
- Media: abstract CSS-generated compositions with no source photography

## Implemented routes

### `/`

- Accessible 21+ confirmation dialog
- Branded masthead and sticky primary navigation
- Five editorial entry tiles
- Wide abstract hero composition
- Animated status ticker with reduced-motion fallback
- Search, district filters and local status filters
- Dense four-column desktop directory with controlled reveal
- Two-column responsive mobile directory without horizontal page overflow
- Review and editorial journal sections
- Safety and provenance disclosure in the footer

### `/profile/[slug]`

- Breadcrumb and large abstract profile composition
- Biography, local tags, statistics and non-transactional status note
- Five-day editorial schedule
- Interactive abstract gallery
- Studio notes and prototype review sections
- Related-profile directory

## Responsive behavior

- Desktop: four-column directory, persistent horizontal navigation, split
  profile hero
- Tablet: three-column directory, wrapped filters, compressed navigation
- Mobile: two-column directory, drawer navigation, stacked profile hero and
  horizontally scrollable schedule
- Improvement over source: mobile document width stays equal to viewport width

## Interaction states

- Age gate open, accepted and declined
- Search idle, focused, filtered and empty result
- District and status selection
- Mobile menu open and closed
- Card hover, focus and active
- Reveal-more complete
- Gallery selection
- Reduced-motion mode

## Rights and safety substitutions

- All names, copy, taxonomy and artwork are newly authored.
- No source media URL, thumbnail, logo, font, code or private response is used.
- Booking, payment, messaging, phone, address and review submission are absent.
- All profiles are explicitly fictional adults aged 21 or older.
- Explicit imagery is excluded from source artifacts and output.

## Implementation stack

- React 19
- TypeScript
- Vinext
- Local static data
- CSS-generated artwork
- No external runtime API
