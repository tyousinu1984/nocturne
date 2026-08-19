import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { artists } from "../../../data";
import { ProfileExperience } from "../../../nocturne";
import { getDictionary } from "../../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../../i18n/locales";
import { localizeArtist } from "../../../../i18n/localize-artist";

type ProfilePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const locale: Locale = rawLocale;
  const dictionary = await getDictionary(locale);
  const artist = artists.find((candidate) => candidate.slug === slug);
  if (!artist) return { title: dictionary.meta.profileNotFound };
  const localized = localizeArtist(artist, dictionary);
  return {
    title: `${artist.name} Profile`,
    description: localized.localizedShortNote,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const artist = artists.find((candidate) => candidate.slug === slug);
  if (!artist) notFound();
  return <ProfileExperience artist={artist} />;
}
