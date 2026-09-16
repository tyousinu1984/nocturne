// Shared "what day is it in Tokyo" helper. Attendance is keyed by
// service_date in Asia/Tokyo local time (see db/schema.ts) regardless of
// what timezone the server process itself happens to run in — plain
// `new Date()` local-time math would disagree with this near midnight JST
// on a non-JST server. Both the admin attendance panel/dashboard and the
// homepage's "today's availability" need the exact same definition of
// "today" — import from here instead of reimplementing it.

export function todayInTokyo(): string {
  return formatTokyoDate(new Date());
}

// `date` is a YYYY-MM-DD string already anchored to Tokyo's calendar.
// Anchoring the arithmetic at UTC noon (well clear of any day boundary)
// before re-formatting through the Asia/Tokyo timezone keeps this exact
// regardless of how many days are added/subtracted.
export function addDaysTokyo(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day, 12));
  base.setUTCDate(base.getUTCDate() + days);
  return formatTokyoDate(base);
}

function formatTokyoDate(when: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(when);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
