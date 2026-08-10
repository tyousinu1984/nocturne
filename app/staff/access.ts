import type { CastAccountPrivateRecord } from "../admin/cast-account-domain.ts";
import { getCastAccountById } from "../admin/cast-account-store.ts";
import {
  cookieValue,
  readStaffSessionToken,
  STAFF_SESSION_COOKIE,
} from "./session.ts";

export type StaffAccess =
  | { kind: "authorized"; account: CastAccountPrivateRecord }
  | { kind: "unauthenticated" };

export async function getStaffAccess(request: Request): Promise<StaffAccess> {
  const token = cookieValue(
    request.headers.get("cookie"),
    STAFF_SESSION_COOKIE,
  );
  const payload = readStaffSessionToken(token);
  if (!payload) return { kind: "unauthenticated" };

  const account = await getCastAccountById(payload.accountId);
  if (
    !account ||
    account.status !== "active" ||
    account.artistSlug !== payload.artistSlug ||
    account.sessionVersion !== payload.sessionVersion
  ) {
    return { kind: "unauthenticated" };
  }
  return { kind: "authorized", account };
}
