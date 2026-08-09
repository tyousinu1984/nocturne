import type { Metadata } from "next";
import { headers } from "next/headers";
import { ADMIN_ALLOWLIST_HEADER } from "../admin/auth-headers";
import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Site identity verification",
  robots: { index: false, follow: false },
};

export default async function SiteIdentityPage() {
  const user = await requireChatGPTUser("/site-identity");
  const requestHeaders = await headers();
  const allowedUserIds =
    requestHeaders
      .get(ADMIN_ALLOWLIST_HEADER)
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  return (
    <main>
      <h1>Site identity verification</h1>
      <p>This page displays only the current signed-in user&apos;s site ID.</p>
      <code>{user.userId}</code>
      <p>Allowlist binding present: {allowedUserIds.length > 0 ? "yes" : "no"}</p>
      <p>Allowlist entry count: {allowedUserIds.length}</p>
      <p>
        Current identity matches allowlist:{" "}
        {allowedUserIds.includes(user.userId) ? "yes" : "no"}
      </p>
    </main>
  );
}
