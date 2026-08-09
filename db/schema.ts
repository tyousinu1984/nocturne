import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  attendanceActions,
  attendanceStatuses,
} from "../app/admin/attendance-domain";

export const attendanceEntries = sqliteTable(
  "attendance_entries",
  {
    id: text("id").primaryKey(),
    artistSlug: text("artist_slug").notNull(),
    serviceDate: text("service_date").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    status: text("status", { enum: attendanceStatuses })
      .notNull()
      .default("draft"),
    version: integer("version").notNull().default(1),
    submittedBy: text("submitted_by"),
    reviewedBy: text("reviewed_by"),
    note: text("note").notNull().default(""),
    rejectionReason: text("rejection_reason"),
    cancellationReason: text("cancellation_reason"),
    createdBy: text("created_by").notNull(),
    lastEventKey: text("last_event_key").notNull(),
    submittedAt: text("submitted_at"),
    reviewedAt: text("reviewed_at"),
    publishedAt: text("published_at"),
    cancelledAt: text("cancelled_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      "attendance_entries_time_order",
      sql`${table.startTime} < ${table.endTime}`,
    ),
    check(
      "attendance_entries_version_positive",
      sql`${table.version} >= 1`,
    ),
    check(
      "attendance_entries_status_valid",
      sql`${table.status} IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled')`,
    ),
    uniqueIndex("uq_attendance_entries_active_artist_date")
      .on(table.artistSlug, table.serviceDate)
      .where(sql`${table.status} NOT IN ('rejected', 'cancelled')`),
    index("idx_attendance_entries_public")
      .on(table.artistSlug, table.serviceDate, table.startTime)
      .where(sql`${table.status} = 'published'`),
    index("idx_attendance_entries_status_date").on(
      table.status,
      table.serviceDate,
    ),
  ],
);

export const attendanceEvents = sqliteTable(
  "attendance_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    attendanceId: text("attendance_id")
      .notNull()
      .references(() => attendanceEntries.id, { onDelete: "cascade" }),
    idempotencyKey: text("idempotency_key").notNull(),
    requestFingerprint: text("request_fingerprint").notNull(),
    action: text("action", { enum: attendanceActions }).notNull(),
    fromStatus: text("from_status", { enum: attendanceStatuses }),
    toStatus: text("to_status", { enum: attendanceStatuses }).notNull(),
    actorUserId: text("actor_user_id").notNull(),
    entryVersion: integer("entry_version").notNull(),
    detail: text("detail").notNull().default(""),
    resultSnapshot: text("result_snapshot").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      "attendance_events_action_valid",
      sql`${table.action} IN ('create', 'save_draft', 'submit', 'approve', 'reject', 'publish', 'cancel')`,
    ),
    check(
      "attendance_events_to_status_valid",
      sql`${table.toStatus} IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled')`,
    ),
    check(
      "attendance_events_from_status_valid",
      sql`${table.fromStatus} IS NULL OR ${table.fromStatus} IN ('draft', 'pending', 'approved', 'published', 'rejected', 'cancelled')`,
    ),
    uniqueIndex("uq_attendance_events_idempotency").on(table.idempotencyKey),
    index("idx_attendance_events_entry_created").on(
      table.attendanceId,
      table.createdAt,
      table.id,
    ),
  ],
);
