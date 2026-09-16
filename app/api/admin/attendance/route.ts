import { getAdminAccess } from "../../../admin/access";
import { attendanceCommandFromPayload } from "../../../admin/attendance-command";
import { isSameOriginCommandRequest } from "../../../admin/request-policy";
import {
  isAttendanceAction,
} from "../../../admin/attendance-domain";
import {
  executeAttendanceCommand,
  listAttendanceForAdmin,
  quickPublishAttendance,
} from "../../../admin/attendance-store";
import { attendanceErrorResponse } from "../../../admin/attendance-http";
import { isAttendanceRequestPayload } from "../../../admin/attendance-request";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (access.kind === "unauthenticated") {
    return Response.json(
      { error: "Authentication required.", code: "authentication_required" },
      { status: 401 },
    );
  }
  const artistSlug = new URL(request.url).searchParams.get("artist")?.trim() || undefined;
  try {
    const data = await listAttendanceForAdmin(artistSlug);
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

  // "quick_publish" is an API-layer orchestration shortcut, not a domain
  // action — it isn't in attendanceActions/the attendance_events DB CHECK
  // constraint, it just drives the normal submit/approve/publish actions
  // back-to-back server-side (see quickPublishAttendance in
  // attendance-store.ts). Handled before the isAttendanceAction gate below,
  // which would otherwise reject it as an unknown action.
  if (payload.action === "quick_publish") {
    const attendanceId =
      typeof payload.attendanceId === "string" ? payload.attendanceId.trim() : "";
    const expectedVersion =
      typeof payload.expectedVersion === "number" ? payload.expectedVersion : Number.NaN;
    if (!attendanceId || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
      return Response.json(
        { error: "A valid attendance ID and expected version are required." },
        { status: 400 },
      );
    }
    try {
      const result = await quickPublishAttendance({
        attendanceId,
        expectedVersion,
        actor: { userId: access.user.userId, role: "admin" },
        idempotencyKey,
      });
      return Response.json(result);
    } catch (error) {
      return attendanceErrorResponse(error);
    }
  }

  if (!isAttendanceAction(payload.action)) {
    return Response.json(
      { error: "Choose a valid attendance action." },
      { status: 400 },
    );
  }

  try {
    const command = attendanceCommandFromPayload({
      actor: { userId: access.user.userId, role: "admin" },
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
