"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "../../i18n/context";
import { announcementSavedNotice } from "../../i18n/messages";
import type { AnnouncementRecord, SaveAnnouncementInput } from "./announcement-store";

const emptyForm: SaveAnnouncementInput = {
  date: "",
  titleEn: "",
  titleJa: "",
  titleZh: "",
  bodyEn: "",
  bodyJa: "",
  bodyZh: "",
};
const LANGS = ["En", "Ja", "Zh"] as const;

export function AnnouncementPanel({
  onNotice,
}: {
  onNotice: (label: string, message: string) => void;
}) {
  const { locale, dictionary } = useTranslations();
  const announcementsText = dictionary.admin.announcements;
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SaveAnnouncementInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/announcements", {
        headers: { accept: "application/json" },
      });
      const body = (await response.json()) as { announcements?: AnnouncementRecord[]; error?: string };
      if (!response.ok || !body.announcements) throw new Error(body.error ?? announcementsText.loadFailedFallback);
      setAnnouncements(body.announcements);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : announcementsText.loadFailedFallback;
      setError(message);
      onNotice(announcementsText.loadFailedLabel, message);
    } finally {
      setLoading(false);
    }
  }, [onNotice, announcementsText.loadFailedFallback, announcementsText.loadFailedLabel]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function startNew() {
    setEditingId("new");
    setForm(emptyForm);
  }

  function startEdit(record: AnnouncementRecord) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = record;
    setEditingId(record.id);
    setForm(rest);
  }

  function updateField<K extends keyof SaveAnnouncementInput>(key: K, value: SaveAnnouncementInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const isNew = editingId === "new";
      const response = await fetch("/api/admin/announcements", {
        method: isNew ? "POST" : "PATCH",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(isNew ? form : { id: editingId, ...form }),
      });
      const body = (await response.json()) as { announcement?: AnnouncementRecord; error?: string };
      if (!response.ok || !body.announcement) throw new Error(body.error ?? announcementsText.saveFailedFallback);
      setAnnouncements((current) => {
        if (isNew) return [body.announcement!, ...current];
        return current.map((item) => (item.id === body.announcement!.id ? body.announcement! : item));
      });
      onNotice(announcementsText.savedLabel, announcementSavedNotice(locale, body.announcement.titleEn));
      setEditingId(null);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : announcementsText.saveFailedFallback;
      setError(message);
      onNotice(announcementsText.saveFailedLabel, message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/announcements?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { accept: "application/json" },
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) throw new Error(body.error ?? announcementsText.deleteFailedFallback);
      setAnnouncements((current) => current.filter((item) => item.id !== id));
      onNotice(announcementsText.deletedLabel, announcementsText.deletedNotice);
      if (editingId === id) setEditingId(null);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : announcementsText.deleteFailedFallback;
      setError(message);
      onNotice(announcementsText.deleteFailedLabel, message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ops-access">
      <div className="ops-panel-heading">
        <span>{announcementsText.eyebrow}</span>
        <h2>{announcementsText.title}</h2>
        <em>
          {announcements.length} {announcementsText.itemsSuffix}
        </em>
      </div>

      {error && (
        <div className="ops-attendance-error">
          <b>{announcementsText.errorTitle}</b>
          <p>{error}</p>
          <button type="button" onClick={load}>
            {announcementsText.retryLoad}
          </button>
        </div>
      )}

      <div className="ops-editor-actions">
        <button type="button" onClick={startNew}>
          {announcementsText.newAnnouncement}
        </button>
      </div>

      {editingId ? (
        <div className="ops-editor-panel">
          <div className="ops-form-grid">
            <label>
              <span>{announcementsText.dateLabel}</span>
              <input value={form.date} onChange={(event) => updateField("date", event.target.value)} />
            </label>
            {LANGS.map((lang) => (
              <label className="is-wide" key={`title${lang}`}>
                <span>
                  {announcementsText.titleLabel} ({lang})
                </span>
                <input
                  value={form[`title${lang}`]}
                  onChange={(event) => updateField(`title${lang}`, event.target.value)}
                />
              </label>
            ))}
            {LANGS.map((lang) => (
              <label className="is-wide" key={`body${lang}`}>
                <span>
                  {announcementsText.bodyLabel} ({lang})
                </span>
                <textarea
                  rows={3}
                  value={form[`body${lang}`]}
                  onChange={(event) => updateField(`body${lang}`, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="ops-editor-actions">
            <button type="button" disabled={saving} onClick={save}>
              {saving ? announcementsText.saving : announcementsText.save}
            </button>
            <button type="button" className="is-secondary" onClick={() => setEditingId(null)}>
              {announcementsText.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="ops-attendance-empty">{announcementsText.loadingAnnouncements}</p>
      ) : (
        <div className="ops-account-grid">
          {announcements.map((announcement) => (
            <article key={announcement.id}>
              <div className="ops-account-title">
                <span>{announcement.date}</span>
                <h3>{announcement.titleEn}</h3>
              </div>
              <p>{announcement.bodyEn}</p>
              <div className="ops-account-actions">
                <button type="button" onClick={() => startEdit(announcement)}>
                  {announcementsText.edit}
                </button>
                <button
                  type="button"
                  className="is-danger"
                  disabled={saving}
                  onClick={() => remove(announcement.id)}
                >
                  {announcementsText.delete}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
