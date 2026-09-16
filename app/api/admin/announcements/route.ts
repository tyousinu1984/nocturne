import { getAdminAccess } from "../../../admin/access";
import { isSameOriginCommandRequest } from "../../../admin/request-policy";
import {
  AnnouncementError,
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  type SaveAnnouncementInput,
} from "../../../admin/announcement-store";

export const dynamic = "force-dynamic";

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readInput(payload: Record<string, unknown>): SaveAnnouncementInput {
  return {
    date: readString(payload.date),
    titleEn: readString(payload.titleEn),
    titleJa: readString(payload.titleJa),
    titleZh: readString(payload.titleZh),
    bodyEn: readString(payload.bodyEn),
    bodyJa: readString(payload.bodyJa),
    bodyZh: readString(payload.bodyZh),
  };
}

async function readJsonBody(request: Request) {
  const value = await request.json();
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
  return value as Record<string, unknown>;
}

function checkSameOrigin(request: Request) {
  return isSameOriginCommandRequest({
    origin: request.headers.get("origin"),
    requestUrl: request.url,
  });
}

export async function GET() {
  const access = await getAdminAccess();
  if (access.kind !== "authorized") return authenticationRequired();
  try {
    const announcements = await listAnnouncements(50);
    return Response.json({ announcements }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Announcement storage is unavailable.", code: "database_error" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.kind !== "authorized") return authenticationRequired();
  if (!checkSameOrigin(request)) return crossOriginBlocked();

  let payload: Record<string, unknown>;
  try {
    payload = await readJsonBody(request);
  } catch {
    return Response.json({ error: "Request body must be JSON.", code: "invalid_request" }, { status: 400 });
  }

  try {
    const announcement = await createAnnouncement(readInput(payload));
    return Response.json({ announcement }, { status: 201 });
  } catch (error) {
    return announcementErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const access = await getAdminAccess();
  if (access.kind !== "authorized") return authenticationRequired();
  if (!checkSameOrigin(request)) return crossOriginBlocked();

  let payload: Record<string, unknown>;
  try {
    payload = await readJsonBody(request);
  } catch {
    return Response.json({ error: "Request body must be JSON.", code: "invalid_request" }, { status: 400 });
  }

  const id = readString(payload.id);
  if (!id) {
    return Response.json({ error: "An announcement id is required.", code: "invalid_input" }, { status: 400 });
  }

  try {
    const announcement = await updateAnnouncement(id, readInput(payload));
    return Response.json({ announcement });
  } catch (error) {
    return announcementErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const access = await getAdminAccess();
  if (access.kind !== "authorized") return authenticationRequired();
  if (!checkSameOrigin(request)) return crossOriginBlocked();

  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return Response.json({ error: "An announcement id is required.", code: "invalid_input" }, { status: 400 });
  }

  try {
    await deleteAnnouncement(id);
    return Response.json({ ok: true });
  } catch (error) {
    return announcementErrorResponse(error);
  }
}

function announcementErrorResponse(error: unknown) {
  if (error instanceof AnnouncementError) {
    const status = { not_found: 404, invalid_input: 400, database_error: 503 }[error.code];
    return Response.json({ error: error.message, code: error.code }, { status });
  }
  return Response.json({ error: "Announcement command failed." }, { status: 500 });
}

function authenticationRequired() {
  return Response.json(
    { error: "Authentication required.", code: "authentication_required" },
    { status: 401 },
  );
}

function crossOriginBlocked() {
  return Response.json(
    { error: "Cross-origin announcement commands are blocked.", code: "cross_origin_blocked" },
    { status: 403 },
  );
}
