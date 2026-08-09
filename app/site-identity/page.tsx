import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Site identity verification",
  robots: { index: false, follow: false },
};

export default async function SiteIdentityPage() {
  const user = await requireChatGPTUser("/site-identity");

  return (
    <main>
      <h1>Site identity verification</h1>
      <p>This page displays only the current signed-in user&apos;s site ID.</p>
      <code>{user.userId}</code>
    </main>
  );
}
