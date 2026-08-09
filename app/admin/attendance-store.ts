import { getRuntimeEnvValue } from "../runtime-env.ts";
import {
  assertAttendanceReason,
  assertValidAttendanceDraft,
  attendanceActionDetail,
  attendanceStatuses,
  attendanceTargetStatus,
  type AttendanceAction,
  type AttendanceDraftInput,
  type AttendanceEntryRecord,
  type AttendanceEventRecord,
  type AttendanceStatus,
} from "./attendance-domain.ts";

export type AttendanceD1Statement = {
  bind(...values: unknown[]): AttendanceD1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
};

export type AttendanceD1 = {
  prepare(query: string): AttendanceD1Statement;
  batch(
    statements: AttendanceD1Statement[],
  ): Promise<Array<{ meta: { changes?: number } }>>;
};

type AttendanceEntryRow = {
  id: string;
  artistSlug: string;
  serviceDate: string;
  startTime: string;
  endTime: string;
  status: AttendanceStatus;
  version: number;
  submittedBy: string | null;
  reviewedBy: string | null;
  note: string;
  rejectionReason: string | null;
  cancellationReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AttendanceEventRow = {
  id: number;
  attendanceId: string;
  idempotencyKey: string;
  action: AttendanceAction;
  fromStatus: AttendanceStatus | null;
  toStatus: AttendanceStatus;
  actorUserId: string;
  entryVersion: number;
  detail: string;
  createdAt: string;
};

type AttendanceSnapshotRow = {
  resultSnapshot: string;
};

type CreateAttendanceCommand = {
  action: "create";
  actorUserId: string;
  idempotencyKey: string;
  draft: AttendanceDraftInput;
};

type UpdateAttendanceCommand = {
  action: Exclude<AttendanceAction, "create">;
  actorUserId: string;
  attendanceId: string;
  expectedVersion: number;
  idempotencyKey: string;
  draft?: AttendanceDraftInput;
  reason?: string;
};

export type AttendanceCommand =
  | CreateAttendanceCommand
  | UpdateAttendanceCommand;

export class AttendanceStoreError extends Error {
  readonly code:
    | "not_found"
    | "concurrency_conflict"
    | "schedule_conflict"
    | "idempotency_conflict"
    | "database_error";
  readonly currentEntry?: AttendanceEntryRecord;

  constructor(
    code:
      | "not_found"
      | "concurrency_conflict"
      | "schedule_conflict"
      | "idempotency_conflict"
      | "database_error",
    message: string,
    currentEntry?: AttendanceEntryRecord,
  ) {
    super(message);
    this.code = code;
    this.currentEntry = currentEntry;
  }
}

const entrySelect = `
  SELECT
    id,
    artist_slug AS artistSlug,
    service_date AS serviceDate,
    start_time AS startTime,
    end_time AS endTime,
    status,
    version,
    submitted_by AS submittedBy,
    reviewed_by AS reviewedBy,
    note,
    rejection_reason AS rejectionReason,
    cancellation_reason AS cancellationReason,
    submitted_at AS submittedAt,
    reviewed_at AS reviewedAt,
    published_at AS publishedAt,
    cancelled_at AS cancelledAt,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM attendance_entries
`;

const eventSelect = `
  SELECT
    id,
    attendance_id AS attendanceId,
    idempotency_key AS idempotencyKey,
    action,
    from_status AS fromStatus,
    to_status AS toStatus,
    actor_user_id AS actorUserId,
    entry_version AS entryVersion,
    detail,
    created_at AS createdAt
  FROM attendance_events
`;

// This is intentionally testable beside the generated Drizzle migration.
// Development initialization stays restricted to the local development mock.
export const attendanceDevelopmentSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS attendance_entries (
    id text PRIMARY KEY NOT NULL,
    artist_slug text NOT NULL,
    service_date text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    status text DEFAULT 'draft' NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    submitted_by text,
    reviewed_by text,
    note text DEFAULT '' NOT NULL,
    rejection_reason text,
    cancellation_reason text,
    created_by text NOT NULL,
    last_event_key text NOT NULL,
    submitted_at text,
    reviewed_at text,
    published_at text,
    cancelled_at text,
    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT attendance_entries_time_order CHECK(attendance_entries.start_time < attendance_entries.end_time),
    CONSTRAINT attendance_entries_version_positive CHECK(attendance_entries.version >= 1),
    CONSTRAINT attendance_entries_status_valid CHECK(attendance_entries.status IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled'))
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_entries_active_artist_date
    ON attendance_entries (artist_slug, service_date)
    WHERE attendance_entries.status NOT IN ('rejected', 'cancelled')`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_entries_public
    ON attendance_entries (artist_slug, service_date, start_time)
    WHERE attendance_entries.status = 'published'`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_entries_status_date
    ON attendance_entries (status, service_date)`,
  `CREATE TABLE IF NOT EXISTS attendance_events (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    attendance_id text NOT NULL,
    idempotency_key text NOT NULL,
    request_fingerprint text NOT NULL,
    action text NOT NULL,
    from_status text,
    to_status text NOT NULL,
    actor_user_id text NOT NULL,
    entry_version integer NOT NULL,
    detail text DEFAULT '' NOT NULL,
    result_snapshot text NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT attendance_events_action_valid CHECK(attendance_events.action IN ('create', 'save_draft', 'submit', 'approve', 'reject', 'publish', 'cancel')),
    CONSTRAINT attendance_events_to_status_valid CHECK(attendance_events.to_status IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled')),
    CONSTRAINT attendance_events_from_status_valid CHECK(attendance_events.from_status IS NULL OR attendance_events.from_status IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled')),
    FOREIGN KEY (attendance_id) REFERENCES attendance_entries(id) ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_events_idempotency
    ON attendance_events (idempotency_key)`,
  `CREATE INDEX IF NOT EXISTS idx_attendance_events_entry_created
    ON attendance_events (attendance_id, created_at, id)`,
  "PRAGMA optimize",
] as const;

export function createAttendanceStore(
  d1: AttendanceD1,
  { initializeSchema = false }: { initializeSchema?: boolean } = {},
) {
  let schemaReady = false;

  async function ensureSchema() {
    if (!initializeSchema || schemaReady) return;
    await d1.batch(
      attendanceDevelopmentSchemaStatements.map((statement) =>
        d1.prepare(statement),
      ),
    );
    schemaReady = true;
  }

  async function listAttendanceForAdmin() {
    await ensureSchema();
    const [entryResult, eventResult] = await d1.batch([
      d1.prepare(
        `${entrySelect}
         ORDER BY
           CASE status
             WHEN 'pending' THEN 0
             WHEN 'draft' THEN 1
             WHEN 'approved' THEN 2
             WHEN 'published' THEN 3
             WHEN 'cancelled' THEN 4
             ELSE 5
           END,
           service_date ASC,
           start_time ASC,
           created_at DESC
         LIMIT 50`,
      ),
      d1.prepare(
        `${eventSelect}
         ORDER BY id DESC
         LIMIT 100`,
      ),
    ]);

    return {
      entries: (entryResult as unknown as { results: AttendanceEntryRecord[] })
        .results,
      events: (eventResult as unknown as { results: AttendanceEventRecord[] })
        .results,
    };
  }

  async function getAttendanceEntry(attendanceId: string) {
    await ensureSchema();
    const row = await d1
      .prepare(`${entrySelect} WHERE id = ? LIMIT 1`)
      .bind(attendanceId)
      .first<AttendanceEntryRow>();
    return row as AttendanceEntryRecord | null;
  }

  async function findIdempotentResult(
    idempotencyKey: string,
    requestFingerprint: string,
  ) {
    const idempotencyRecord = await d1
      .prepare(
        `SELECT
          attendance_id AS attendanceId,
          request_fingerprint AS requestFingerprint,
          result_snapshot AS resultSnapshot
         FROM attendance_events
         WHERE idempotency_key = ?
         LIMIT 1`,
      )
      .bind(idempotencyKey)
      .first<{
        attendanceId: string;
        requestFingerprint: string;
        resultSnapshot: string;
      }>();
    if (!idempotencyRecord) return null;
    if (idempotencyRecord.requestFingerprint !== requestFingerprint) {
      throw new AttendanceStoreError(
        "idempotency_conflict",
        "This idempotency key was already used for a different command.",
      );
    }

    const event = await d1
      .prepare(`${eventSelect} WHERE idempotency_key = ? LIMIT 1`)
      .bind(idempotencyKey)
      .first<AttendanceEventRow>();
    if (!event) {
      throw new AttendanceStoreError(
        "database_error",
        "The idempotency record is missing its attendance event.",
      );
    }

    const entry = parseAttendanceSnapshot(idempotencyRecord.resultSnapshot);
    if (entry.id !== idempotencyRecord.attendanceId) {
      throw new AttendanceStoreError(
        "database_error",
        "The idempotency snapshot points to a different attendance entry.",
      );
    }

    return {
      entry,
      event: event as AttendanceEventRecord,
      idempotent: true,
    };
  }

  async function recoverIdempotentResult(
    idempotencyKey: string,
    requestFingerprint: string,
  ) {
    try {
      return await findIdempotentResult(idempotencyKey, requestFingerprint);
    } catch (error) {
      if (
        error instanceof AttendanceStoreError &&
        error.code === "idempotency_conflict"
      ) {
        throw error;
      }
      return null;
    }
  }

  async function commandResult(idempotencyKey: string) {
    const [snapshot, event] = await Promise.all([
      d1
        .prepare(
          `SELECT result_snapshot AS resultSnapshot
           FROM attendance_events
           WHERE idempotency_key = ?
           LIMIT 1`,
        )
        .bind(idempotencyKey)
        .first<AttendanceSnapshotRow>(),
      d1
        .prepare(`${eventSelect} WHERE idempotency_key = ? LIMIT 1`)
        .bind(idempotencyKey)
        .first<AttendanceEventRow>(),
    ]);
    if (!snapshot || !event) {
      throw new AttendanceStoreError(
        "database_error",
        "Attendance command completed without a readable result.",
      );
    }

    return {
      entry: parseAttendanceSnapshot(snapshot.resultSnapshot),
      event: event as AttendanceEventRecord,
      idempotent: false,
    };
  }

  async function createAttendance(
    command: CreateAttendanceCommand,
    requestFingerprint: string,
  ) {
    assertValidAttendanceDraft(command.draft);

    const attendanceId = `att_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const createdEntry: AttendanceEntryRecord = {
      id: attendanceId,
      artistSlug: command.draft.artistSlug,
      serviceDate: command.draft.serviceDate,
      startTime: command.draft.startTime,
      endTime: command.draft.endTime,
      status: "draft",
      version: 1,
      submittedBy: null,
      reviewedBy: null,
      note: command.draft.note?.trim() ?? "",
      rejectionReason: null,
      cancellationReason: null,
      submittedAt: null,
      reviewedAt: null,
      publishedAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const detail = attendanceActionDetail({
      action: command.action,
      serviceDate: command.draft.serviceDate,
      startTime: command.draft.startTime,
      endTime: command.draft.endTime,
    });

    try {
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO attendance_entries (
              id, artist_slug, service_date, start_time, end_time, status, version,
              note, created_by, last_event_key, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 'draft', 1, ?, ?, ?, ?, ?)`,
          )
          .bind(
            attendanceId,
            command.draft.artistSlug,
            command.draft.serviceDate,
            command.draft.startTime,
            command.draft.endTime,
            command.draft.note?.trim() ?? "",
            command.actorUserId,
            command.idempotencyKey,
            now,
            now,
          ),
        d1
          .prepare(
            `INSERT INTO attendance_events (
              attendance_id, idempotency_key, request_fingerprint, action,
              from_status, to_status, actor_user_id, entry_version, detail,
              result_snapshot, created_at
            ) VALUES (?, ?, ?, 'create', NULL, 'draft', ?, 1, ?, ?, ?)`,
          )
          .bind(
            attendanceId,
            command.idempotencyKey,
            requestFingerprint,
            command.actorUserId,
            detail,
            JSON.stringify(createdEntry),
            now,
          ),
      ]);
    } catch (error) {
      const duplicate = await recoverIdempotentResult(
        command.idempotencyKey,
        requestFingerprint,
      );
      if (duplicate) return duplicate;
      throw mapDatabaseError(error);
    }

    return commandResult(command.idempotencyKey);
  }

  async function updateAttendance(
    command: UpdateAttendanceCommand,
    requestFingerprint: string,
  ) {
    const current = await getAttendanceEntry(command.attendanceId);
    if (!current) {
      throw new AttendanceStoreError(
        "not_found",
        "Attendance entry was not found.",
      );
    }
    if (current.version !== command.expectedVersion) {
      throw new AttendanceStoreError(
        "concurrency_conflict",
        "This attendance entry changed after it was loaded.",
        current,
      );
    }

    const nextStatus = attendanceTargetStatus(command.action, current.status);
    assertAttendanceReason(command.action, command.reason);

    const draft =
      command.action === "save_draft"
        ? command.draft
        : {
            artistSlug: current.artistSlug,
            serviceDate: current.serviceDate,
            startTime: current.startTime,
            endTime: current.endTime,
            note: current.note,
          };
    if (!draft) {
      throw new AttendanceStoreError(
        "database_error",
        "Draft data is required to save attendance.",
      );
    }
    assertValidAttendanceDraft(draft);

    const nextVersion = current.version + 1;
    const now = new Date().toISOString();
    const next = {
      submittedBy:
        command.action === "submit" ? command.actorUserId : current.submittedBy,
      reviewedBy:
        command.action === "approve" || command.action === "reject"
          ? command.actorUserId
          : current.reviewedBy,
      rejectionReason:
        command.action === "reject"
          ? command.reason?.trim() ?? null
          : current.rejectionReason,
      cancellationReason:
        command.action === "cancel"
          ? command.reason?.trim() ?? null
          : current.cancellationReason,
      submittedAt:
        command.action === "submit" ? now : current.submittedAt,
      reviewedAt:
        command.action === "approve" || command.action === "reject"
          ? now
          : current.reviewedAt,
      publishedAt:
        command.action === "publish" ? now : current.publishedAt,
      cancelledAt:
        command.action === "cancel" ? now : current.cancelledAt,
    };
    const detail = attendanceActionDetail({
      action: command.action,
      reason: command.reason,
      serviceDate: draft.serviceDate,
      startTime: draft.startTime,
      endTime: draft.endTime,
    });
    const updatedEntry: AttendanceEntryRecord = {
      ...current,
      artistSlug: draft.artistSlug,
      serviceDate: draft.serviceDate,
      startTime: draft.startTime,
      endTime: draft.endTime,
      status: nextStatus,
      version: nextVersion,
      submittedBy: next.submittedBy,
      reviewedBy: next.reviewedBy,
      note: draft.note?.trim() ?? "",
      rejectionReason: next.rejectionReason,
      cancellationReason: next.cancellationReason,
      submittedAt: next.submittedAt,
      reviewedAt: next.reviewedAt,
      publishedAt: next.publishedAt,
      cancelledAt: next.cancelledAt,
      updatedAt: now,
    };

    try {
      const [updateResult, eventResult] = await d1.batch([
        d1
          .prepare(
            `UPDATE attendance_entries
             SET
               artist_slug = ?,
               service_date = ?,
               start_time = ?,
               end_time = ?,
               status = ?,
               version = version + 1,
               submitted_by = ?,
               reviewed_by = ?,
               note = ?,
               rejection_reason = ?,
               cancellation_reason = ?,
               last_event_key = ?,
               submitted_at = ?,
               reviewed_at = ?,
               published_at = ?,
               cancelled_at = ?,
               updated_at = ?
             WHERE id = ? AND version = ? AND status = ?`,
          )
          .bind(
            draft.artistSlug,
            draft.serviceDate,
            draft.startTime,
            draft.endTime,
            nextStatus,
            next.submittedBy,
            next.reviewedBy,
            draft.note?.trim() ?? "",
            next.rejectionReason,
            next.cancellationReason,
            command.idempotencyKey,
            next.submittedAt,
            next.reviewedAt,
            next.publishedAt,
            next.cancelledAt,
            now,
            command.attendanceId,
            command.expectedVersion,
            current.status,
          ),
        d1
          .prepare(
            `INSERT INTO attendance_events (
              attendance_id, idempotency_key, request_fingerprint, action,
              from_status, to_status, actor_user_id, entry_version, detail,
              result_snapshot, created_at
            )
            SELECT id, ?, ?, ?, ?, ?, ?, version, ?, ?, ?
            FROM attendance_entries
            WHERE id = ? AND last_event_key = ? AND version = ?`,
          )
          .bind(
            command.idempotencyKey,
            requestFingerprint,
            command.action,
            current.status,
            nextStatus,
            command.actorUserId,
            detail,
            JSON.stringify(updatedEntry),
            now,
            command.attendanceId,
            command.idempotencyKey,
            nextVersion,
          ),
      ]);

      if (
        Number(updateResult.meta.changes ?? 0) !== 1 ||
        Number(eventResult.meta.changes ?? 0) !== 1
      ) {
        const duplicate = await recoverIdempotentResult(
          command.idempotencyKey,
          requestFingerprint,
        );
        if (duplicate) return duplicate;
        const latest = await getAttendanceEntry(command.attendanceId);
        throw new AttendanceStoreError(
          "concurrency_conflict",
          "This attendance entry changed before the command completed.",
          latest ?? undefined,
        );
      }
    } catch (error) {
      if (error instanceof AttendanceStoreError) throw error;
      const duplicate = await recoverIdempotentResult(
        command.idempotencyKey,
        requestFingerprint,
      );
      if (duplicate) return duplicate;
      throw mapDatabaseError(error);
    }

    return commandResult(command.idempotencyKey);
  }

  async function executeAttendanceCommand(command: AttendanceCommand) {
    try {
      await ensureSchema();
      const requestFingerprint = await attendanceCommandFingerprint(command);
      const existingResult = await findIdempotentResult(
        command.idempotencyKey,
        requestFingerprint,
      );
      if (existingResult) return existingResult;

      if (command.action === "create") {
        return createAttendance(command, requestFingerprint);
      }
      return updateAttendance(command, requestFingerprint);
    } catch (error) {
      if (error instanceof AttendanceStoreError) throw error;
      throw mapDatabaseError(error);
    }
  }

  async function listPublicAttendance(artistSlug: string) {
    await ensureSchema();
    const [managedRow, publishedResult] = await Promise.all([
      d1
        .prepare(
          `SELECT COUNT(*) AS total
           FROM attendance_entries
           WHERE artist_slug = ?
             AND status IN ('published', 'cancelled')`,
        )
        .bind(artistSlug)
        .first<{ total: number }>(),
      d1
        .prepare(
          `SELECT
            id,
            artist_slug AS artistSlug,
            service_date AS serviceDate,
            start_time AS startTime,
            end_time AS endTime
           FROM attendance_entries
           WHERE artist_slug = ? AND status = 'published'
           ORDER BY service_date ASC, start_time ASC
           LIMIT 14`,
        )
        .bind(artistSlug)
        .all<{
          id: string;
          artistSlug: string;
          serviceDate: string;
          startTime: string;
          endTime: string;
        }>(),
    ]);

    return {
      managed: Number(managedRow?.total ?? 0) > 0,
      entries: publishedResult.results,
    };
  }

  return {
    ensureSchema,
    listAttendanceForAdmin,
    getAttendanceEntry,
    executeAttendanceCommand,
    listPublicAttendance,
  };
}

async function runtimeAttendanceStore() {
  try {
    const { getD1Binding } = await import("../../db");
    return createAttendanceStore(getD1Binding(), {
      initializeSchema: getRuntimeEnvValue("NOCTURNE_DEV_AUTH") === "1",
    });
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function ensureAttendanceSchemaForDevelopment() {
  await (await runtimeAttendanceStore()).ensureSchema();
}

export async function listAttendanceForAdmin() {
  return (await runtimeAttendanceStore()).listAttendanceForAdmin();
}

export async function getAttendanceEntry(attendanceId: string) {
  return (await runtimeAttendanceStore()).getAttendanceEntry(attendanceId);
}

export async function executeAttendanceCommand(command: AttendanceCommand) {
  return (await runtimeAttendanceStore()).executeAttendanceCommand(command);
}

export async function listPublicAttendance(artistSlug: string) {
  return (await runtimeAttendanceStore()).listPublicAttendance(artistSlug);
}

async function attendanceCommandFingerprint(command: AttendanceCommand) {
  const payload =
    command.action === "create"
      ? {
          action: command.action,
          actorUserId: command.actorUserId,
          draft: command.draft,
        }
      : {
          action: command.action,
          actorUserId: command.actorUserId,
          attendanceId: command.attendanceId,
          expectedVersion: command.expectedVersion,
          draft: command.draft,
          reason: command.reason?.trim() ?? "",
        };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function mapDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("uq_attendance_entries_active_artist_date") ||
    message.includes(
      "UNIQUE constraint failed: attendance_entries.artist_slug, attendance_entries.service_date",
    )
  ) {
    return new AttendanceStoreError(
      "schedule_conflict",
      "An active attendance entry already exists for this cast member and date.",
    );
  }
  return new AttendanceStoreError(
    "database_error",
    "Attendance storage could not complete the command.",
  );
}

function parseAttendanceSnapshot(value: string): AttendanceEntryRecord {
  try {
    const parsed = JSON.parse(value) as Partial<AttendanceEntryRecord>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.artistSlug !== "string" ||
      typeof parsed.serviceDate !== "string" ||
      typeof parsed.startTime !== "string" ||
      typeof parsed.endTime !== "string" ||
      !attendanceStatuses.includes(parsed.status as AttendanceStatus) ||
      typeof parsed.version !== "number" ||
      typeof parsed.note !== "string" ||
      typeof parsed.createdAt !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      throw new Error("invalid snapshot");
    }
    return parsed as AttendanceEntryRecord;
  } catch {
    throw new AttendanceStoreError(
      "database_error",
      "Attendance event snapshot could not be read.",
    );
  }
}
