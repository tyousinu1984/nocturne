import { headers } from "next/headers";
import { getChatGPTUser, type ChatGPTUser } from "../chatgpt-auth";
import { getRuntimeEnvValue } from "../runtime-env";
import { ADMIN_ALLOWLIST_HEADER } from "./auth-headers";
import { isAllowedAdminUser, parseAllowedUserIds } from "./auth-policy";

export type AdminAccess =
  | { kind: "authorized"; user: ChatGPTUser }
  | { kind: "unauthenticated" }
  | { kind: "forbidden"; user: ChatGPTUser };

export async function hasAdminAccess(userId: string) {
  const isDevelopmentMock =
    getRuntimeEnvValue("NOCTURNE_DEV_AUTH") === "1";
  const requestHeaders = await headers();
  const allowedUserIds = parseAllowedUserIds(
    requestHeaders.get(ADMIN_ALLOWLIST_HEADER) ?? undefined,
  );

  return isAllowedAdminUser({
    allowedUserIds,
    isDevelopmentMock,
    userId,
  });
}

export async function getAdminAccess(): Promise<AdminAccess> {
  const user = await getChatGPTUser();
  if (!user) return { kind: "unauthenticated" };
  if (!(await hasAdminAccess(user.userId))) {
    return { kind: "forbidden", user };
  }
  return { kind: "authorized", user };
}

export function adminIdentityLabel(userId: string) {
  const suffix = userId.slice(-6);
  return suffix ? `ID …${suffix}` : "ID VERIFIED";
}
