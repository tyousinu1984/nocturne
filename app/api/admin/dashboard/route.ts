import { getAdminAccess } from "../../../admin/access";
import { listAttendanceForAdmin } from "../../../admin/attendance-store";
import { listInquiriesForAdmin } from "../../../admin/inquiry-store";
import { listApplicationsForAdmin } from "../../../admin/application-store";
import { addDaysTokyo, todayInTokyo } from "../../../admin/tokyo-date";

export const dynamic = "force-dynamic";

// The "at a glance" overview behind /admin's Dashboard tab: the next 7
// days' attendance across every model (not just what's already published —
// drafts/pending/approved show too, with their status badge, since the
// point is operational planning, not just what's publicly live already),
// plus how many booking inquiries / model applications are still
// unactioned. Deliberately just counts for the latter two — there's no
// admin list/detail view for inquiries or applications yet (the stores
// have been ready since the contact/recruit forms shipped, but nothing
// in /admin reads them) and building a full management view is a
// separate piece of work.
export async function GET() {
  const access = await getAdminAccess();
  if (access.kind === "unauthenticated") {
    return Response.json(
      { error: "Authentication required.", code: "authentication_required" },
      { status: 401 },
    );
  }

  try {
    const [attendance, inquiries, applications] = await Promise.all([
      listAttendanceForAdmin(),
      listInquiriesForAdmin(),
      listApplicationsForAdmin(),
    ]);

    const today = todayInTokyo();
    const days = Array.from({ length: 7 }, (_, index) => addDaysTokyo(today, index));
    const relevantEntries = attendance.entries.filter(
      (entry) => entry.status !== "rejected" && entry.status !== "cancelled",
    );
    const week = days.map((date) => ({
      date,
      entries: relevantEntries
        .filter((entry) => entry.serviceDate === date)
        .map((entry) => ({
          artistSlug: entry.artistSlug,
          startTime: entry.startTime,
          endTime: entry.endTime,
          status: entry.status,
        }))
        .sort((left, right) => left.startTime.localeCompare(right.startTime)),
    }));

    return Response.json(
      {
        week,
        pendingInquiries: inquiries.filter((inquiry) => inquiry.status === "new").length,
        pendingApplications: applications.filter((application) => application.status === "new").length,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Dashboard data is unavailable." },
      { status: 503 },
    );
  }
}
