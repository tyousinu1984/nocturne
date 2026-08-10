import { attendanceCommandFromPayload } from "../../../admin/attendance-command";
import { attendanceErrorResponse } from "../../../admin/attendance-http";
import { isAttendanceAction } from "../../../admin/attendance-domain";
import {
  executeAttendanceCommand,
  listAttendanceForCast,
} from "../../../admin/attendance-store";
import { isAttendanceRequestPayload } from "../../../admin/attendance-request";
import { isSameOriginCommandRequest } from "../../../admin/request-policy";
import { getStaffAccess } from "../../../staff/access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const access = await getStaffAccess(request);
    if (access.kind !== "authorized") return authenticationRequired();
    const data = await listAttendanceForCast(access.account.artistSlug);
    return Response.json(data, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return authenticationRequired();
  }
}

export async function POST(request: Request) {
  let access;
  try {
    access = await getStaffAccess(request);
  } catch {
    return authenticationRequired();
  }
  if (access.kind !== "authorized") return authenticationRequired();
  if (
    !isSameOriginCommandRequest({
      origin: request.headers.get("origin"),
      requestUrl: request.url,
    })
  ) {
    return Response.json(
      { error: "Cross-origin attendance commands are blocked.", code: "cross_origin_blocked" },
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
    return Response.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }
  if (!isAttendanceAction(payload.action)) {
    return Response.json({ error: "Choose a valid attendance action." }, { status: 400 });
  }

  try {
    const command = attendanceCommandFromPayload({
      actor: {
        userId: `cast:${access.account.id}`,
        role: "cast",
        artistSlug: access.account.artistSlug,
      },
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

function authenticationRequired() {
  return Response.json(
    { error: "Staff sign-in required.", code: "authentication_required" },
    { status: 401 },
  );
}
