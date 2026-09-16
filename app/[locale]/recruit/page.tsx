import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecruitExperience } from "../../nocturne";
import { getDictionary } from "../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../i18n/locales";

// Public URL: /:locale/recruit.html (see next.config.ts's rewrites).
type RecruitPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: RecruitPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return {
    title: dictionary.meta.recruitTitle,
    description: dictionary.meta.recruitDescription,
  };
}

export default async function RecruitPage({ params }: RecruitPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <RecruitExperience />;
}
