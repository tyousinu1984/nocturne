import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminConsole } from "./admin-console";

export const metadata: Metadata = {
  title: "Operations Console",
  description: "Internal Nocturne content operations workflow probe.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <AdminConsole />;
}
