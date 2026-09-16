"use client";

import { useCallback, useEffect, useState } from "react";
import { artists } from "../data";
import { useTranslations } from "../../i18n/context";
import { scheduleDateLabel } from "../../i18n/messages";

type DashboardDayEntry = {
  artistSlug: string;
  startTime: string;
  endTime: string;
  status: "draft" | "pending" | "approved" | "published";
};

type DashboardData = {
  week: Array<{ date: string; entries: DashboardDayEntry[] }>;
  pendingInquiries: number;
  pendingApplications: number;
};

const WEEKDAY_KEYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function weekdayKeyFor(date: string): (typeof WEEKDAY_KEYS)[number] {
  const [year, month, day] = date.split("-").map(Number);
  return WEEKDAY_KEYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

function artistName(slug: string) {
  return artists.find((artist) => artist.slug === slug)?.name ?? slug;
}

export function DashboardPanel() {
  const { locale, dictionary } = useTranslations();
  const dashboard = dictionary.admin.dashboard;
  const statusLabels = dictionary.admin.attendance.statusLabels;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/dashboard", {
        headers: { accept: "application/json" },
      });
      const body = (await response.json()) as DashboardData & { error?: string };
      if (!response.ok) throw new Error(body.error ?? dashboard.loadFailed);
      setData(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : dashboard.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [dashboard.loadFailed]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="ops-access">
      <div className="ops-panel-heading">
        <span>{dashboard.eyebrow}</span>
        <h2>{dashboard.title}</h2>
      </div>

      {error && (
        <div className="ops-attendance-error">
          <b>{dashboard.loadFailed}</b>
          <p>{error}</p>
          <button type="button" onClick={load}>{dashboard.retryLoad}</button>
        </div>
      )}

      {loading ? (
        <p className="ops-attendance-empty">{dashboard.loadingDashboard}</p>
      ) : data ? (
        <>
          <div className="ops-dashboard-stats">
            <article>
              <b>{data.pendingInquiries}</b>
              <span>{dashboard.pendingInquiriesLabel}</span>
            </article>
            <article>
              <b>{data.pendingApplications}</b>
              <span>{dashboard.pendingApplicationsLabel}</span>
            </article>
          </div>

          <div className="ops-dashboard-week-heading">
            <span>{dashboard.weekHeading}</span>
          </div>
          <div className="ops-dashboard-week">
            {data.week.map((day) => (
              <div className="ops-dashboard-day" key={day.date}>
                <h3>{scheduleDateLabel(locale, day.date, dictionary.weekdayAbbrev[weekdayKeyFor(day.date)])}</h3>
                {day.entries.length === 0 ? (
                  <p className="ops-dashboard-day-empty">{dashboard.emptyDay}</p>
                ) : (
                  <ul>
                    {day.entries.map((entry, index) => (
                      <li key={`${entry.artistSlug}-${index}`} className={`is-${entry.status}`}>
                        <b>{artistName(entry.artistSlug)}</b>
                        <small>{entry.startTime}–{entry.endTime}</small>
                        <em>{statusLabels[entry.status]}</em>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
