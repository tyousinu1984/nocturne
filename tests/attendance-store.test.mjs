import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AttendanceStoreError,
  createAttendanceStore,
} from "../app/admin/attendance-store.ts";
import { createSQLiteD1 } from "./helpers/sqlite-d1.mjs";

const actorUserId = "owner-user";

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
    actorUserId,
    idempotencyKey,
    draft: draftInput,
  };
}

async function transition(store, entry, action, idempotencyKey, reason) {
  return store.executeAttendanceCommand({
    action,
    actorUserId,
    attendanceId: entry.id,
    expectedVersion: entry.version,
    idempotencyKey,
    reason,
  });
}

test("published attendance becomes public and cancellation removes it", async (t) => {
  const d1 = createSQLiteD1();
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

test("idempotent retries return the first result and reject payload reuse", async (t) => {
  const d1 = createSQLiteD1();
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
  const d1 = createSQLiteD1();
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
  const d1 = createSQLiteD1();
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
  const d1 = createSQLiteD1();
  t.after(() => d1.close());
  const store = createAttendanceStore(d1, { initializeSchema: true });
  await store.ensureSchema();
  d1.failNextBatchAt(1);

  await assert.rejects(
    store.executeAttendanceCommand(createCommand("atomic-create")),
    (error) =>
      error instanceof AttendanceStoreError && error.code === "database_error",
  );

  assert.equal(d1.query("SELECT COUNT(*) AS total FROM attendance_entries")[0].total, 0);
  assert.equal(d1.query("SELECT COUNT(*) AS total FROM attendance_events")[0].total, 0);
});

test("development DDL stays equivalent to the generated migration", async (t) => {
  const runtimeD1 = createSQLiteD1();
  const migrationD1 = createSQLiteD1();
  t.after(() => {
    runtimeD1.close();
    migrationD1.close();
  });

  const runtimeStore = createAttendanceStore(runtimeD1, {
    initializeSchema: true,
  });
  await runtimeStore.ensureSchema();

  const journal = JSON.parse(
    readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"),
  );
  for (const migrationEntry of journal.entries) {
    const migration = readFileSync(
      new URL(`../drizzle/${migrationEntry.tag}.sql`, import.meta.url),
      "utf8",
    );
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) migrationD1.execute(statement);
    }
  }

  assert.deepEqual(schemaSnapshot(runtimeD1), schemaSnapshot(migrationD1));
});

function schemaSnapshot(d1) {
  return d1
    .query(
      `SELECT type, name, tbl_name AS tableName, sql
       FROM sqlite_schema
       WHERE type IN ('table', 'index')
         AND name NOT LIKE 'sqlite_%'
       ORDER BY type, name`,
    )
    .map((row) => ({
      type: row.type,
      name: row.name,
      tableName: row.tableName,
      sql: canonicalSchemaSql(row.sql),
    }));
}

function canonicalSchemaSql(sql) {
  const normalized = sql
    .replaceAll(/["`]/g, "")
    .replace(/\bIF\s+NOT\s+EXISTS\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([(),=<>])\s*/g, "$1")
    .trim()
    .toLowerCase();
  if (!normalized.startsWith("create table")) return normalized;

  const opening = normalized.indexOf("(");
  const closing = normalized.lastIndexOf(")");
  const prefix = normalized.slice(0, opening + 1);
  const suffix = normalized.slice(closing);
  const definitions = splitTopLevel(normalized.slice(opening + 1, closing));
  return `${prefix}${definitions.sort().join(",")}${suffix}`;
}

function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "(") depth += 1;
    if (value[index] === ")") depth -= 1;
    if (value[index] === "," && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts;
}
