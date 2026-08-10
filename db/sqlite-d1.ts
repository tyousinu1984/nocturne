import { chmodSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  DatabaseSync,
  type SQLInputValue,
  type StatementSync,
} from "node:sqlite";
import initialMigration from "../drizzle/0000_minor_black_knight.sql?raw";
import snapshotMigration from "../drizzle/0001_chilly_night_thrasher.sql?raw";
import castAccessMigration from "../drizzle/0002_strange_sugar_man.sql?raw";

type RunMeta = { changes?: number };
type RunResult = { meta: RunMeta };

class SQLiteD1Statement {
  constructor(
    private readonly database: DatabaseSync,
    private readonly query: string,
    private readonly bindings: unknown[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new SQLiteD1Statement(this.database, this.query, values);
  }

  async first<T>() {
    return (
      this.statement().get(...(this.bindings as SQLInputValue[])) as
        | T
        | undefined
    ) ?? null;
  }

  async all<T>() {
    return {
      results: this.statement().all(...(this.bindings as SQLInputValue[])) as T[],
      meta: { changes: 0 },
    };
  }

  async run(): Promise<RunResult> {
    return this.runSync();
  }

  executeSync() {
    if (/^\s*(?:SELECT|WITH|PRAGMA)\b/i.test(this.query)) {
      return {
        results: this.statement().all(...(this.bindings as SQLInputValue[])),
        meta: { changes: 0 },
      };
    }
    return this.runSync();
  }

  private statement(): StatementSync {
    return this.database.prepare(this.query);
  }

  private runSync(): RunResult {
    const result = this.statement().run(...(this.bindings as SQLInputValue[]));
    return { meta: { changes: Number(result.changes) } };
  }
}

class SQLiteD1 {
  constructor(private readonly database: DatabaseSync) {}

  prepare(query: string) {
    return new SQLiteD1Statement(this.database, query);
  }

  async batch(statements: SQLiteD1Statement[]) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => statement.executeSync());
      this.database.exec("COMMIT");
      return results;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}

const migrations = [
  ["0000_minor_black_knight", initialMigration],
  ["0001_chilly_night_thrasher", snapshotMigration],
  ["0002_strange_sugar_man", castAccessMigration],
] as const;

let binding: SQLiteD1 | undefined;
let databasePath: string | undefined;

export function getSQLiteD1Binding() {
  const requestedPath =
    process.env.NOCTURNE_DATABASE_PATH?.trim() ||
    resolve(".local-data/nocturne.sqlite");

  if (binding && databasePath === requestedPath) return binding;
  if (binding && databasePath !== requestedPath) {
    throw new Error("The Nocturne database path changed after initialization.");
  }

  mkdirSync(dirname(requestedPath), { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(requestedPath);
  chmodSync(requestedPath, 0o600);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA busy_timeout = 5000");
  applyMigrations(database);

  databasePath = requestedPath;
  binding = new SQLiteD1(database);
  return binding;
}

export function getSQLiteHealth() {
  const sqlite = getSQLiteD1Binding();
  return sqlite
    .prepare("SELECT COUNT(*) AS total FROM nocturne_migrations")
    .first<{ total: number }>();
}

function applyMigrations(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS nocturne_migrations (
      id text PRIMARY KEY NOT NULL,
      applied_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  const applied = database.prepare(
    "SELECT 1 FROM nocturne_migrations WHERE id = ? LIMIT 1",
  );
  const record = database.prepare(
    "INSERT INTO nocturne_migrations (id) VALUES (?)",
  );

  for (const [id, sql] of migrations) {
    if (applied.get(id)) continue;

    database.exec("BEGIN IMMEDIATE");
    try {
      for (const statement of sql.split("--> statement-breakpoint")) {
        if (statement.trim()) database.exec(statement);
      }
      record.run(id);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }
}
