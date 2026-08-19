import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from "./i18n/locales";

const LOCALE_COOKIE = "nocturne_locale";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year

function resolvePreferredLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = request.headers.get("accept-language") ?? "";
  for (const part of acceptLanguage.split(",")) {
    const tag = part.trim().split(";")[0]?.toLowerCase();
    const primary = tag?.split("-")[0];
    if (primary && isSupportedLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

// Redirects any unprefixed page request to /ja (or /en, /zh per cookie /
// Accept-Language) so app/[locale]/... always resolves. Machine-facing
// routes (/api/*, /health) and static assets are left completely alone —
// they were never meant to be locale-prefixed.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/") ||
    pathname === "/health" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/portraits/") ||
    pathname.startsWith("/photos-preview/") ||
    pathname === "/favicon.svg" ||
    pathname === "/og.png"
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/")[1];
  if (isSupportedLocale(firstSegment)) {
    return NextResponse.next();
  }

  const locale = resolvePreferredLocale(request);
  const redirectUrl = new URL(`/${locale}${pathname}`, request.url);
  redirectUrl.search = request.nextUrl.search;
  const response = NextResponse.redirect(redirectUrl, 307);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.svg|og.png|portraits|photos-preview).*)"],
};
