import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../chatgpt-auth";
import { adminIdentityLabel, hasAdminAccess } from "./access";
import { AdminConsole } from "./admin-console";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations Console",
  description: "Internal Nocturne content operations workflow probe.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!(await hasAdminAccess(user.userId))) notFound();

  return (
    <AdminConsole
      adminUser={{
        displayName: user.displayName,
        identityLabel: adminIdentityLabel(user.userId),
      }}
    />
  );
}
