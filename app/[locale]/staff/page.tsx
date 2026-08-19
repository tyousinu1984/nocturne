import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaffPortal } from "../../staff/staff-portal";
import { getDictionary } from "../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../i18n/locales";

export const dynamic = "force-dynamic";

type StaffPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: StaffPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return {
    title: `${dictionary.meta.staffTitle} | NOCTURNE TOKYO`,
    description: dictionary.meta.staffDescription,
    robots: { index: false, follow: false },
  };
}

export default async function StaffPage({ params }: StaffPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <StaffPortal />;
}
