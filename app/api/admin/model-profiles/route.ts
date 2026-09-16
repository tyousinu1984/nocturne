import { getAdminAccess } from "../../../admin/access";
import { isSameOriginCommandRequest } from "../../../admin/request-policy";
import {
  ModelProfileError,
  listModelProfiles,
  upsertModelProfile,
  type UpsertModelProfileInput,
} from "../../../admin/model-profile-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAdminAccess();
  if (access.kind !== "authorized") return authenticationRequired();
  try {
    const profiles = await listModelProfiles();
    return Response.json({ profiles }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Model profile storage is unavailable.", code: "database_error" },
      { status: 503 },
    );
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const access = await getAdminAccess();
  if (access.kind !== "authorized") return authenticationRequired();
  if (
    !isSameOriginCommandRequest({
      origin: request.headers.get("origin"),
      requestUrl: request.url,
    })
  ) {
    return Response.json(
      { error: "Cross-origin profile commands are blocked.", code: "cross_origin_blocked" },
      { status: 403 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    payload = value as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Request body must be JSON.", code: "invalid_request" }, { status: 400 });
  }

  const input: UpsertModelProfileInput = {
    slug: readString(payload.slug),
    name: readString(payload.name),
    tier: readString(payload.tier) as UpsertModelProfileInput["tier"],
    district: readString(payload.district) as UpsertModelProfileInput["district"],
    status: readString(payload.status) as UpsertModelProfileInput["status"],
    roleEn: readString(payload.roleEn),
    roleJa: readString(payload.roleJa),
    roleZh: readString(payload.roleZh),
    shortNoteEn: readString(payload.shortNoteEn),
    shortNoteJa: readString(payload.shortNoteJa),
    shortNoteZh: readString(payload.shortNoteZh),
    biographyEn: readString(payload.biographyEn),
    biographyJa: readString(payload.biographyJa),
    biographyZh: readString(payload.biographyZh),
  };

  if (!input.slug) {
    return Response.json({ error: "A model slug is required.", code: "invalid_input" }, { status: 400 });
  }

  try {
    const profile = await upsertModelProfile(input);
    return Response.json({ profile });
  } catch (error) {
    if (error instanceof ModelProfileError && error.code === "invalid_input") {
      return Response.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return Response.json(
      { error: "Model profile could not be saved.", code: "database_error" },
      { status: 503 },
    );
  }
}

function authenticationRequired() {
  return Response.json(
    { error: "Authentication required.", code: "authentication_required" },
    { status: 401 },
  );
}
