import type { Metadata } from "next";
import { StaffPortal } from "./staff-portal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cast Portal | NOCTURNE TOKYO",
  description: "Private attendance portal for Nocturne cast members.",
  robots: { index: false, follow: false },
};

export default function StaffPage() {
  return <StaffPortal />;
}
