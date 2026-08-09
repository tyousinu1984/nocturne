import { AttendanceDomainError } from "./attendance-domain.ts";
import { AttendanceStoreError } from "./attendance-store.ts";

export function attendanceErrorResponse(error: unknown) {
  if (error instanceof AttendanceDomainError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.code === "invalid_transition" ? 409 : 400 },
    );
  }
  if (error instanceof AttendanceStoreError) {
    const status = {
      not_found: 404,
      concurrency_conflict: 409,
      schedule_conflict: 409,
      idempotency_conflict: 409,
      database_error: 503,
    }[error.code];
    return Response.json(
      {
        error: error.message,
        code: error.code,
        currentEntry: error.currentEntry,
      },
      { status },
    );
  }
  return Response.json(
    { error: "Attendance command failed." },
    { status: 500 },
  );
}
