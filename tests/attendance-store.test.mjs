import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AttendanceStoreError,
  createAttendanceStore,
} from "../app/admin/attendance-store.ts";
import { AttendanceDomainError } from "../app/admin/attendance-domain.ts";
import { createCastAccountStore } from "../app/admin/cast-account-store.ts";
import { createInquiryStore } from "../app/admin/inquiry-store.ts";
import { createApplicationStore } from "../app/admin/application-store.ts";
import { createModelProfileStore } from "../app/admin/model-profile-store.ts";
import { createAnnouncementStore } from "../app/admin/announcement-store.ts";
import { createPostgresD1 } from "./helpers/postgres-d1.mjs";

const castActor = { userId: "cast-user", role: "cast", artistSlug: "yuna" };
const adminActor = { userId: "owner-user", role: "admin" };

function draft(overrides = {}) {
  return {
    artistSlug: "yuna",
    serviceDate: "2026-08-12",
    startTime: "18:00",
    endTime: "23:00",
    note: "Reception confirmed",
    ...overrides,
  };
}

function createCommand(idempotencyKey, draftInput = draft()) {
  return {
    action: "create",
    actor: castActor,
    idempotencyKey,
    draft: draftInput,
  };
}

async function transition(store, entry, action, idempotencyKey, reason) {
  const actor = ["save_draft", "submit"].includes(action)
    ? castActor
    : adminActor;
  return store.executeAttendanceCommand({
    action,
    actor,
    attendanceId: entry.id,
    expectedVersion: entry.version,
    idempotencyKey,
    reason,
  });
}

test("published attendance becomes public and cancellation removes it", async (t) => {
  const d1 = await createPostgresD1();
  t.after(() => d1.close());
  const store = createAttendanceStore(d1, { initializeSchema: true });

  let result = await store.executeAttendanceCommand(createCommand("create-1"));
  result = await transition(store, result.entry, "submit", "submit-1");
  result = await transition(store, result.entry, "approve", "approve-1");
  result = await transition(store, result.entry, "publish", "publish-1");

  const published = await store.listPublicAttendance("yuna");
  assert.equal(published.managed, true);
  assert.equal(published.entries.length, 1);
  assert.equal(published.entries[0].startTime, "18:00");

  result = await transition(
    store,
    result.entry,
    "cancel",
    "cancel-1",
    "Store closed",
  );
  assert.equal(result.entry.status, "cancelled");

  const cancelled = await store.listPublicAttendance("yuna");
  assert.equal(cancelled.managed, true);
  assert.deepEqual(cancelled.entries, []);

  const history = await store.listAttendanceForAdmin();
  assert.equal(history.events.length, 5);
});

test("administrator can manage every profile while cast remains profile-bound", async (t) => {
  const d1 = await createPostgresD1();
  t.after(() => d1.close());
  const store = createAttendanceStore(d1, { initializeSchema: true });

  const adminCreated = await store.executeAttendanceCommand({
    ...createCommand("admin-create", draft({ artistSlug: "aika" })),
    actor: adminActor,
  });
  assert.equal(adminCreated.entry.artistSlug, "aika");
  assert.equal(adminCreated.entry.status, "draft");

  const created = await store.executeAttendanceCommand(createCommand("cast-create"));
  await assert.rejects(
    store.executeAttendanceCommand({
      action: "approve",
      actor: castActor,
      attendanceId: created.entry.id,
      expectedVersion: created.entry.version,
      idempotencyKey: "cast-approve",
    }),
    (error) =>
      error instanceof AttendanceDomainError &&
      error.code === "permission_denied",
  );

  await assert.rejects(
    store.executeAttendanceCommand({
      ...createCommand("other-cast-create", draft({ artistSlug: "aika" })),
      actor: castActor,
    }),
    (error) =>
      error instanceof AttendanceDomainError &&
      error.code === "permission_denied",
  );
});

