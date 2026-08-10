import { headers } from "next/headers";
import { ADMIN_AUTHENTICATED_HEADER } from "./auth-headers";

export type AdminUser = {
  userId: string;
  displayName: string;
};

export type AdminAccess =
  | { kind: "authorized"; user: AdminUser }
  | { kind: "unauthenticated" };

export async function getAdminAccess(): Promise<AdminAccess> {
  const requestHeaders = await headers();
  if (requestHeaders.get(ADMIN_AUTHENTICATED_HEADER) !== "1") {
    return { kind: "unauthenticated" };
  }

  return {
    kind: "authorized",
    user: {
      userId: "store-owner",
      displayName: "Store Operator",
    },
  };
}

export function adminIdentityLabel() {
  return "STORE ACCESS";
}
