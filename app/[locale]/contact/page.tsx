import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactExperience } from "../../nocturne";
import { getDictionary } from "../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../i18n/locales";

// Public URL: /:locale/contact.html (see next.config.ts's rewrites).
type ContactPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return { title: dictionary.contactPage.title };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <ContactExperience />;
}
