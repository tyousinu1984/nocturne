import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogExperience } from "../../nocturne";
import { getMergedArtists } from "../../model-data";
import { getDictionary } from "../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../i18n/locales";

// Public URL: /:locale/blog.html (see next.config.ts's rewrites).
type BlogPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return { title: dictionary.sections.journal.title };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const artists = await getMergedArtists(locale);
  return <BlogExperience artists={artists} />;
}
