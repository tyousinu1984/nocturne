import assert from "node:assert/strict";
import test from "node:test";
import { AttendanceDomainError } from "../app/admin/attendance-domain.ts";
import { attendanceErrorResponse } from "../app/admin/attendance-http.ts";
import { AttendanceStoreError } from "../app/admin/attendance-store.ts";

test("invalid transitions are reported as HTTP conflicts", async () => {
  const response = attendanceErrorResponse(
    new AttendanceDomainError(
      "invalid_transition",
      "approve cannot run while attendance is draft.",
    ),
  );

  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "invalid_transition");
});

test("version conflicts preserve the latest readable entry", async () => {
  const currentEntry = { id: "att-1", version: 4 };
  const response = attendanceErrorResponse(
    new AttendanceStoreError(
      "concurrency_conflict",
      "The entry changed.",
      currentEntry,
    ),
  );

  assert.equal(response.status, 409);
  assert.deepEqual((await response.json()).currentEntry, currentEntry);
});
