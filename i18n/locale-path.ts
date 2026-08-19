import type { Locale } from "./locales";

/** Prefixes an internal href with the current locale. Pure in-page anchors
 * ("#directory") pass through unchanged; "/" becomes "/ja"; "/#directory"
 * becomes "/ja#directory"; "/profile/aika" becomes "/ja/profile/aika". */
export function localeHref(locale: Locale, href: string) {
  if (href.startsWith("#")) return href;
  if (href === "/") return `/${locale}`;
  if (href.startsWith("/#")) return `/${locale}${href.slice(1)}`;
  return `/${locale}${href}`;
}
