"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { artists } from "../data";
import { useTranslations } from "../../i18n/context";
import { newDraftNotice, scheduleDateLabel } from "../../i18n/messages";
import type { Dictionary } from "../../i18n/dictionary-types";
import {
  type AttendanceAction,
  type AttendanceEntryRecord,
  type AttendanceEventRecord,
  type AttendanceStatus,
} from "./attendance-domain";
import {
  attendanceFailureKind,
  attendanceFormFromEntry,
  attendancePreview,
  replaceAttendanceEntry,
} from "./attendance-editor-state";
import { addDaysTokyo, todayInTokyo } from "./tokyo-date";

type AttendancePanelProps = {
  actorKind: "admin" | "cast";
  endpoint: string;
  identity: {
    displayName: string;
    identityLabel: string;
    artistSlug?: string;
    artistName?: string;
  };
  onNotice: (label: string, message: string) => void;
  onAuthenticationLost?: () => void;
};

type AttendanceApiData = {
  entries: AttendanceEntryRecord[];
  events: AttendanceEventRecord[];
};

type AttendanceCommandResponse = {
  entry: AttendanceEntryRecord;
  event: AttendanceEventRecord;
  idempotent: boolean;
};

type AttendanceLoadState =
  | "loading"
  | "ready"
  | "auth_required"
  | "forbidden"
  | "storage_unavailable"
  | "service_error";

const statusStep: Record<AttendanceStatus, number> = {
  draft: 1,
  pending: 2,
  approved: 3,
  published: 4,
  rejected: 2,
  cancelled: 4,
};

function defaultTokyoDate() {
  return addDaysTokyo(todayInTokyo(), 1);
}

function commandKey(action: string) {
  return `attendance:${action}:${crypto.randomUUID()}`;
}

const WEEKDAY_KEYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

