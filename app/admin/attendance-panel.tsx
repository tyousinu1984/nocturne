"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type AttendancePanelProps = {
  adminUser: {
    displayName: string;
    identityLabel: string;
  };
  onNotice: (label: string, message: string) => void;
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

const statusLabels: Record<AttendanceStatus, string> = {
  draft: "DRAFT",
  pending: "PENDING REVIEW",
  approved: "APPROVED",
  published: "PUBLIC",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
};

const statusStep: Record<AttendanceStatus, number> = {
  draft: 1,
  pending: 2,
  approved: 3,
  published: 4,
  rejected: 2,
  cancelled: 4,
};

function defaultTokyoDate() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(tomorrow);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function commandKey(action: AttendanceAction) {
  return `attendance:${action}:${crypto.randomUUID()}`;
}

function eventDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value.replace(" ", "T")}Z`);
  }
  return new Date(value);
}

function unavailablePreview(loadState: Exclude<AttendanceLoadState, "ready">) {
  const copy = {
    loading: ["CHECKING PROJECTION", "LOADING ATTENDANCE SERVICE", "CHECKING"],
    auth_required: ["SIGN IN REQUIRED", "REAUTHENTICATE TO CONTINUE", "SIGNED OUT"],
    forbidden: ["ADMIN ACCESS UNAVAILABLE", "OWNER ALLOWLIST REQUIRED", "DENIED"],
    storage_unavailable: [
      "PROJECTION UNKNOWN",
      "RELOAD ATTENDANCE STORAGE",
      "UNAVAILABLE",
    ],
    service_error: [
      "PROJECTION UNKNOWN",
      "RETRY ATTENDANCE SERVICE",
      "SERVICE ERROR",
    ],
  }[loadState];

  return {
    kind: "unavailable" as const,
    dateLabel: copy[0],
    timeLabel: copy[1],
    statusLabel: copy[2],
  };
}

export function AttendancePanel({
  adminUser,
  onNotice,
}: AttendancePanelProps) {
  const [entries, setEntries] = useState<AttendanceEntryRecord[]>([]);
  const [events, setEvents] = useState<AttendanceEventRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [serviceDate, setServiceDate] = useState(defaultTokyoDate);
  const [startTime, setStartTime] = useState("20:00");
  const [endTime, setEndTime] = useState("23:30");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [loadState, setLoadState] =
    useState<AttendanceLoadState>("loading");
  const [busyAction, setBusyAction] = useState<AttendanceAction | null>(null);
  const [loadError, setLoadError] = useState("");
  const [commandError, setCommandError] = useState("");

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
  const formEditable = !selectedEntry || selectedEntry.status === "draft";
  const activeStep = selectedEntry ? statusStep[selectedEntry.status] : 0;
  const loading = loadState === "loading";
  const storageUnavailable = loadState === "storage_unavailable";
  const interactionLocked = loadState !== "ready" || busyAction !== null;
  const preview = loadState !== "ready"
    ? unavailablePreview(loadState)
    : attendancePreview(selectedEntry, {
        serviceDate,
        startTime,
        endTime,
      });

  const selectEntry = useCallback((entry: AttendanceEntryRecord) => {
    const fields = attendanceFormFromEntry(entry);
    setSelectedId(entry.id);
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
      if (body.entries[0]) {
        selectEntry(body.entries[0]);
      } else {
        setSelectedId(null);
      }
    },
    [selectEntry],
  );

  const handleLoadFailure = useCallback(
    ({
      status,
      code,
      message,
    }: {
      status: number;
      code?: string;
      message: string;
    }) => {
      const failureKind = attendanceFailureKind(status, code);
      const nextState: AttendanceLoadState =
        failureKind === "auth_required" ||
        failureKind === "forbidden" ||
        failureKind === "storage_unavailable"
          ? failureKind
          : "service_error";
      const label = {
        auth_required: "SIGN IN REQUIRED",
        forbidden: "ADMIN ACCESS DENIED",
        storage_unavailable: "ATTENDANCE UNAVAILABLE",
        service_error: "ATTENDANCE SERVICE ERROR",
      }[nextState as Exclude<AttendanceLoadState, "loading" | "ready">];
      setLoadState(nextState);
      setLoadError(message);
      onNotice(label, message);
    },
    [onNotice],
  );

  const loadAttendance = useCallback(async () => {
    setLoadState("loading");
    setLoadError("");
    setCommandError("");
    try {
      const response = await fetch("/api/admin/attendance", {
        headers: { accept: "application/json" },
      });
      const body = (await response.json()) as AttendanceApiData & {
        error?: string;
        code?: string;
      };
      if (!response.ok) {
        handleLoadFailure({
          status: response.status,
          code: body.code,
          message: body.error ?? "Attendance could not be loaded.",
        });
        return;
      }
      applyAttendanceData(body);
      setLoadError("");
      setLoadState("ready");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Attendance could not be loaded.";
      handleLoadFailure({ status: 0, message });
    }
  }, [applyAttendanceData, handleLoadFailure]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    fetch("/api/admin/attendance", {
      headers: { accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as AttendanceApiData & {
          error?: string;
          code?: string;
        };
        if (!response.ok) {
          if (active) {
            handleLoadFailure({
              status: response.status,
              code: body.code,
              message: body.error ?? "Attendance could not be loaded.",
            });
          }
          return null;
        }
        return body;
      })
      .then((body) => {
        if (active && body) {
          applyAttendanceData(body);
          setLoadError("");
          setCommandError("");
          setLoadState("ready");
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        const message =
          error instanceof Error
            ? error.message
            : "Attendance could not be loaded.";
        handleLoadFailure({ status: 0, message });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [applyAttendanceData, handleLoadFailure]);

  function startNewDraft() {
    setSelectedId(null);
    setServiceDate(defaultTokyoDate());
    setStartTime("20:00");
    setEndTime("23:30");
    setNote("");
    setReason("");
    setCommandError("");
    onNotice(
      "NEW ATTENDANCE",
      "Preparing a new Yuna attendance draft in the isolated development database.",
    );
  }

  async function runCommand(action: AttendanceAction) {
    if (loadState !== "ready") {
      onNotice(
        "ATTENDANCE UNAVAILABLE",
        "Reload the durable attendance records before making changes.",
      );
      return;
    }
    setBusyAction(action);
    setCommandError("");

    const payload: Record<string, unknown> = {
      action,
      artistSlug: "yuna",
      serviceDate,
      startTime,
      endTime,
      note,
      reason,
    };
    if (selectedEntry && action !== "create") {
      payload.attendanceId = selectedEntry.id;
      payload.expectedVersion = selectedEntry.version;
    }

    try {
      const response = await fetch("/api/admin/attendance", {
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
        const message = body.error ?? "Attendance command failed.";
        const failureKind = attendanceFailureKind(response.status, body.code);
        if (failureKind !== "command_error") {
          handleLoadFailure({
            status: response.status,
            code: body.code,
            message,
          });
          setCommandError("");
          return;
        }
        if (body.currentEntry) {
          setEntries((current) => replaceAttendanceEntry(current, body.currentEntry!));
          selectEntry(body.currentEntry);
          if (body.code === "concurrency_conflict") {
            throw new Error(
              `Record updated elsewhere. The editor now shows V${body.currentEntry.version}; review it before retrying.`,
            );
          }
        }
        throw new Error(message);
      }

      setEntries((current) => {
        const withoutUpdated = current.filter(
          (entry) => entry.id !== body.entry.id,
        );
        return [...withoutUpdated, body.entry].sort((left, right) =>
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
      setLoadError("");
      setCommandError("");
      setLoadState("ready");
      onNotice(
        statusLabels[body.entry.status],
        `${body.event.detail}${body.idempotent ? " Existing command result returned." : ""}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Attendance command failed.";
      setCommandError(message);
      onNotice("COMMAND BLOCKED", message);
    } finally {
      setBusyAction(null);
    }
  }

  const counts = loadState !== "ready"
    ? { draft: "??", pending: "??", public: "??", cancelled: "??" }
    : {
        draft: entries.filter((entry) => entry.status === "draft").length,
        pending: entries.filter((entry) => entry.status === "pending").length,
        public: entries.filter((entry) => entry.status === "published").length,
        cancelled: entries.filter((entry) => entry.status === "cancelled").length,
      };

  return (
    <section className="ops-attendance" aria-busy={loading}>
      <div className="ops-attendance-grid">
        <section className="ops-attendance-editor">
          <div className="ops-panel-heading">
            <span>DURABLE ATTENDANCE</span>
            <h2>YUNA / TOKYO SHIFT</h2>
            <em>
              {selectedEntry
                ? `V${selectedEntry.version} / ${statusLabels[selectedEntry.status]}`
                : "NEW DRAFT"}
            </em>
          </div>

          <div className="ops-identity-strip">
            <div>
              <span>AUTHORIZED OPERATOR</span>
              <b>{adminUser.displayName}</b>
            </div>
            <small>{adminUser.identityLabel} / OWNER ALLOWLIST</small>
          </div>

          <ol className="ops-attendance-steps" aria-label="Attendance workflow">
            {["DRAFT", "REVIEW", "APPROVED", "PUBLIC"].map((label, index) => (
              <li
                className={activeStep >= index + 1 ? "is-complete" : ""}
                key={label}
              >
                <b>0{index + 1}</b>
                <span>{label}</span>
              </li>
            ))}
          </ol>

          <div className="ops-form-grid ops-attendance-form">
            <label>
              <span>CAST PROFILE</span>
              <select value="yuna" disabled aria-label="Cast profile">
                <option value="yuna">Yuna / profile-yuna</option>
              </select>
            </label>
            <label>
              <span>SERVICE DATE</span>
              <input
                type="date"
                value={serviceDate}
                disabled={!formEditable || interactionLocked}
                onChange={(event) => setServiceDate(event.target.value)}
              />
            </label>
            <label>
              <span>START TIME</span>
              <input
                type="time"
                value={startTime}
                disabled={!formEditable || interactionLocked}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>
            <label>
              <span>END TIME</span>
              <input
                type="time"
                value={endTime}
                disabled={!formEditable || interactionLocked}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>
            <label className="is-wide">
              <span>INTERNAL NOTE</span>
              <textarea
                rows={3}
                maxLength={500}
                value={note}
                disabled={!formEditable || interactionLocked}
                placeholder="Operational context only. This is never public."
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            {selectedEntry &&
              (selectedEntry.status === "pending" ||
                selectedEntry.status === "published") && (
                <label className="is-wide">
                  <span>
                    {selectedEntry.status === "pending"
                      ? "REJECTION REASON"
                      : "CANCELLATION REASON"}
                  </span>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={reason}
                    disabled={interactionLocked}
                    placeholder="Required only when rejecting or cancelling."
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
              )}
          </div>

          {(loadError || commandError) && (
            <div className="ops-attendance-error" role="alert">
              <b>ATTENTION REQUIRED</b>
              <p>{loadError || commandError}</p>
              {storageUnavailable && (
                <button type="button" disabled={loading} onClick={loadAttendance}>
                  {loading ? "RELOADING…" : "RETRY DATABASE LOAD"}
                </button>
              )}
              {loadState === "service_error" && (
                <button type="button" onClick={loadAttendance}>
                  RETRY ATTENDANCE LOAD
                </button>
              )}
              {loadState === "auth_required" && (
                <a href="/signin-with-chatgpt?return_to=%2Fadmin">
                  SIGN IN AGAIN
                </a>
              )}
            </div>
          )}

          <div className="ops-attendance-actions">
            {!selectedEntry && (
              <button
                type="button"
                disabled={interactionLocked}
                onClick={() => runCommand("create")}
              >
                {busyAction === "create" ? "CREATING…" : "CREATE DRAFT"}
              </button>
            )}
            {selectedEntry?.status === "draft" && (
              <>
                <button
                  type="button"
                  className="is-secondary"
                  disabled={interactionLocked}
                  onClick={() => runCommand("save_draft")}
                >
                  {busyAction === "save_draft" ? "SAVING…" : "SAVE DRAFT"}
                </button>
                <button
                  type="button"
                  disabled={interactionLocked}
                  onClick={() => runCommand("submit")}
                >
                  {busyAction === "submit" ? "SUBMITTING…" : "SUBMIT FOR REVIEW"}
                </button>
              </>
            )}
            {selectedEntry?.status === "pending" && (
              <>
                <button
                  type="button"
                  className="is-secondary"
                  disabled={interactionLocked || !reason.trim()}
                  onClick={() => runCommand("reject")}
                >
                  {busyAction === "reject" ? "REJECTING…" : "REJECT"}
                </button>
                <button
                  type="button"
                  disabled={interactionLocked}
                  onClick={() => runCommand("approve")}
                >
                  {busyAction === "approve" ? "APPROVING…" : "APPROVE"}
                </button>
              </>
            )}
            {selectedEntry?.status === "approved" && (
              <button
                type="button"
                disabled={interactionLocked}
                onClick={() => runCommand("publish")}
              >
                {busyAction === "publish" ? "PUBLISHING…" : "PUBLISH TO PROFILE"}
              </button>
            )}
            {selectedEntry?.status === "published" && (
              <button
                type="button"
                className="is-danger"
                disabled={interactionLocked || !reason.trim()}
                onClick={() => runCommand("cancel")}
              >
                {busyAction === "cancel" ? "CANCELLING…" : "CANCEL PUBLIC SHIFT"}
              </button>
            )}
            <button
              type="button"
              className="is-ghost"
              disabled={interactionLocked}
              onClick={startNewDraft}
            >
              NEW ATTENDANCE
            </button>
          </div>
        </section>

        <aside className="ops-attendance-side">
          <section className="ops-attendance-preview">
            <span>PUBLIC PROFILE PROJECTION</span>
            <div
              className={`ops-attendance-preview-card${
                preview.kind === "removed"
                  ? " is-removed"
                  : preview.kind === "unavailable"
                    ? " is-unavailable"
                    : ""
              }`}
            >
              <small>YUNA / WEEKLY SCHEDULE</small>
              <b>{preview.dateLabel}</b>
              <strong>{preview.timeLabel}</strong>
              <em>{preview.statusLabel}</em>
            </div>
            <p>
              Anonymous visitors receive only the published date and time.
              Internal notes, identity and review history stay private.
            </p>
          </section>

          <section className="ops-attendance-records">
            <div className="ops-attendance-side-heading">
              <span>DATABASE RECORDS</span>
              <button
                type="button"
                disabled={loading || busyAction !== null}
                onClick={loadAttendance}
              >
                REFRESH
              </button>
            </div>
            {loading ? (
              <p className="ops-attendance-empty">Loading attendance…</p>
            ) : loadState === "auth_required" ? (
              <p className="ops-attendance-empty">
                The owner session expired. Sign in again to read attendance.
              </p>
            ) : loadState === "forbidden" ? (
              <p className="ops-attendance-empty">
                This identity is not permitted to read attendance records.
              </p>
            ) : storageUnavailable ? (
              <p className="ops-attendance-empty">
                Attendance records are temporarily unavailable. Reload the
                database before making changes.
              </p>
            ) : loadState === "service_error" ? (
              <p className="ops-attendance-empty">
                Attendance could not be loaded. Retry the service request.
              </p>
            ) : entries.length === 0 ? (
              <p className="ops-attendance-empty">
                No durable attendance exists yet.
              </p>
            ) : (
              <div className="ops-attendance-record-list">
                {entries.map((entry) => (
                  <button
                    type="button"
                    className={entry.id === selectedId ? "is-active" : ""}
                    key={entry.id}
                    onClick={() => {
                      setCommandError("");
                      selectEntry(entry);
                    }}
                  >
                    <span>{statusLabels[entry.status]}</span>
                    <b>{entry.serviceDate}</b>
                    <small>
                      {entry.startTime}–{entry.endTime} / V{entry.version}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="ops-attendance-timeline">
            <span>APPEND-ONLY EVENTS</span>
            {loading ? (
              <p className="ops-attendance-empty">Loading audit history…</p>
            ) : loadState === "auth_required" ? (
              <p className="ops-attendance-empty">
                Audit history requires a renewed owner session.
              </p>
            ) : loadState === "forbidden" ? (
              <p className="ops-attendance-empty">
                Audit history is unavailable to this identity.
              </p>
            ) : storageUnavailable ? (
              <p className="ops-attendance-empty">
                Audit history is unavailable until the database reloads.
              </p>
            ) : loadState === "service_error" ? (
              <p className="ops-attendance-empty">
                Audit history could not be loaded. Retry the service request.
              </p>
            ) : selectedEvents.length === 0 ? (
              <p className="ops-attendance-empty">
                Select or create an entry to view its audit trail.
              </p>
            ) : (
              selectedEvents.map((event) => (
                <article key={event.id}>
                  <b>{event.action.replace("_", " ").toUpperCase()}</b>
                  <small>
                    V{event.entryVersion} /{" "}
                    {eventDate(event.createdAt).toLocaleString("en-GB", {
                      timeZone: "Asia/Tokyo",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                  <p>{event.detail}</p>
                </article>
              ))
            )}
          </section>
        </aside>
      </div>

      <div className="ops-attendance-summary" aria-label="Attendance status overview">
        {[
          [counts.draft, "DRAFT", "Editable attendance records"],
          [counts.pending, "REVIEW", "Waiting for owner review"],
          [counts.public, "PUBLIC", "Visible on cast profiles"],
          [counts.cancelled, "CANCELLED", "Removed from public projection"],
        ].map(([value, label, detail], index) => (
          <article className={index === 1 ? "is-alert" : ""} key={label}>
            <b>{String(value).padStart(2, "0")}</b>
            <span>{label}</span>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
