import type { Artist } from "../app/data";
import type { Dictionary } from "./dictionary-types";

export type LocalizedArtist = Artist & {
  localizedRole: string;
  localizedShortNote: string;
  localizedBiography: string;
  localizedTier: string;
  localizedStatus: string;
  localizedDistrict: string;
  localizedStats: Array<{ label: string; value: string }>;
  localizedSchedule: Array<{ day: string; date: string; state: string }>;
  localizedLanguages: string[];
  localizedDisciplines: string[];
};

/** `data.ts` keeps its raw English union values (tier/status/district,
 * stats[].label, schedule[].state) as-is — they double as the dictionary
 * keys looked up here, rather than each artist repeating its own
 * translated copy of shared vocabulary. Only role/shortNote/biography are
 * genuinely per-artist and come from dictionary.artists[slug]. */
export function localizeArtist(artist: Artist, dictionary: Dictionary): LocalizedArtist {
  const translation = dictionary.artists[artist.slug];
  return {
    ...artist,
    localizedRole: translation?.role ?? artist.role,
    localizedShortNote: translation?.shortNote ?? artist.shortNote,
    localizedBiography: translation?.biography ?? artist.biography,
    localizedTier: dictionary.tierLabels[artist.tier],
    localizedStatus: dictionary.filters.statuses[artist.status],
    localizedDistrict: dictionary.filters.districts[artist.district],
    localizedStats: artist.stats.map((stat) => ({
      label: dictionary.statsLabels[stat.label as keyof Dictionary["statsLabels"]] ?? stat.label,
      value: stat.value,
    })),
    localizedSchedule: artist.schedule.map((item) => ({
      day: dictionary.weekdayAbbrev[item.day as keyof Dictionary["weekdayAbbrev"]] ?? item.day,
      date: item.date,
      state:
        dictionary.scheduleDayStates[item.state as keyof Dictionary["scheduleDayStates"]] ??
        item.state,
    })),
    localizedLanguages: artist.languages.map(
      (language) => dictionary.languageNames[language as keyof Dictionary["languageNames"]] ?? language,
    ),
    localizedDisciplines: artist.disciplines.map(
      (discipline) => dictionary.disciplineNames[discipline] ?? discipline,
    ),
  };
}
