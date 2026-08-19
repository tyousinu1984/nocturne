import { getPostgresHealth } from "../../db/postgres-d1";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const migrationState = await getPostgresHealth();
    return Response.json(
      {
        status: "ok",
        app: "nocturne-tokyo",
        storage: "postgres",
        migrations: Number(migrationState?.total ?? 0),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "error", app: "nocturne-tokyo" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
