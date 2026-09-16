import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMergedArtists } from "../../model-data";
import { listPublicAttendance } from "../../admin/attendance-store";
import { ScheduleExperience, type ScheduleDay, type ScheduleDayEntry } from "../../nocturne";
import { getDictionary } from "../../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../../i18n/locales";

// Public URL: /:locale/schedule.html (see next.config.ts's rewrites).
//
// Reuses listPublicAttendance() from app/admin/attendance-store.ts — the
// same published-only projection the per-profile schedule already reads —
// fanned out over every artist server-side, then grouped by calendar date
// into the current Monday–Sunday week. This is a straightforward overview;
// the deeper rework of what "schedule" means for exhibition dispatch (see
// the project plan's Phase 3) still hasn't happened yet.
type SchedulePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: SchedulePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return {
    title: dictionary.meta.scheduleTitle,
    description: dictionary.meta.scheduleDescription,
  };
}

const DAY_KEYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

function toServiceDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentWeekDates() {
  const now = new Date();
  // getDay(): 0 = Sunday .. 6 = Saturday. Convert to a Monday-first offset.
  const isoWeekday = (now.getDay() + 6) % 7; // 0 = Monday .. 6 = Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - isoWeekday);

  return DAY_KEYS.map((dayKey, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { dayKey, date: toServiceDate(date) };
  });
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const week = currentWeekDates();
  const artists = await getMergedArtists(locale);
  const perArtistEntries = await Promise.all(
    artists.map(async (artist) => {
      try {
        const projection = await listPublicAttendance(artist.slug);
        return { artist, entries: projection.entries };
      } catch {
        return { artist, entries: [] as Array<{ serviceDate: string; startTime: string; endTime: string }> };
      }
    }),
  );

  const scheduleWeek: ScheduleDay[] = week.map(({ dayKey, date }) => {
    const entries: ScheduleDayEntry[] = [];
    for (const { artist, entries: artistEntries } of perArtistEntries) {
      const match = artistEntries.find((entry) => entry.serviceDate === date);
      if (match) entries.push({ artist, startTime: match.startTime, endTime: match.endTime });
    }
    entries.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return { date, dayKey, entries };
  });

  const today = toServiceDate(new Date());
  const initialDayIndex = Math.max(
    0,
    scheduleWeek.findIndex((day) => day.date === today),
  );

  return <ScheduleExperience week={scheduleWeek} initialDayIndex={initialDayIndex} />;
}