// `date` is a Tokyo-calendar "YYYY-MM-DD" string (see tokyo-date.ts) — the
// UTC-noon anchor here is only to safely derive the day-of-week, not a
// real point in time, so plain Date math is fine.
function weekdayKeyFor(date: string): (typeof WEEKDAY_KEYS)[number] {
  const [year, month, day] = date.split("-").map(Number);
  return WEEKDAY_KEYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

type WeekRow = { date: string; checked: boolean; startTime: string; endTime: string };
type WeekResult = { date: string; ok: boolean; message: string };

function eventDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value.replace(" ", "T")}Z`);
  }
  return new Date(value);
}

function artistName(slug: string) {
  return artists.find((artist) => artist.slug === slug)?.name ?? slug;
}

function eventActionLabel(event: AttendanceEventRecord, attendance: Dictionary["admin"]["attendance"]) {
  if (
    event.action === "save_draft" &&
    !event.actorUserId.startsWith("cast:")
  ) {
    return attendance.adminUpdateLabel;
  }
  return attendance.actionLabels[event.action];
}

export function AttendancePanel({
  actorKind,
  endpoint,
  identity,
  onNotice,
  onAuthenticationLost,
}: AttendancePanelProps) {
  const { locale, dictionary } = useTranslations();
  const attendance = dictionary.admin.attendance;
  const statusLabels = attendance.statusLabels;
  const [entries, setEntries] = useState<AttendanceEntryRecord[]>([]);
  const [events, setEvents] = useState<AttendanceEventRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftArtistSlug, setDraftArtistSlug] = useState(
    () => identity.artistSlug ?? artists[0]?.slug ?? "",
  );
  const [serviceDate, setServiceDate] = useState(defaultTokyoDate);
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("23:30");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [loadState, setLoadState] = useState<AttendanceLoadState>("loading");
  const [busyAction, setBusyAction] = useState<AttendanceAction | "quick_publish" | null>(null);
  const [loadError, setLoadError] = useState("");
  const [commandError, setCommandError] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [createMode, setCreateMode] = useState<"single" | "week">("single");
  const [weekStart, setWeekStart] = useState(defaultTokyoDate);
  const [weekRows, setWeekRows] = useState<WeekRow[]>([]);
  const [weekAutoPublish, setWeekAutoPublish] = useState(true);
  const [weekBusy, setWeekBusy] = useState(false);
  const [weekResults, setWeekResults] = useState<WeekResult[]>([]);

  useEffect(() => {
    setWeekRows(
      Array.from({ length: 7 }, (_, index) => ({
        date: addDaysTokyo(weekStart, index),
        checked: false,
        startTime,
        endTime,
      })),
    );
    setWeekResults([]);
    // startTime/endTime intentionally excluded — they only seed each row's
    // initial value; after that, rows are edited independently or bulk-set
    // via the "apply to checked" button so per-row edits aren't clobbered
    // every time the shared defaults change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const visibleEntries = useMemo(
    () => (artistFilter ? entries.filter((entry) => entry.artistSlug === artistFilter) : entries),
    [entries, artistFilter],
  );
  const showWeeklyForm = actorKind === "admin" && !selectedId && createMode === "week";

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) ?? null,
    [entries, selectedId],
  );
  const selectedEvents = useMemo(
    () =>
      selectedEntry
        ? events.filter((event) => event.attendanceId === selectedEntry.id)
        : [],
    [events, selectedEntry],
  );
  const selectedArtistSlug =
    selectedEntry?.artistSlug ?? identity.artistSlug ?? draftArtistSlug;
  const selectedArtistName =
    identity.artistName ?? artistName(selectedArtistSlug || "cast");
  const castCanEdit =
    actorKind === "cast" &&
    (!selectedEntry || selectedEntry.status === "draft") &&
    Boolean(identity.artistSlug);
  const adminCanEdit =
    actorKind === "admin" &&
    (!selectedEntry ||
      (selectedEntry.status !== "rejected" &&
        selectedEntry.status !== "cancelled"));
  const editorCanEdit = castCanEdit || adminCanEdit;
  const interactionLocked = loadState !== "ready" || busyAction !== null;
  const activeStep = selectedEntry ? statusStep[selectedEntry.status] : 0;
  const preview =
    loadState === "ready"
      ? attendancePreview(selectedEntry, { serviceDate, startTime, endTime })
      : {
          kind: "unavailable" as const,
          dateLabel: attendance.checkingProjection,
          timeLabel: attendance.loadingService,
          statusLabel: attendance.checking,
        };

  const selectEntry = useCallback((entry: AttendanceEntryRecord) => {
    const fields = attendanceFormFromEntry(entry);
    setSelectedId(entry.id);
    setDraftArtistSlug(entry.artistSlug);
    setServiceDate(fields.serviceDate);
    setStartTime(fields.startTime);
    setEndTime(fields.endTime);
    setNote(fields.note);
    setReason(fields.reason);
  }, []);

  const applyAttendanceData = useCallback(
    (body: AttendanceApiData) => {
      setEntries(body.entries);
      setEvents(body.events);
      if (body.entries[0]) selectEntry(body.entries[0]);
      else setSelectedId(null);
    },
    [selectEntry],
  );

  const handleLoadFailure = useCallback(
    (status: number, code: string | undefined, message: string) => {
      const failureKind = attendanceFailureKind(status, code);
      const nextState: AttendanceLoadState =
        failureKind === "auth_required" ||
        failureKind === "forbidden" ||
        failureKind === "storage_unavailable"
          ? failureKind
          : "service_error";
      setLoadState(nextState);
      setLoadError(message);
      onNotice(attendance.attendanceAccessLabel, message);
      if (nextState === "auth_required") onAuthenticationLost?.();
    },
    [onAuthenticationLost, onNotice, attendance.attendanceAccessLabel],
  );

  const loadAttendance = useCallback(async () => {
    setLoadState("loading");
    setLoadError("");
    try {
      const response = await fetch(endpoint, {
        headers: { accept: "application/json" },
      });
      const body = (await response.json()) as AttendanceApiData & {
        error?: string;
        code?: string;
      };
      if (!response.ok) {
        handleLoadFailure(
          response.status,
          body.code,
          body.error ?? attendance.attendanceCouldNotLoad,
        );
        return;
      }
      applyAttendanceData(body);
      setCommandError("");
      setLoadState("ready");
    } catch (error) {
      handleLoadFailure(
        0,
        undefined,
        error instanceof Error ? error.message : attendance.attendanceCouldNotLoad,
      );
    }
  }, [applyAttendanceData, endpoint, handleLoadFailure, attendance.attendanceCouldNotLoad]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAttendance(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAttendance]);

  function startNewDraft() {
    setSelectedId(null);
    setServiceDate(defaultTokyoDate());
    setStartTime("20:00");
    setEndTime("23:30");
    setNote("");
    setReason("");
    setCommandError("");
    onNotice(attendance.newAttendanceNotice, newDraftNotice(locale, selectedArtistName));
  }

  async function runCommand(action: AttendanceAction | "quick_publish") {
    if (loadState !== "ready") return;
    if (action === "quick_publish" && !selectedEntry) return;
    setBusyAction(action);
    setCommandError("");
    const payload: Record<string, unknown> =
      action === "quick_publish"
        ? { action, attendanceId: selectedEntry!.id, expectedVersion: selectedEntry!.version }
        : {
            action,
            artistSlug: selectedArtistSlug,
            serviceDate,
            startTime,
            endTime,
            note,
            reason,
          };
    if (selectedEntry && action !== "create" && action !== "quick_publish") {
      payload.attendanceId = selectedEntry.id;
      payload.expectedVersion = selectedEntry.version;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "idempotency-key": commandKey(action),
        },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as AttendanceCommandResponse & {
        error?: string;
        code?: string;
        currentEntry?: AttendanceEntryRecord;
      };
      if (!response.ok) {
        const message = body.error ?? attendance.attendanceCommandFailed;
        const failureKind = attendanceFailureKind(response.status, body.code);
        if (failureKind !== "command_error") {
          handleLoadFailure(response.status, body.code, message);
          return;
        }
        if (body.currentEntry) {
          setEntries((current) => replaceAttendanceEntry(current, body.currentEntry!));
          selectEntry(body.currentEntry);
        }
        throw new Error(message);
      }

      setEntries((current) => {
        const remaining = current.filter((entry) => entry.id !== body.entry.id);
        return [...remaining, body.entry].sort((left, right) =>
          `${left.serviceDate}-${left.startTime}`.localeCompare(
            `${right.serviceDate}-${right.startTime}`,
          ),
        );
      });
      setEvents((current) => [
        body.event,
        ...current.filter((event) => event.id !== body.event.id),
      ]);
      selectEntry(body.entry);
      setReason("");
      setLoadState("ready");
      onNotice(statusLabels[body.entry.status], body.event.detail);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : attendance.attendanceCommandFailed;
      setCommandError(message);
      onNotice(attendance.commandBlocked, message);
    } finally {
      setBusyAction(null);
    }
  }

  function toggleWeekRow(date: string) {
    setWeekRows((rows) =>
      rows.map((row) => (row.date === date ? { ...row, checked: !row.checked } : row)),
    );
  }

  function updateWeekRowTime(date: string, field: "startTime" | "endTime", value: string) {
    setWeekRows((rows) =>
      rows.map((row) => (row.date === date ? { ...row, [field]: value } : row)),
    );
  }

  function applyTimeToCheckedRows() {
    setWeekRows((rows) => rows.map((row) => (row.checked ? { ...row, startTime, endTime } : row)));
  }

  // Creates one entry per checked day, sequentially (not in parallel, so a
  // schedule conflict on one day can't race with another day's insert),
  // optionally chaining a quick-publish per day. Each day's outcome is
  // tracked independently — one failure doesn't roll back or block the
  // rest (see the plan: this is deliberately not all-or-nothing).
  async function runWeeklyCreate() {
    const checkedRows = weekRows.filter((row) => row.checked);
    if (checkedRows.length === 0 || loadState !== "ready") return;
    setWeekBusy(true);
    setWeekResults([]);
    const results: WeekResult[] = [];

    for (const row of checkedRows) {
      try {
        const createResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "idempotency-key": commandKey(`week-create-${row.date}`),
          },
          body: JSON.stringify({
            action: "create",
            artistSlug: draftArtistSlug,
            serviceDate: row.date,
            startTime: row.startTime,
            endTime: row.endTime,
            note,
          }),
        });
        const createBody = (await createResponse.json()) as AttendanceCommandResponse & {
          error?: string;
        };
        if (!createResponse.ok) {
          results.push({ date: row.date, ok: false, message: createBody.error ?? attendance.attendanceCommandFailed });
          continue;
        }
        setEntries((current) => replaceAttendanceEntry(current, createBody.entry));
        setEvents((current) => [createBody.event, ...current.filter((event) => event.id !== createBody.event.id)]);

        if (!weekAutoPublish) {
          results.push({ date: row.date, ok: true, message: attendance.weekDayCreatedOnly });
          continue;
        }

        const publishResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "idempotency-key": commandKey(`week-publish-${row.date}`),
          },
          body: JSON.stringify({
            action: "quick_publish",
            attendanceId: createBody.entry.id,
            expectedVersion: createBody.entry.version,
          }),
        });
        const publishBody = (await publishResponse.json()) as AttendanceCommandResponse & {
          error?: string;
        };
        if (!publishResponse.ok) {
          results.push({ date: row.date, ok: false, message: publishBody.error ?? attendance.attendanceCommandFailed });
          continue;
        }
        setEntries((current) => replaceAttendanceEntry(current, publishBody.entry));
        setEvents((current) => [publishBody.event, ...current.filter((event) => event.id !== publishBody.event.id)]);
        results.push({ date: row.date, ok: true, message: attendance.weekDayPublished });
      } catch (error) {
        results.push({
          date: row.date,
          ok: false,
          message: error instanceof Error ? error.message : attendance.attendanceCommandFailed,
        });
      }
    }

    setWeekResults(results);
    setWeekBusy(false);
    const succeeded = results.filter((result) => result.ok).length;
    onNotice(attendance.weekResultsHeading, `${succeeded}/${results.length}`);
    await loadAttendance();
  }

  const counts = {
    drafts: entries.filter((entry) => entry.status === "draft").length,
    pending: entries.filter((entry) => entry.status === "pending").length,
    approved: entries.filter((entry) => entry.status === "approved").length,
    public: entries.filter((entry) => entry.status === "published").length,
  };

  return (
    <section className="ops-attendance" aria-busy={loadState === "loading"}>
      <div className="ops-attendance-summary">
        <article><b>{counts.drafts}</b><span>{attendance.summary.drafts}</span><p>{attendance.summary.draftsNote}</p></article>
        <article className={counts.pending ? "is-alert" : ""}><b>{counts.pending}</b><span>{attendance.summary.waitingReview}</span><p>{attendance.summary.waitingReviewNote}</p></article>
        <article><b>{counts.approved}</b><span>{attendance.summary.approved}</span><p>{attendance.summary.approvedNote}</p></article>
        <article><b>{counts.public}</b><span>{attendance.summary.public}</span><p>{attendance.summary.publicNote}</p></article>
      </div>

      <div className="ops-attendance-grid">
        <section className="ops-attendance-editor">
          <div className="ops-panel-heading">
            <span>{actorKind === "cast" ? attendance.myAttendance : attendance.attendanceControl}</span>
            <h2>{selectedEntry ? artistName(selectedEntry.artistSlug) : selectedArtistName}</h2>
            <em>
              {selectedEntry
                ? `V${selectedEntry.version} / ${statusLabels[selectedEntry.status]}`
                : attendance.newDraft}
            </em>
          </div>

          <div className="ops-identity-strip">
            <div>
              <span>{actorKind === "cast" ? attendance.signedInCast : attendance.authorizedOperator}</span>
              <b>{identity.displayName}</b>
            </div>
            <small>{identity.identityLabel}</small>
          </div>

          <ol className="ops-attendance-steps" aria-label="Attendance workflow">
            {[attendance.stepDraft, attendance.stepReview, attendance.stepApproved, attendance.stepPublic].map((label, index) => (
              <li className={activeStep >= index + 1 ? "is-complete" : ""} key={label}>
                <b>0{index + 1}</b><span>{label}</span>
              </li>
            ))}
          </ol>

          {actorKind === "admin" && !selectedEntry && (
            <div className="ops-attendance-mode-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={createMode === "single"}
                className={createMode === "single" ? "is-active" : ""}
                onClick={() => setCreateMode("single")}
              >
                {attendance.createModeSingle}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={createMode === "week"}
                className={createMode === "week" ? "is-active" : ""}
                onClick={() => setCreateMode("week")}
              >
                {attendance.createModeWeek}
              </button>
            </div>
          )}

          {!showWeeklyForm && (
          <div className="ops-form-grid ops-attendance-form">
            <label>
              <span>{attendance.castProfileLabel}</span>
              {actorKind === "admin" && !selectedEntry ? (
                <select
                  aria-label="Cast profile"
                  value={draftArtistSlug}
                  disabled={interactionLocked}
                  onChange={(event) => setDraftArtistSlug(event.target.value)}
                >
                  {artists.map((artist) => (
                    <option key={artist.slug} value={artist.slug}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={selectedArtistName} disabled />
              )}
            </label>
            <label>
              <span>{attendance.serviceDateLabel}</span>
              <input type="date" value={serviceDate} disabled={!editorCanEdit || interactionLocked} onChange={(event) => setServiceDate(event.target.value)} />
            </label>
            <label>
              <span>{attendance.startTimeLabel}</span>
              <input type="time" value={startTime} disabled={!editorCanEdit || interactionLocked} onChange={(event) => setStartTime(event.target.value)} />
            </label>
            <label>
              <span>{attendance.endTimeLabel}</span>
              <input type="time" value={endTime} disabled={!editorCanEdit || interactionLocked} onChange={(event) => setEndTime(event.target.value)} />
            </label>
            <label className="is-wide">
              <span>{attendance.privateNoteLabel}</span>
              <textarea rows={3} maxLength={500} value={note} disabled={!editorCanEdit || interactionLocked} placeholder={attendance.privateNotePlaceholder} onChange={(event) => setNote(event.target.value)} />
            </label>
            {actorKind === "admin" && selectedEntry && (selectedEntry.status === "pending" || selectedEntry.status === "published") && (
              <label className="is-wide">
                <span>{selectedEntry.status === "pending" ? attendance.rejectionReasonLabel : attendance.cancellationReasonLabel}</span>
                <textarea rows={2} maxLength={500} value={reason} disabled={interactionLocked} placeholder={attendance.reasonPlaceholder} onChange={(event) => setReason(event.target.value)} />
              </label>
            )}
          </div>
          )}

          {showWeeklyForm && (
            <div className="ops-attendance-week-form">
              <div className="ops-form-grid">
                <label>
                  <span>{attendance.castProfileLabel}</span>
                  <select
                    aria-label="Cast profile"
                    value={draftArtistSlug}
                    disabled={weekBusy}
                    onChange={(event) => setDraftArtistSlug(event.target.value)}
                  >
                    {artists.map((artist) => (
                      <option key={artist.slug} value={artist.slug}>
                        {artist.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{attendance.weekStartLabel}</span>
                  <input type="date" value={weekStart} disabled={weekBusy} onChange={(event) => setWeekStart(event.target.value)} />
                </label>
                <label>
                  <span>{attendance.startTimeLabel}</span>
                  <input type="time" value={startTime} disabled={weekBusy} onChange={(event) => setStartTime(event.target.value)} />
                </label>
                <label>
                  <span>{attendance.endTimeLabel}</span>
                  <input type="time" value={endTime} disabled={weekBusy} onChange={(event) => setEndTime(event.target.value)} />
                </label>
              </div>
              <div className="ops-attendance-actions">
                <button type="button" className="is-ghost" disabled={weekBusy} onClick={applyTimeToCheckedRows}>
                  {attendance.applyTimeToChecked}
                </button>
              </div>

              <div className="ops-attendance-week-grid">
                {weekRows.map((row) => (
                  <label key={row.date} className={row.checked ? "is-checked" : ""}>
                    <input
                      type="checkbox"
                      checked={row.checked}
                      disabled={weekBusy}
                      onChange={() => toggleWeekRow(row.date)}
                    />
                    <span>{scheduleDateLabel(locale, row.date, dictionary.weekdayAbbrev[weekdayKeyFor(row.date)])}</span>
                    <input
                      type="time"
                      value={row.startTime}
                      disabled={weekBusy || !row.checked}
                      onChange={(event) => updateWeekRowTime(row.date, "startTime", event.target.value)}
                    />
                    <input
                      type="time"
                      value={row.endTime}
                      disabled={weekBusy || !row.checked}
                      onChange={(event) => updateWeekRowTime(row.date, "endTime", event.target.value)}
                    />
                  </label>
                ))}
              </div>

              <label className="ops-attendance-week-autopublish">
                <input
                  type="checkbox"
                  checked={weekAutoPublish}
                  disabled={weekBusy}
                  onChange={(event) => setWeekAutoPublish(event.target.checked)}
                />
                <span>{attendance.autoPublishAfterCreate}</span>
              </label>

              <div className="ops-attendance-actions">
                <button
                  type="button"
                  disabled={weekBusy || weekRows.every((row) => !row.checked)}
                  onClick={runWeeklyCreate}
                >
                  {weekBusy ? attendance.creatingWeek : attendance.createWeek}
                </button>
              </div>

              {weekResults.length > 0 && (
                <div className="ops-attendance-week-results">
                  <span>{attendance.weekResultsHeading}</span>
                  {weekResults.map((result) => (
                    <p key={result.date} className={result.ok ? "is-ok" : "is-error"}>
                      {result.date}: {result.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedEntry?.rejectionReason && (
            <div className="ops-attendance-error"><b>{attendance.reviewNote}</b><p>{selectedEntry.rejectionReason}</p></div>
          )}
          {(loadError || commandError) && (
            <div className="ops-attendance-error" role="alert">
              <b>{attendance.attentionRequired}</b><p>{loadError || commandError}</p>
              {loadState !== "auth_required" && <button type="button" onClick={loadAttendance}>{attendance.retryLoad}</button>}
            </div>
          )}

          <div className="ops-attendance-actions">
            {!selectedEntry && !showWeeklyForm && (
              <button type="button" disabled={interactionLocked} onClick={() => runCommand("create")}>{busyAction === "create" ? attendance.creating : attendance.createDraft}</button>
            )}
            {selectedEntry?.status === "draft" && (
              <>
                <button type="button" className="is-secondary" disabled={interactionLocked} onClick={() => runCommand("save_draft")}>{busyAction === "save_draft" ? attendance.saving : actorKind === "admin" ? attendance.saveChanges : attendance.saveDraft}</button>
                <button type="button" disabled={interactionLocked} onClick={() => runCommand("submit")}>{busyAction === "submit" ? attendance.submitting : attendance.submitForReview}</button>
                {actorKind === "admin" && (
                  <button type="button" className="is-ghost" disabled={interactionLocked} onClick={() => runCommand("quick_publish")}>{busyAction === "quick_publish" ? attendance.quickPublishing : attendance.quickPublish}</button>
                )}
              </>
            )}
            {actorKind === "admin" && selectedEntry?.status === "pending" && (
              <>
                <button type="button" className="is-ghost" disabled={interactionLocked} onClick={() => runCommand("save_draft")}>{busyAction === "save_draft" ? attendance.saving : attendance.saveChanges}</button>
                <button type="button" className="is-secondary" disabled={interactionLocked || !reason.trim()} onClick={() => runCommand("reject")}>{busyAction === "reject" ? attendance.rejecting : attendance.rejectWithNote}</button>
                <button type="button" disabled={interactionLocked} onClick={() => runCommand("approve")}>{busyAction === "approve" ? attendance.approving : attendance.approve}</button>
                <button type="button" className="is-ghost" disabled={interactionLocked} onClick={() => runCommand("quick_publish")}>{busyAction === "quick_publish" ? attendance.quickPublishing : attendance.quickPublish}</button>
              </>
            )}
            {actorKind === "admin" && selectedEntry?.status === "approved" && (
              <>
                <button type="button" className="is-secondary" disabled={interactionLocked} onClick={() => runCommand("save_draft")}>{busyAction === "save_draft" ? attendance.saving : attendance.saveChanges}</button>
                <button type="button" disabled={interactionLocked} onClick={() => runCommand("publish")}>{busyAction === "publish" ? attendance.publishing : attendance.publishToProfile}</button>
              </>
            )}
            {actorKind === "admin" && selectedEntry?.status === "published" && (
              <>
                <button type="button" className="is-secondary" disabled={interactionLocked} onClick={() => runCommand("save_draft")}>{busyAction === "save_draft" ? attendance.saving : attendance.saveLiveChanges}</button>
                <button type="button" className="is-danger" disabled={interactionLocked || !reason.trim()} onClick={() => runCommand("cancel")}>{busyAction === "cancel" ? attendance.cancelling : attendance.cancelPublicShift}</button>
              </>
            )}
            {(actorKind === "cast" || actorKind === "admin") && (
              <button type="button" className="is-ghost" disabled={interactionLocked} onClick={startNewDraft}>{attendance.newAttendance}</button>
            )}
          </div>
        </section>

        <aside className="ops-attendance-side">
          <section className="ops-attendance-preview">
            <span>{attendance.publicProjectionLabel}</span>
            <div className={`ops-attendance-preview-card${preview.kind === "removed" ? " is-removed" : preview.kind === "unavailable" ? " is-unavailable" : ""}`}>
              <small>{selectedArtistName.toUpperCase()} / {attendance.weeklyScheduleSuffix}</small>
              <b>{preview.dateLabel}</b><strong>{preview.timeLabel}</strong><em>{preview.statusLabel}</em>
            </div>
            <p>{attendance.publicProjectionNote}</p>
          </section>

          <section className="ops-attendance-records">
            <div className="ops-attendance-side-heading"><span>{actorKind === "cast" ? attendance.myRecords : attendance.allSchedules}</span><button type="button" disabled={interactionLocked} onClick={loadAttendance}>{attendance.refresh}</button></div>
            {actorKind === "admin" && (
              <div className="ops-attendance-roster" role="tablist" aria-label={attendance.rosterFilterLabel}>
                <button type="button" className={artistFilter === "" ? "is-active" : ""} onClick={() => setArtistFilter("")}>
                  {attendance.rosterAllLabel}<em>{entries.length}</em>
                </button>
                {artists.map((artist) => (
                  <button
                    type="button"
                    key={artist.slug}
                    className={artistFilter === artist.slug ? "is-active" : ""}
                    onClick={() => setArtistFilter(artist.slug)}
                  >
                    {artist.name}<em>{entries.filter((entry) => entry.artistSlug === artist.slug).length}</em>
                  </button>
                ))}
              </div>
            )}
            {loadState === "loading" ? (
              <p className="ops-attendance-empty">{attendance.loadingAttendance}</p>
            ) : visibleEntries.length === 0 ? (
              <p className="ops-attendance-empty">{artistFilter ? attendance.noRecordsForArtist : attendance.noRecordsYet}</p>
            ) : (
              <div className="ops-attendance-record-list">
                {visibleEntries.map((entry) => (
                  <button type="button" className={entry.id === selectedId ? "is-active" : ""} key={entry.id} onClick={() => selectEntry(entry)}>
                    <span>{statusLabels[entry.status]}</span><b>{artistName(entry.artistSlug)} / {entry.serviceDate}</b><small>{entry.startTime}–{entry.endTime} / V{entry.version}</small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="ops-attendance-timeline">
            <span>{attendance.appendOnlyEvents}</span>
            {selectedEvents.length === 0 ? <p className="ops-attendance-empty">{attendance.selectRecordToViewHistory}</p> : selectedEvents.map((event) => (
              <article key={event.id}><b>{eventActionLabel(event, attendance)}</b><small>{event.actorUserId} / {eventDate(event.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Tokyo" })}</small><p>{event.detail}</p></article>
            ))}
          </section>
        </aside>
      </div>
    </section>
  );
}
