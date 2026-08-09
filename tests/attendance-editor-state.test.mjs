import assert from "node:assert/strict";
import test from "node:test";
import {
  attendanceFailureKind,
  attendanceFormFromEntry,
  attendancePreview,
  replaceAttendanceEntry,
} from "../app/admin/attendance-editor-state.ts";

function entry(overrides = {}) {
  return {
    id: "att-1",
    artistSlug: "yuna",
    serviceDate: "2026-08-12",
    startTime: "18:00",
    endTime: "23:00",
    status: "draft",
    version: 1,
    submittedBy: null,
    reviewedBy: null,
    note: "Initial",
    rejectionReason: null,
    cancellationReason: null,
    submittedAt: null,
    reviewedAt: null,
    publishedAt: null,
    cancelledAt: null,
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  };
}

test("a concurrency response replaces the record and editor fields together", () => {
  const stale = entry();
  const latest = entry({
    serviceDate: "2026-08-13",
    startTime: "19:30",
    endTime: "22:30",
    note: "Changed by another session",
    version: 2,
  });

  const records = replaceAttendanceEntry([stale], latest);
  const fields = attendanceFormFromEntry(latest);

  assert.equal(records[0].version, 2);
  assert.equal(fields.serviceDate, latest.serviceDate);
  assert.equal(fields.startTime, latest.startTime);
  assert.equal(fields.note, latest.note);
});

test("a cancelled entry preview never presents stale public hours", () => {
  const cancelled = entry({
    status: "cancelled",
    cancellationReason: "Store closed",
  });
  const preview = attendancePreview(cancelled, attendanceFormFromEntry(cancelled));

  assert.equal(preview.kind, "removed");
  assert.equal(preview.dateLabel, "NO PUBLISHED SHIFTS");
  assert.equal(preview.timeLabel, "REMOVED FROM PUBLIC PROFILE");
  assert.doesNotMatch(preview.timeLabel, /18:00|23:00/);
});

test("only storage failures make attendance unavailable", () => {
  assert.equal(attendanceFailureKind(401), "auth_required");
  assert.equal(attendanceFailureKind(403), "forbidden");
  assert.equal(
    attendanceFailureKind(403, "cross_origin_blocked"),
    "command_error",
  );
  assert.equal(attendanceFailureKind(400, "invalid_time"), "command_error");
  assert.equal(attendanceFailureKind(409, "concurrency_conflict"), "command_error");
  assert.equal(attendanceFailureKind(503, "database_error"), "storage_unavailable");
  assert.equal(attendanceFailureKind(500, "database_error"), "storage_unavailable");
});
