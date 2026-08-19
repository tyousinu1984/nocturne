import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  attendanceActions,
  attendanceStatuses,
} from "../app/admin/attendance-domain";

export const castAccountStatuses = ["active", "disabled"] as const;
export const castAccountActions = [
  "create",
  "rotate_credential",
  "enable",
  "disable",
  "login",
] as const;

// Timestamp-shaped columns below stay `text`, not native `timestamp`/
// `timestamptz`, on purpose: every write path in attendance-store.ts /
// cast-account-store.ts explicitly computes `new Date().toISOString()` in
// JS and binds it as a parameter — the SQL-side CURRENT_TIMESTAMP default
// is effectively dead code, never exercised. A native timestamptz column
// would make node-postgres auto-parse reads into JS `Date` objects instead
// of strings, silently changing every read path's return shape (JSON
// responses, string equality in tests, ORDER BY behavior on ISO strings).
// Staying on `text` keeps 100% of existing timestamp handling unchanged.
const nowDefault = sql`CURRENT_TIMESTAMP::text`;

export const attendanceEntries = pgTable(
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
    createdAt: text("created_at").notNull().default(nowDefault),
    updatedAt: text("updated_at").notNull().default(nowDefault),
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

export const attendanceEvents = pgTable(
  "attendance_events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
    createdAt: text("created_at").notNull().default(nowDefault),
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

export const castAccounts = pgTable(
  "cast_accounts",
  {
    id: text("id").primaryKey(),
    artistSlug: text("artist_slug").notNull(),
    displayName: text("display_name").notNull(),
    credentialHash: text("credential_hash").notNull(),
    status: text("status", { enum: castAccountStatuses })
      .notNull()
      .default("active"),
    sessionVersion: integer("session_version").notNull().default(1),
    lastLoginAt: text("last_login_at"),
    createdAt: text("created_at").notNull().default(nowDefault),
    updatedAt: text("updated_at").notNull().default(nowDefault),
  },
  (table) => [
    check(
      "cast_accounts_status_valid",
      sql`${table.status} IN ('active', 'disabled')`,
    ),
    check(
      "cast_accounts_session_version_positive",
      sql`${table.sessionVersion} >= 1`,
    ),
    uniqueIndex("uq_cast_accounts_artist_slug").on(table.artistSlug),
    index("idx_cast_accounts_status").on(table.status),
  ],
);

export const castAccountEvents = pgTable(
  "cast_account_events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    accountId: text("account_id")
      .notNull()
      .references(() => castAccounts.id, { onDelete: "cascade" }),
    action: text("action", { enum: castAccountActions }).notNull(),
    actorUserId: text("actor_user_id").notNull(),
    detail: text("detail").notNull().default(""),
    createdAt: text("created_at").notNull().default(nowDefault),
  },
  (table) => [
    check(
      "cast_account_events_action_valid",
      sql`${table.action} IN ('create', 'rotate_credential', 'enable', 'disable', 'login')`,
    ),
    index("idx_cast_account_events_account_created").on(
      table.accountId,
      table.createdAt,
      table.id,
    ),
  ],
);
