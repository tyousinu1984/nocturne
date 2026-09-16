import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMergedArtists } from "../model-data";
import { listPublicAttendance } from "../admin/attendance-store";
import { listAnnouncements } from "../admin/announcement-store";
import { todayInTokyo } from "../admin/tokyo-date";
import { HomeExperience, type HomeNewsItem, type TodayAvailabilityEntry } from "../nocturne";
import { getDictionary } from "../../i18n/get-dictionary";
import { isSupportedLocale, type Locale } from "../../i18n/locales";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isSupportedLocale(rawLocale)) return {};
  const dictionary = await getDictionary(rawLocale as Locale);
  return {
    title: dictionary.meta.homeTitle,
    description: dictionary.meta.homeDescription,
  };
}

function localizedAnnouncementText(
  announcement: { titleEn: string; titleJa: string; titleZh: string; bodyEn: string; bodyJa: string; bodyZh: string },
  locale: Locale,
) {
  if (locale === "ja") return { title: announcement.titleJa, body: announcement.bodyJa };
  if (locale === "zh") return { title: announcement.titleZh, body: announcement.bodyZh };
  return { title: announcement.titleEn, body: announcement.bodyEn };
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const artists = await getMergedArtists(locale);

  const today = todayInTokyo();
  const perArtist = await Promise.all(
    artists.map(async (artist) => {
      try {
        const projection = await listPublicAttendance(artist.slug);
        const todayEntry = projection.entries.find((entry) => entry.serviceDate === today);
        return todayEntry
          ? { artist, startTime: todayEntry.startTime, endTime: todayEntry.endTime }
          : null;
      } catch {
        return null;
      }
    }),
  );
  const todayAvailability: TodayAvailabilityEntry[] = perArtist.filter((entry) => entry !== null);

  let announcementRecords: Awaited<ReturnType<typeof listAnnouncements>> = [];
  try {
    announcementRecords = await listAnnouncements(5);
  } catch {
    // Falls back to an empty news list — matches the fail-open pattern
    // used elsewhere on this page for attendance lookups.
  }
  const news: HomeNewsItem[] = announcementRecords.map((announcement) => ({
    id: announcement.id,
    date: announcement.date,
    ...localizedAnnouncementText(announcement, locale),
  }));

  return <HomeExperience todayAvailability={todayAvailability} news={news} />;
}
