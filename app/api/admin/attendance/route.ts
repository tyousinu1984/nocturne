import { artists } from "../../../data";
import { getAdminAccess } from "../../../admin/access";
import { isSameOriginCommandRequest } from "../../../admin/request-policy";
import {
  AttendanceDomainError,
  isAttendanceAction,
  type AttendanceDraftInput,
} from "../../../admin/attendance-domain";
import {
  AttendanceStoreError,
  executeAttendanceCommand,
  listAttendanceForAdmin,
  type AttendanceCommand,
} from "../../../admin/attendance-store";
import { attendanceErrorResponse } from "../../../admin/attendance-http";
import { isAttendanceRequestPayload } from "../../../admin/attendance-request";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAdminAccess();
  if (access.kind === "unauthenticated") {
    return Response.json(
      { error: "Authentication required.", code: "authentication_required" },
      { status: 401 },
    );
  }
  if (access.kind === "forbidden") {
    return Response.json(
      { error: "Admin access denied.", code: "admin_forbidden" },
      { status: 403 },
    );
  }

  try {
    const data = await listAttendanceForAdmin();
    return Response.json(data, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Attendance storage is unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.kind === "unauthenticated") {
    return Response.json(
      { error: "Authentication required.", code: "authentication_required" },
      { status: 401 },
    );
  }
  if (access.kind === "forbidden") {
    return Response.json(
      { error: "Admin access denied.", code: "admin_forbidden" },
      { status: 403 },
    );
  }
  const requestOrigin = request.headers.get("origin");
  if (
    !isSameOriginCommandRequest({
      origin: requestOrigin,
      requestUrl: request.url,
    })
  ) {
    return Response.json(
      {
        error: "Cross-origin attendance commands are blocked.",
        code: "cross_origin_blocked",
      },
      { status: 403 },
    );
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!idempotencyKey || idempotencyKey.length > 128) {
    return Response.json(
      { error: "A valid Idempotency-Key header is required." },
      { status: 400 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  if (!isAttendanceRequestPayload(payload)) {
    return Response.json(
      { error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  if (!isAttendanceAction(payload.action)) {
    return Response.json(
      { error: "Choose a valid attendance action." },
      { status: 400 },
    );
  }

  try {
    const command = commandFromPayload({
      actorUserId: access.user.userId,
      idempotencyKey,
      payload,
    });
    const result = await executeAttendanceCommand(command);
    return Response.json(result, {
      status: payload.action === "create" && !result.idempotent ? 201 : 200,
    });
  } catch (error) {
    return attendanceErrorResponse(error);
  }
}

function commandFromPayload({
  actorUserId,
  idempotencyKey,
  payload,
}: {
  actorUserId: string;
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
      actorUserId,
      idempotencyKey,
      draft: attendanceDraftFromPayload(payload),
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
    actorUserId,
    attendanceId,
    expectedVersion,
    idempotencyKey,
    draft: action === "save_draft" ? attendanceDraftFromPayload(payload) : undefined,
    reason: typeof payload.reason === "string" ? payload.reason : undefined,
  };
}

function attendanceDraftFromPayload(
  payload: Record<string, unknown>,
): AttendanceDraftInput {
  const artistSlug =
    typeof payload.artistSlug === "string" ? payload.artistSlug.trim() : "";
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
