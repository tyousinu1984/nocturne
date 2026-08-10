import { artists } from "../../../data";
import { getAdminAccess } from "../../../admin/access";
import {
  CastAccountError,
} from "../../../admin/cast-account-domain";
import {
  createCastAccount,
  listCastAccounts,
  rotateCastCredential,
  setCastAccountStatus,
} from "../../../admin/cast-account-store";
import { isSameOriginCommandRequest } from "../../../admin/request-policy";
import {
  generateTemporaryAccessCode,
  hashStaffCredential,
} from "../../../staff/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAdminAccess();
  if (access.kind !== "authorized") return authenticationRequired();
  try {
    const data = await listCastAccounts();
    return Response.json(
      {
        artists: artists.map(({ slug, name }) => ({ slug, name })),
        ...data,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Cast account storage is unavailable.", code: "database_error" },
      { status: 503 },
    );
  }
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
      { error: "Cross-origin account commands are blocked.", code: "cross_origin_blocked" },
      { status: 403 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    payload = value as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  try {
    const action = payload.action;
    if (action === "create") {
      const artistSlug =
        typeof payload.artistSlug === "string" ? payload.artistSlug.trim() : "";
      const artist = artists.find((candidate) => candidate.slug === artistSlug);
      if (!artist) {
        throw new CastAccountError("invalid_account", "Choose a valid cast profile.");
      }
      const temporaryAccessCode = generateTemporaryAccessCode();
      const account = await createCastAccount({
        artistSlug,
        displayName: artist.name,
        credentialHash: hashStaffCredential(temporaryAccessCode),
        actorUserId: access.user.userId,
      });
      return Response.json({ account, temporaryAccessCode }, { status: 201 });
    }

    const accountId =
      typeof payload.accountId === "string" ? payload.accountId.trim() : "";
    if (!accountId) {
      throw new CastAccountError("not_found", "Cast account ID is required.");
    }
    if (action === "rotate_credential") {
      const temporaryAccessCode = generateTemporaryAccessCode();
      const account = await rotateCastCredential({
        accountId,
        actorUserId: access.user.userId,
        credentialHash: hashStaffCredential(temporaryAccessCode),
      });
      return Response.json({ account, temporaryAccessCode });
    }
    if (action === "enable" || action === "disable") {
      const account = await setCastAccountStatus({
        accountId,
        actorUserId: access.user.userId,
        status: action === "enable" ? "active" : "disabled",
      });
      return Response.json({ account });
    }
    throw new CastAccountError("invalid_account", "Choose a valid account action.");
  } catch (error) {
    return castAccountErrorResponse(error);
  }
}

function authenticationRequired() {
  return Response.json(
    { error: "Authentication required.", code: "authentication_required" },
    { status: 401 },
  );
}

function castAccountErrorResponse(error: unknown) {
  if (error instanceof CastAccountError) {
    const status = {
      not_found: 404,
      account_exists: 409,
      invalid_account: 400,
      invalid_credential: 400,
      account_disabled: 403,
      configuration_error: 503,
      database_error: 503,
    }[error.code];
    return Response.json(
      { error: error.message, code: error.code },
      { status },
    );
  }
  return Response.json(
    { error: "Cast account command failed." },
    { status: 500 },
  );
}
