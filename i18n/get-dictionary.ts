import type { Locale } from "./locales";
import type { Dictionary } from "./dictionary-types";
import { en } from "./dictionaries/en";
import { ja } from "./dictionaries/ja";
import { zh } from "./dictionaries/zh";

const dictionaries: Record<Locale, Dictionary> = { en, ja, zh };

// Server Components (page.tsx/layout.tsx) call this directly. It's not
// actually async I/O (the three dictionaries are small enough to just
// import eagerly), but kept as an async function so swapping to
// per-locale dynamic `import()` later — if dictionaries grow large enough
// to want code-splitting — doesn't change any call site.
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale];
}