test("administrator can correct a published schedule without changing its status", async (t) => {
  const d1 = await createPostgresD1();
  t.after(() => d1.close());
  const store = createAttendanceStore(d1, { initializeSchema: true });

  let result = await store.executeAttendanceCommand(createCommand("live-create"));
  result = await transition(store, result.entry, "submit", "live-submit");
  result = await transition(store, result.entry, "approve", "live-approve");
  result = await transition(store, result.entry, "publish", "live-publish");

  const corrected = await store.executeAttendanceCommand({
    action: "save_draft",
    actor: adminActor,
    attendanceId: result.entry.id,
    expectedVersion: result.entry.version,
    idempotencyKey: "live-correction",
    draft: draft({ startTime: "19:00", endTime: "23:30" }),
  });
  assert.equal(corrected.entry.status, "published");
  assert.equal(corrected.entry.startTime, "19:00");
  assert.match(corrected.event.detail, /attendance\.admin_updated/);

  const projection = await store.listPublicAttendance("yuna");
  assert.equal(projection.entries[0].startTime, "19:00");

  await assert.rejects(
    store.executeAttendanceCommand({
      action: "save_draft",
      actor: castActor,
      attendanceId: corrected.entry.id,
      expectedVersion: corrected.entry.version,
      idempotencyKey: "cast-live-correction",
      draft: draft({ startTime: "20:00" }),
    }),
    (error) =>
      error instanceof AttendanceDomainError &&
      error.code === "invalid_transition",
  );
});

test("idempotent retries return the first result and reject payload reuse", async (t) => {
  const d1 = await createPostgresD1();
  t.after(() => d1.close());
  const store = createAttendanceStore(d1, { initializeSchema: true });
  const command = createCommand("same-key");

  const created = await store.executeAttendanceCommand(command);
  const replayed = await store.executeAttendanceCommand(command);

  assert.equal(replayed.idempotent, true);
  assert.equal(replayed.entry.id, created.entry.id);
  assert.equal(replayed.entry.version, created.entry.version);

  const submitted = await transition(store, created.entry, "submit", "late-submit");
  const lateReplay = await store.executeAttendanceCommand(command);
  assert.equal(submitted.entry.status, "pending");
  assert.equal(lateReplay.entry.status, "draft");
  assert.equal(lateReplay.entry.version, 1);
  assert.equal(lateReplay.event.entryVersion, lateReplay.entry.version);

  await assert.rejects(
    store.executeAttendanceCommand(
      createCommand("same-key", draft({ startTime: "19:00" })),
    ),
    (error) =>
      error instanceof AttendanceStoreError &&
      error.code === "idempotency_conflict",
  );
});

test("only one command wins a version race", async (t) => {
  const d1 = await createPostgresD1();
  t.after(() => d1.close());
  const store = createAttendanceStore(d1, { initializeSchema: true });
  const created = await store.executeAttendanceCommand(createCommand("race-create"));

  const results = await Promise.allSettled([
    transition(store, created.entry, "submit", "race-a"),
    transition(store, created.entry, "submit", "race-b"),
  ]);
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");

  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(fulfilled[0].value.entry.status, "pending");
  assert.ok(rejected[0].reason instanceof AttendanceStoreError);
  assert.equal(rejected[0].reason.code, "concurrency_conflict");
  assert.equal(rejected[0].reason.currentEntry?.version, 2);
});

test("an artist can have only one active entry on a service date", async (t) => {
  const d1 = await createPostgresD1();
  t.after(() => d1.close());
  const store = createAttendanceStore(d1, { initializeSchema: true });

  await store.executeAttendanceCommand(createCommand("unique-first"));
  await assert.rejects(
    store.executeAttendanceCommand(
      createCommand("unique-second", draft({ startTime: "19:00" })),
    ),
    (error) =>
      error instanceof AttendanceStoreError &&
      error.code === "schedule_conflict",
  );
});

test("a failed command batch rolls back both entry and event", async (t) => {
  const d1 = await createPostgresD1();
  t.after(() => d1.close());
  const store = createAttendanceStore(d1, { initializeSchema: true });
  await store.ensureSchema();
  d1.failNextBatchAt(1);

  await assert.rejects(
    store.executeAttendanceCommand(createCommand("atomic-create")),
    (error) =>
      error instanceof AttendanceStoreError && error.code === "database_error",
  );

  assert.equal(
    Number((await d1.query("SELECT COUNT(*) AS total FROM attendance_entries"))[0].total),
    0,
  );
  assert.equal(
    Number((await d1.query("SELECT COUNT(*) AS total FROM attendance_events"))[0].total),
    0,
  );
});

