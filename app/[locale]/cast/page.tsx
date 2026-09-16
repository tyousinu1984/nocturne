import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CastListExperience } from "../../nocturne";
import { getMergedArtists } from "../../model-data";
import { getDictionary } from "../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../i18n/locales";

// Public URL: /:locale/cast/list.html (see next.config.ts's rewrites).
// This route itself stays a clean path; the ".html" suffix only exists at
// the rewrite layer.
type CastListPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: CastListPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return {
    title: dictionary.meta.castListTitle,
    description: dictionary.meta.castListDescription,
  };
}

export default async function CastListPage({ params }: CastListPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const artists = await getMergedArtists(locale);
  return <CastListExperience artists={artists} />;
}
