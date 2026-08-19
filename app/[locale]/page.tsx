import type { Metadata } from "next";
import { HomeExperience } from "../nocturne";
import { getDictionary } from "../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../i18n/locales";
import { notFound } from "next/navigation";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return {
    title: dictionary.meta.homeTitle,
    description: dictionary.meta.homeDescription,
  };
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <HomeExperience />;
}
