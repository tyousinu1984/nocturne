import { artists } from "../../../data";
import {
  getCastAccountByArtistSlug,
  recordCastLogin,
} from "../../../admin/cast-account-store";
import { isSameOriginCommandRequest } from "../../../admin/request-policy";
import { getStaffAccess } from "../../../staff/access";
import {
  clearStaffLoginFailures,
  clearStaffSessionCookie,
  createStaffSessionToken,
  recordStaffLoginFailure,
  staffLoginRateLimit,
  staffSessionCookie,
  verifyStaffCredential,
} from "../../../staff/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const access = await getStaffAccess(request);
    if (access.kind !== "authorized") return authenticationRequired();
    return Response.json(
      {
        account: {
          id: access.account.id,
          artistSlug: access.account.artistSlug,
          displayName: access.account.displayName,
          status: access.account.status,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return authenticationRequired();
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginBlocked();
  let payload: Record<string, unknown>;
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    payload = value as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const artistSlug =
    typeof payload.artistSlug === "string" ? payload.artistSlug.trim() : "";
  const credential =
    typeof payload.credential === "string" ? payload.credential.trim() : "";
  const source =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rateKey = `${source}:${artistSlug || "unknown"}`;
  const limit = staffLoginRateLimit(rateKey);
  if (limit.blocked) {
    return Response.json(
      { error: "Too many sign-in attempts. Try again later.", code: "rate_limited" },
      {
        status: 429,
        headers: { "retry-after": String(limit.retryAfterSeconds) },
      },
    );
  }

  try {
    if (!artists.some((artist) => artist.slug === artistSlug)) throw new Error();
    const account = await getCastAccountByArtistSlug(artistSlug);
    if (
      !account ||
      account.status !== "active" ||
      !verifyStaffCredential(credential, account.credentialHash)
    ) {
      throw new Error();
    }
    clearStaffLoginFailures(rateKey);
    await recordCastLogin(account.id);
    const token = createStaffSessionToken({
      accountId: account.id,
      artistSlug: account.artistSlug,
      sessionVersion: account.sessionVersion,
    });
    return Response.json(
      {
        account: {
          id: account.id,
          artistSlug: account.artistSlug,
          displayName: account.displayName,
          status: account.status,
        },
      },
      { headers: { "set-cookie": staffSessionCookie(token, isSecure(request)) } },
    );
  } catch {
    recordStaffLoginFailure(rateKey);
    return Response.json(
      { error: "Profile or access code is invalid.", code: "invalid_credentials" },
      { status: 401 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return crossOriginBlocked();
  return Response.json(
    { ok: true },
    { headers: { "set-cookie": clearStaffSessionCookie(isSecure(request)) } },
  );
}

function sameOrigin(request: Request) {
  return isSameOriginCommandRequest({
    origin: request.headers.get("origin"),
    requestUrl: request.url,
  });
}

function isSecure(request: Request) {
  return new URL(request.url).protocol === "https:";
}

function authenticationRequired() {
  return Response.json(
    { error: "Staff sign-in required.", code: "authentication_required" },
    { status: 401 },
  );
}

function crossOriginBlocked() {
  return Response.json(
    { error: "Cross-origin staff commands are blocked.", code: "cross_origin_blocked" },
    { status: 403 },
  );
}
