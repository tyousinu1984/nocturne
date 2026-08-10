import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { adminIdentityLabel, getAdminAccess } from "./access";
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
  const access = await getAdminAccess();
  if (access.kind !== "authorized") notFound();

  return (
    <AdminConsole
      adminUser={{
        displayName: access.user.displayName,
        identityLabel: adminIdentityLabel(),
      }}
    />
  );
}
