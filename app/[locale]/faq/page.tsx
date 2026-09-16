import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqExperience } from "../../nocturne";
import { getDictionary } from "../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../i18n/locales";

// Public URL: /:locale/faq.html (see next.config.ts's rewrites).
type FaqPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: FaqPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return { title: dictionary.faqPage.title };
}

export default async function FaqPage({ params }: FaqPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <FaqExperience />;
}
