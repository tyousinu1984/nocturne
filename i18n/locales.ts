// Shared locale constants. `DEFAULT_LOCALE` is Japanese — the product is
// positioned in Tokyo — so the unprefixed root path redirects there (see
// proxy.ts) rather than falling back to English.
export const SUPPORTED_LOCALES = ["ja", "en", "zh"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export const localeLabel: Record<Locale, string> = {
  ja: "日本語",
  en: "EN",
  zh: "中文",
};
