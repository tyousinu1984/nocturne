import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminIdentityLabel, getAdminAccess } from "../../admin/access";
import { AdminConsole } from "../../admin/admin-console";
import { getDictionary } from "../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../i18n/locales";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: AdminPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return {
    title: dictionary.meta.adminTitle,
    description: dictionary.meta.adminDescription,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const access = await getAdminAccess();
  if (access.kind !== "authorized") notFound();

  return (
    <AdminConsole
      adminUser={{
        displayName: access.user.displayName,
        identityLabel: adminIdentityLabel(),
      }}
    />
  );
}
