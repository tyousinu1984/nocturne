import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { isSupportedLocale, type Locale } from "../../i18n/locales";
import { getDictionary } from "../../i18n/get-dictionary";
import { I18nProvider } from "../../i18n/context";

export const metadata: Metadata = {
  metadataBase: new URL("https://nocturne.shinpei.cc.cd"),
  title: {
    default: "NOCTURNE TOKYO | Cast Directory",
    template: "%s | NOCTURNE TOKYO",
  },
  description:
    "A high-density Tokyo night directory featuring editorial profiles, schedules, journals and visual updates.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "NOCTURNE TOKYO",
    title: "NOCTURNE TOKYO | Cast Directory",
    description:
      "Explore editorial profiles, schedules and Tokyo night visual updates.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "NOCTURNE TOKYO cast directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NOCTURNE TOKYO | Cast Directory",
    description:
      "Explore editorial profiles, schedules and Tokyo night visual updates.",
    images: ["/og.png"],
  },
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} dictionary={dictionary}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
