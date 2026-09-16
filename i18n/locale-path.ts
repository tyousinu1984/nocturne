import type { Locale } from "./locales";

/** Prefixes an internal href with the current locale. Pure in-page anchors
 * ("#system") pass through unchanged; "/" becomes "/ja"; "/#system"
 * becomes "/ja#system"; "/cast/list.html" becomes "/ja/cast/list.html". */
export function localeHref(locale: Locale, href: string) {
  if (href.startsWith("#")) return href;
  if (href === "/") return `/${locale}`;
  if (href.startsWith("/#")) return `/${locale}${href.slice(1)}`;
  return `/${locale}${href}`;
}

/** A model's public profile URL. Uses the numeric `id` (not `slug`) — see
 * the note on Artist.id in app/data.ts. The `.html` suffix is real: it's
 * matched by a rewrite in next.config.ts down to the actual
 * app/[locale]/cast/profile/[id] route, not just cosmetic. */
export function castProfileHref(locale: Locale, id: number) {
  return `/${locale}/cast/profile/${id}.html`;
}
