"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./locales";
import type { Dictionary } from "./dictionary-types";

type I18nContextValue = { locale: Locale; dictionary: Dictionary };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  dictionary,
  children,
}: I18nContextValue & { children: ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale, dictionary }}>{children}</I18nContext.Provider>
  );
}

/** Client Components read the already-resolved dictionary via this hook
 * instead of loading translations themselves — the Server Component page
 * resolves `getDictionary(locale)` once and passes it down through
 * `I18nProvider`, so there's no client-side fetch/import for translations. */
export function useTranslations() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslations() must be used inside an I18nProvider.");
  }
  return context;
}
