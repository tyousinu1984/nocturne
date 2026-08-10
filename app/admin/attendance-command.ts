import { artists } from "../data.ts";
import {
  AttendanceDomainError,
  isAttendanceAction,
  type AttendanceActor,
  type AttendanceDraftInput,
} from "./attendance-domain.ts";
import {
  AttendanceStoreError,
  type AttendanceCommand,
} from "./attendance-store.ts";

export function attendanceCommandFromPayload({
  actor,
  idempotencyKey,
  payload,
}: {
  actor: AttendanceActor;
  idempotencyKey: string;
  payload: Record<string, unknown>;
}): AttendanceCommand {
  const action = payload.action;
  if (!isAttendanceAction(action)) {
    throw new AttendanceDomainError(
      "invalid_transition",
      "Choose a valid attendance action.",
    );
  }

  if (action === "create") {
    return {
      action,
      actor,
      idempotencyKey,
      draft: attendanceDraftFromPayload(payload, actor.artistSlug),
    };
  }

  const attendanceId =
    typeof payload.attendanceId === "string"
      ? payload.attendanceId.trim()
      : "";
  const expectedVersion =
    typeof payload.expectedVersion === "number"
      ? payload.expectedVersion
      : Number.NaN;
  if (!attendanceId) {
    throw new AttendanceStoreError(
      "not_found",
      "Attendance entry ID is required.",
    );
  }
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw new AttendanceStoreError(
      "concurrency_conflict",
      "A valid expected version is required.",
    );
  }

  return {
    action,
    actor,
    attendanceId,
    expectedVersion,
    idempotencyKey,
    draft:
      action === "save_draft"
        ? attendanceDraftFromPayload(payload, actor.artistSlug)
        : undefined,
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
  };
}

function attendanceDraftFromPayload(
  payload: Record<string, unknown>,
  forcedArtistSlug?: string,
): AttendanceDraftInput {
  const artistSlug =
    forcedArtistSlug ??
    (typeof payload.artistSlug === "string" ? payload.artistSlug.trim() : "");
  if (!artists.some((artist) => artist.slug === artistSlug)) {
    throw new AttendanceDomainError(
      "invalid_artist",
      "Choose a cast profile from the directory.",
    );
  }

  return {
    artistSlug,
    serviceDate:
      typeof payload.serviceDate === "string"
        ? payload.serviceDate.trim()
        : "",
    startTime:
      typeof payload.startTime === "string" ? payload.startTime.trim() : "",
    endTime:
      typeof payload.endTime === "string" ? payload.endTime.trim() : "",
    note: typeof payload.note === "string" ? payload.note : "",
  };
}
