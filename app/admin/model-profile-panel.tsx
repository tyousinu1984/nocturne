"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "../../i18n/context";
import { modelProfileSavedNotice } from "../../i18n/messages";
import type { ModelProfileRecord, UpsertModelProfileInput } from "./model-profile-store";

const TIERS: UpsertModelProfileInput["tier"][] = ["Muse", "Signature", "New"];
const DISTRICTS: UpsertModelProfileInput["district"][] = ["Aoyama", "Ginza", "Daikanyama"];
const STATUSES: UpsertModelProfileInput["status"][] = ["Tonight", "This week", "Private"];
const LANGS = ["En", "Ja", "Zh"] as const;

function toFormState(record: ModelProfileRecord): UpsertModelProfileInput {
  const { updatedAt: _updatedAt, ...rest } = record;
  return rest;
}

export function ModelProfilePanel({
  onNotice,
}: {
  onNotice: (label: string, message: string) => void;
}) {
  const { locale, dictionary } = useTranslations();
  const models = dictionary.admin.models;
  const [profiles, setProfiles] = useState<ModelProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [form, setForm] = useState<UpsertModelProfileInput | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/model-profiles", {
        headers: { accept: "application/json" },
      });
      const body = (await response.json()) as { profiles?: ModelProfileRecord[]; error?: string };
      if (!response.ok || !body.profiles) throw new Error(body.error ?? models.loadFailedFallback);
      setProfiles(body.profiles);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : models.loadFailedFallback;
      setError(message);
      onNotice(models.loadFailedLabel, message);
    } finally {
      setLoading(false);
    }
  }, [onNotice, models.loadFailedFallback, models.loadFailedLabel]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function selectProfile(record: ModelProfileRecord) {
    setSelectedSlug(record.slug);
    setForm(toFormState(record));
  }

  function updateField<K extends keyof UpsertModelProfileInput>(key: K, value: UpsertModelProfileInput[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/model-profiles", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as { profile?: ModelProfileRecord; error?: string };
      if (!response.ok || !body.profile) throw new Error(body.error ?? models.saveFailedFallback);
      setProfiles((current) =>
        current.map((item) => (item.slug === body.profile!.slug ? body.profile! : item)),
      );
      onNotice(models.savedLabel, modelProfileSavedNotice(locale, body.profile.name));
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : models.saveFailedFallback;
      setError(message);
      onNotice(models.saveFailedLabel, message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ops-access">
      <div className="ops-panel-heading">
        <span>{models.eyebrow}</span>
        <h2>{models.title}</h2>
        <em>
          {profiles.length} {models.itemsSuffix}
        </em>
      </div>

      {error && (
        <div className="ops-attendance-error">
          <b>{models.errorTitle}</b>
          <p>{error}</p>
          <button type="button" onClick={load}>
            {models.retryLoad}
          </button>
        </div>
      )}

      {loading ? (
        <p className="ops-attendance-empty">{models.loadingModels}</p>
      ) : (
        <div className="ops-model-layout">
          <div className="ops-model-list">
            {profiles.map((profile) => (
              <button
                type="button"
                key={profile.slug}
                className={selectedSlug === profile.slug ? "is-active" : ""}
                onClick={() => selectProfile(profile)}
              >
                <b>{profile.name}</b>
                <small>{profile.slug}</small>
              </button>
            ))}
          </div>

          {form ? (
            <div className="ops-editor-panel">
              <div className="ops-form-grid">
                <label>
                  <span>{models.nameLabel}</span>
                  <input value={form.name} onChange={(event) => updateField("name", event.target.value)} />
                </label>
                <label>
                  <span>{models.tierLabel}</span>
                  <select value={form.tier} onChange={(event) => updateField("tier", event.target.value as UpsertModelProfileInput["tier"])}>
                    {TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {dictionary.tierLabels[tier]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{models.districtLabel}</span>
                  <select
                    value={form.district}
                    onChange={(event) => updateField("district", event.target.value as UpsertModelProfileInput["district"])}
                  >
                    {DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {dictionary.filters.districts[district]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{models.statusLabel}</span>
                  <select
                    value={form.status}
                    onChange={(event) => updateField("status", event.target.value as UpsertModelProfileInput["status"])}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {dictionary.filters.statuses[status]}
                      </option>
                    ))}
                  </select>
                </label>

                {LANGS.map((lang) => (
                  <label className="is-wide" key={`role${lang}`}>
                    <span>
                      {models.roleLabel} ({lang})
                    </span>
                    <input
                      value={form[`role${lang}`]}
                      onChange={(event) => updateField(`role${lang}`, event.target.value)}
                    />
                  </label>
                ))}
                {LANGS.map((lang) => (
                  <label className="is-wide" key={`shortNote${lang}`}>
                    <span>
                      {models.shortNoteLabel} ({lang})
                    </span>
                    <input
                      value={form[`shortNote${lang}`]}
                      onChange={(event) => updateField(`shortNote${lang}`, event.target.value)}
                    />
                  </label>
                ))}
                {LANGS.map((lang) => (
                  <label className="is-wide" key={`biography${lang}`}>
                    <span>
                      {models.biographyLabel} ({lang})
                    </span>
                    <textarea
                      rows={3}
                      value={form[`biography${lang}`]}
                      onChange={(event) => updateField(`biography${lang}`, event.target.value)}
                    />
                  </label>
                ))}
              </div>
              <div className="ops-editor-actions">
                <button type="button" disabled={saving} onClick={save}>
                  {saving ? models.saving : models.save}
                </button>
              </div>
            </div>
          ) : (
            <p className="ops-attendance-empty">{models.selectPrompt}</p>
          )}
        </div>
      )}
    </section>
  );
}
