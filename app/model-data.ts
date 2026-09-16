// Merges the admin-editable model_profiles overlay (app/admin/model-profile-store.ts)
// onto app/data.ts's static `artists` array, resolving the per-locale
// role/shortNote/biography down to plain strings before handing the result
// to Client Components. Server Component pages call these instead of
// importing `artists` from ./data directly — see the project plan's
// "数据合并层" section for why.
//
// i18n/localize-artist.ts's dictionary.artists[slug] lookup is now a
// fallback only (dead in practice once every slug is seeded — see
// scripts/seed-model-profiles.mjs — but kept so a missing DB row degrades
// gracefully instead of breaking the page): once this file writes the
// DB-resolved text directly onto `role`/`shortNote`/`biography`, that's
// what localizeArtist()'s `?? artist.role`-style fallback ends up reading.
import { artists, type Artist } from "./data";
import { listModelProfiles, type ModelProfileRecord } from "./admin/model-profile-store";
import type { Locale } from "../i18n/locales";

function pickLocaleText(record: ModelProfileRecord, field: "role" | "shortNote" | "biography", locale: Locale) {
  const key = `${field}${locale === "ja" ? "Ja" : locale === "zh" ? "Zh" : "En"}` as keyof ModelProfileRecord;
  return record[key] as string;
}

function applyOverride(artist: Artist, override: ModelProfileRecord | undefined, locale: Locale): Artist {
  if (!override) return artist;
  return {
    ...artist,
    name: override.name,
    tier: override.tier,
    district: override.district,
    status: override.status,
    role: pickLocaleText(override, "role", locale),
    shortNote: pickLocaleText(override, "shortNote", locale),
    biography: pickLocaleText(override, "biography", locale),
  };
}

export async function getMergedArtists(locale: Locale): Promise<Artist[]> {
  let overrides: ModelProfileRecord[] = [];
  try {
    overrides = await listModelProfiles();
  } catch {
    // Falls back to the static app/data.ts content for every artist —
    // matches the same fail-open pattern used elsewhere (e.g. the
    // schedule page swallowing listPublicAttendance failures per-artist).
  }
  const overrideBySlug = new Map(overrides.map((record) => [record.slug, record]));
  return artists.map((artist) => applyOverride(artist, overrideBySlug.get(artist.slug), locale));
}

export async function getMergedArtistBySlug(
  slug: string,
  locale: Locale,
): Promise<Artist | undefined> {
  const artist = artists.find((candidate) => candidate.slug === slug);
  if (!artist) return undefined;
  try {
    const override = await getModelProfileSafe(slug);
    return applyOverride(artist, override, locale);
  } catch {
    return artist;
  }
}

export async function getMergedArtistById(id: number, locale: Locale): Promise<Artist | undefined> {
  const artist = artists.find((candidate) => candidate.id === id);
  if (!artist) return undefined;
  try {
    const override = await getModelProfileSafe(artist.slug);
    return applyOverride(artist, override, locale);
  } catch {
    return artist;
  }
}

async function getModelProfileSafe(slug: string) {
  const { getModelProfile } = await import("./admin/model-profile-store");
  return (await getModelProfile(slug)) ?? undefined;
}
