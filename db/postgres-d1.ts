// `pg` ships as CommonJS with no real ESM named exports — `import { Pool }
// from "pg"` breaks once this file goes through an ESM bundler (confirmed:
// it throws "Named export 'Pool' not found" from the built standalone
// server). Import the default for the runtime value and the types
// separately.
import pg from "pg";
import type { Pool as PoolType, PoolClient } from "pg";
import initialMigration from "../drizzle/0000_round_lily_hollister.sql?raw";
import bookingInquiriesMigration from "../drizzle/0001_left_madelyne_pryor.sql?raw";
import modelApplicationsMigration from "../drizzle/0002_graceful_beyonder.sql?raw";
import modelProfilesMigration from "../drizzle/0003_sparkling_morph.sql?raw";

const { Pool } = pg;

type RunMeta = { changes?: number };
type RunResult = { meta: RunMeta };

// `?` -> `$1, $2, ...` translation lets every existing hand-written SQL
// string in attendance-store.ts / cast-account-store.ts keep using SQLite's
// placeholder style unchanged. Safe here: nothing in this app's SQL
// contains a literal "?" inside a string/text literal.
function toPositionalQuery(query: string) {
  let index = 0;
  return query.replace(/\?/g, () => `$${++index}`);
}

class PostgresD1Statement {
  constructor(
    private readonly executor: PoolType | PoolClient,
    private readonly query: string,
    private readonly bindings: unknown[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new PostgresD1Statement(this.executor, this.query, values);
  }

  /** Rebind this statement's query/bindings onto a specific client — used
   * by batch() to run every statement in a sequence on the same connection
   * (required for BEGIN/COMMIT/ROLLBACK to apply to all of them). */
  withExecutor(executor: PoolType | PoolClient) {
    return new PostgresD1Statement(executor, this.query, this.bindings);
  }

  async first<T>() {
    const result = await this.executor.query(
      toPositionalQuery(this.query),
      this.bindings,
    );
    return (result.rows[0] as T | undefined) ?? null;
  }

  async all<T>() {
    const result = await this.executor.query(
      toPositionalQuery(this.query),
      this.bindings,
    );
    return { results: result.rows as T[], meta: { changes: 0 } };
  }

  async run(): Promise<RunResult> {
    return this.runSync();
  }

  async executeSync() {
    if (/^\s*(?:SELECT|WITH|PRAGMA)\b/i.test(this.query)) {
      const result = await this.executor.query(
        toPositionalQuery(this.query),
        this.bindings,
      );
      return { results: result.rows, meta: { changes: 0 } };
    }
    return this.runSync();
  }

  private async runSync(): Promise<RunResult> {
    const result = await this.executor.query(
      toPositionalQuery(this.query),
      this.bindings,
    );
    return { meta: { changes: result.rowCount ?? 0 } };
  }
}

class PostgresD1 {
  constructor(private readonly pool: PoolType) {}

  prepare(query: string) {
    return new PostgresD1Statement(this.pool, query);
  }

  async batch(statements: PostgresD1Statement[]) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const results = [];
      for (const statement of statements) {
        results.push(await statement.withExecutor(client).executeSync());
      }
      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

const migrations = [
  ["0000_round_lily_hollister", initialMigration],
  ["0001_left_madelyne_pryor", bookingInquiriesMigration],
  ["0002_graceful_beyonder", modelApplicationsMigration],
  ["0003_sparkling_morph", modelProfilesMigration],
] as const;

let pool: PoolType | undefined;
let connectionString: string | undefined;
let binding: PostgresD1 | undefined;
let ready: Promise<void> | undefined;

/**
 * Returns the D1-shaped Postgres binding, only after migrations have been
 * applied — awaiting this is what guarantees callers never race a cold
 * start against `applyMigrations()` still creating tables.
 */
export async function getPostgresD1Binding() {
  const requestedConnectionString = process.env.DATABASE_URL?.trim();
  if (!requestedConnectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!binding || connectionString !== requestedConnectionString) {
    if (binding) {
      throw new Error("The Nocturne database connection changed after initialization.");
    }
    pool = new Pool({ connectionString: requestedConnectionString });
    connectionString = requestedConnectionString;
    binding = new PostgresD1(pool);
    ready = applyMigrations(pool);
  }

  await ready;
  return binding;
}

async function applyMigrations(activePool: PoolType) {
  const client = await activePool.connect();
  try {
    // A session-scoped advisory lock serializes migration application
    // across concurrently-starting replicas (e.g. an ECS service rolling
    // out multiple tasks at once) so they don't race to create the same
    // tables or double-insert migration records. Blocking (not try-lock)
    // is intentional: a replica that loses the race should simply wait,
    // then find every migration already recorded and fall through.
    await client.query("SELECT pg_advisory_lock(hashtext('nocturne_migrations'))");
    await client.query(`
      CREATE TABLE IF NOT EXISTS nocturne_migrations (
        id text PRIMARY KEY NOT NULL,
        applied_at text DEFAULT CURRENT_TIMESTAMP::text NOT NULL
      )
    `);

    for (const [id, sql] of migrations) {
      const { rows } = await client.query(
        "SELECT 1 FROM nocturne_migrations WHERE id = $1 LIMIT 1",
        [id],
      );
      if (rows.length) continue;

      await client.query("BEGIN");
      try {
        for (const statement of sql.split("--> statement-breakpoint")) {
          if (statement.trim()) await client.query(statement);
        }
        await client.query("INSERT INTO nocturne_migrations (id) VALUES ($1)", [id]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('nocturne_migrations'))");
    client.release();
  }
}

export async function getPostgresHealth() {
  const activeBinding = await getPostgresD1Binding();
  // A real round trip (not just "did the pool object construct") is the
  // point here: it proves network reachability, auth and TLS to the
  // database actually work, which was structurally impossible to get wrong
  // with an embedded SQLite file.
  const row = await activeBinding
    .prepare("SELECT COUNT(*) AS total FROM nocturne_migrations")
    .first<{ total: string }>();
  return { total: Number(row?.total ?? 0) };
}
