import assert from "node:assert/strict";
import test from "node:test";
import {
  AttendanceDomainError,
  assertAttendanceReason,
  assertValidAttendanceDraft,
  attendanceEventName,
  attendanceTargetStatus,
} from "../app/admin/attendance-domain.ts";

const validDraft = {
  artistSlug: "yuna",
  serviceDate: "2026-08-10",
  startTime: "20:00",
  endTime: "23:30",
  note: "Tokyo evening shift",
};

test("attendance follows the declared publication state path", () => {
  assert.equal(attendanceTargetStatus("submit", "draft"), "pending");
  assert.equal(attendanceTargetStatus("approve", "pending"), "approved");
  assert.equal(attendanceTargetStatus("publish", "approved"), "published");
  assert.equal(attendanceTargetStatus("cancel", "published"), "cancelled");
});

test("attendance supports the rejection terminal path", () => {
  assert.equal(attendanceTargetStatus("reject", "pending"), "rejected");
  assert.throws(
    () => attendanceTargetStatus("approve", "rejected"),
    (error) =>
      error instanceof AttendanceDomainError &&
      error.code === "invalid_transition",
  );
});

test("administrator corrections preserve active attendance status", () => {
  for (const status of ["draft", "pending", "approved", "published"]) {
    assert.equal(attendanceTargetStatus("save_draft", status, "admin"), status);
  }
  assert.throws(
    () => attendanceTargetStatus("save_draft", "cancelled", "admin"),
    (error) =>
      error instanceof AttendanceDomainError &&
      error.code === "invalid_transition",
  );
});

test("attendance draft validation requires an ordered Tokyo-local time range", () => {
  assert.doesNotThrow(() => assertValidAttendanceDraft(validDraft));
  assert.throws(
    () =>
      assertValidAttendanceDraft({
        ...validDraft,
        startTime: "23:30",
        endTime: "20:00",
      }),
    (error) =>
      error instanceof AttendanceDomainError &&
      error.code === "invalid_time_order",
  );
  assert.throws(
    () =>
      assertValidAttendanceDraft({
        ...validDraft,
        startTime: "25:00",
      }),
    (error) =>
      error instanceof AttendanceDomainError && error.code === "invalid_time",
  );
  assert.throws(
    () =>
      assertValidAttendanceDraft({
        ...validDraft,
        serviceDate: "2026-02-31",
      }),
    (error) =>
      error instanceof AttendanceDomainError && error.code === "invalid_date",
  );
  assert.throws(
    () =>
      assertValidAttendanceDraft({
        ...validDraft,
        note: "x".repeat(501),
      }),
    (error) =>
      error instanceof AttendanceDomainError && error.code === "text_too_long",
  );
});

test("rejection and cancellation require an audit reason", () => {
  assert.throws(
    () => assertAttendanceReason("reject", " "),
    (error) =>
      error instanceof AttendanceDomainError &&
      error.code === "reason_required",
  );
  assert.throws(
    () => assertAttendanceReason("cancel", undefined),
    (error) =>
      error instanceof AttendanceDomainError &&
      error.code === "reason_required",
  );
  assert.doesNotThrow(() => assertAttendanceReason("cancel", "Owner request"));
});

test("event names remain stable for the append-only audit contract", () => {
  assert.equal(attendanceEventName("create"), "attendance.created");
  assert.equal(attendanceEventName("save_draft"), "attendance.draft_saved");
  assert.equal(attendanceEventName("publish"), "attendance.published");
  assert.equal(attendanceEventName("cancel"), "attendance.cancelled");
});
