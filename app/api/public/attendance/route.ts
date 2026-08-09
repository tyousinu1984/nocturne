import { artists } from "../../../data";
import { listPublicAttendance } from "../../../admin/attendance-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const artistSlug = url.searchParams.get("artist")?.trim() ?? "";
  if (!artists.some((artist) => artist.slug === artistSlug)) {
    return Response.json(
      { error: "Choose a valid cast profile." },
      { status: 400 },
    );
  }

  try {
    const projection = await listPublicAttendance(artistSlug);
    return Response.json({ availability: "ready", ...projection }, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        availability: "unavailable",
        entries: [],
      },
      {
        status: 503,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