test("development DDL stays equivalent to the generated migration", async (t) => {
  const runtimeD1 = await createPostgresD1();
  const migrationD1 = await createPostgresD1();
  t.after(async () => {
    await runtimeD1.close();
    await migrationD1.close();
  });

  const runtimeStore = createAttendanceStore(runtimeD1, {
    initializeSchema: true,
  });
  const runtimeAccountStore = createCastAccountStore(runtimeD1, {
    initializeSchema: true,
  });
  const runtimeInquiryStore = createInquiryStore(runtimeD1, {
    initializeSchema: true,
  });
  const runtimeApplicationStore = createApplicationStore(runtimeD1, {
    initializeSchema: true,
  });
  const runtimeModelProfileStore = createModelProfileStore(runtimeD1, {
    initializeSchema: true,
  });
  const runtimeAnnouncementStore = createAnnouncementStore(runtimeD1, {
    initializeSchema: true,
  });
  await runtimeStore.ensureSchema();
  await runtimeAccountStore.ensureSchema();
  await runtimeInquiryStore.ensureSchema();
  await runtimeApplicationStore.ensureSchema();
  await runtimeModelProfileStore.ensureSchema();
  await runtimeAnnouncementStore.ensureSchema();

  const journal = JSON.parse(
    readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"),
  );
  for (const migrationEntry of journal.entries) {
    const migration = readFileSync(
      new URL(`../drizzle/${migrationEntry.tag}.sql`, import.meta.url),
      "utf8",
    );
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (!statement.trim()) continue;
      // drizzle-kit always hardcodes the "public" schema for cross-table
      // FK references (e.g. REFERENCES "public"."attendance_entries"(...))
      // regardless of where the migration is actually applied. Running it
      // as-is against this test's own isolated schema would fail with
      // "relation public.attendance_entries does not exist" — strip the
      // hardcoded qualifier so the FK resolves via search_path instead,
      // same as every other unqualified statement here.
      await migrationD1.execute(statement.replaceAll('"public".', ""));
    }
  }

  assert.deepEqual(
    await schemaSnapshot(runtimeD1),
    await schemaSnapshot(migrationD1),
  );
});

// Postgres has no single "give me this schema's DDL as text" system table
// the way SQLite's `sqlite_schema` does, so this reconstructs a comparable
// normalized snapshot from three catalog sources instead: column shapes,
// constraint definitions (CHECK/PK/FK/UNIQUE), and index definitions. Every
// captured string has this D1 instance's own randomly-generated schema name
// stripped out first, since runtimeD1/migrationD1 each live in a different
// schema and would otherwise never compare equal.
async function schemaSnapshot(d1) {
  const strip = (value) =>
    typeof value === "string"
      ? value.replaceAll(`"${d1.schemaName}".`, "").replaceAll(d1.schemaName, "")
      : value;
  const canonical = (value) => {
    const stripped = strip(value);
    return typeof stripped === "string"
      ? stripped.replace(/\s+/g, " ").trim().toLowerCase()
      : stripped;
  };

  const columns = await d1.query(
    `SELECT table_name, column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = $1
     ORDER BY table_name, ordinal_position`,
    d1.schemaName,
  );
  const constraints = await d1.query(
    `SELECT conrelid::regclass::text AS table_name, conname AS name,
            pg_get_constraintdef(oid) AS definition
     FROM pg_constraint
     WHERE connamespace = $1::regnamespace
     ORDER BY conrelid::regclass::text, conname`,
    d1.schemaName,
  );
  const indexes = await d1.query(
    `SELECT tablename AS table_name, indexname AS name, indexdef AS definition
     FROM pg_indexes
     WHERE schemaname = $1
     ORDER BY tablename, indexname`,
    d1.schemaName,
  );

  return {
    columns: columns.map((row) => ({
      tableName: strip(row.table_name),
      columnName: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable,
      columnDefault: canonical(row.column_default),
    })),
    constraints: constraints.map((row) => ({
      tableName: strip(row.table_name),
      name: row.name,
      definition: canonical(row.definition),
    })),
    indexes: indexes.map((row) => ({
      tableName: strip(row.table_name),
      name: row.name,
      definition: canonical(row.definition),
    })),
  };
}
