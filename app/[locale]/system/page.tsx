import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SystemGuideExperience } from "../../nocturne";
import { getDictionary } from "../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../i18n/locales";

// Public URL: /:locale/system.html (see next.config.ts's rewrites).
type SystemPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: SystemPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return { title: dictionary.sections.systemGuide.title };
}

export default async function SystemPage({ params }: SystemPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <SystemGuideExperience />;
}
