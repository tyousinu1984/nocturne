import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMergedArtistById, getMergedArtists } from "../../../../model-data";
import { ProfileExperience } from "../../../../nocturne";
import { getDictionary } from "../../../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../../../i18n/locales";
import { localizeArtist } from "../../../../../i18n/localize-artist";

// Public URL: /:locale/cast/profile/:id.html (see next.config.ts's
// rewrites, and the note on Artist.id in app/data.ts for why this is a
// numeric id and not the slug the rest of the codebase keys off).
type CastProfilePageProps = {
  params: Promise<{ locale: string; id: string }>;
};

function parseArtistId(rawId: string) {
  if (!/^\d+$/.test(rawId)) return undefined;
  return Number.parseInt(rawId, 10);
}

export async function generateMetadata({
  params,
}: CastProfilePageProps): Promise<Metadata> {
  const { locale: rawLocale, id: rawId } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const locale: Locale = rawLocale;
  const dictionary = await getDictionary(locale);
  const id = parseArtistId(rawId);
  const artist = id === undefined ? undefined : await getMergedArtistById(id, locale);
  if (!artist) return { title: dictionary.meta.profileNotFound };
  const localized = localizeArtist(artist, dictionary);
  return {
    title: `${artist.name} Profile`,
    description: localized.localizedShortNote,
  };
}

export default async function CastProfilePage({ params }: CastProfilePageProps) {
  const { locale, id: rawId } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const id = parseArtistId(rawId);
  const artist = id === undefined ? undefined : await getMergedArtistById(id, locale);
  if (!artist) notFound();
  const artists = await getMergedArtists(locale);
  return <ProfileExperience artist={artist} artists={artists} />;
}
