import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

function toPositionalQuery(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

class PostgresD1Statement {
  constructor(client, sql, bindings = []) {
    this.client = client;
    this.sql = sql;
    this.bindings = bindings;
  }

  bind(...values) {
    return new PostgresD1Statement(this.client, this.sql, values);
  }

  async first() {
    const result = await this.client.query(toPositionalQuery(this.sql), this.bindings);
    return result.rows[0] ?? null;
  }

  async all() {
    const result = await this.client.query(toPositionalQuery(this.sql), this.bindings);
    return { results: result.rows, meta: { changes: 0 } };
  }

  async run() {
    const result = await this.client.query(toPositionalQuery(this.sql), this.bindings);
    return {
      results: [],
      success: true,
      meta: { changes: result.rowCount ?? 0 },
    };
  }

  async execute() {
    if (/^\s*(?:SELECT|WITH)\b/i.test(this.sql)) {
      return this.all();
    }
    return this.run();
  }
}

// Each test gets its own dedicated connection (not a query pulled from a
// shared pool) so that `SET search_path` sticks for every query this D1
// instance issues, and its own schema so tests never see each other's
// tables/rows — the isolation property the old per-test `:memory:` SQLite
// database gave for free.
export async function createPostgresD1() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgres://nocturne:nocturne@db:5432/nocturne";
  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();
  const schemaName = `test_${randomUUID().replaceAll("-", "_")}`;
  await client.query(`CREATE SCHEMA "${schemaName}"`);
  await client.query(`SET search_path TO "${schemaName}"`);

  let nextBatchFailureIndex = null;

  return {
    schemaName,

    prepare(sql) {
      return new PostgresD1Statement(client, sql);
    },

    async batch(statements) {
      await client.query("BEGIN");
      try {
        const results = [];
        const failureIndex = nextBatchFailureIndex;
        nextBatchFailureIndex = null;
        for (const [index, statement] of statements.entries()) {
          if (index === failureIndex) {
            throw new Error(`Injected D1 batch failure at statement ${index}`);
          }
          results.push(await statement.execute());
        }
        await client.query("COMMIT");
        return results;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    },

    failNextBatchAt(index) {
      nextBatchFailureIndex = index;
    },

    async query(sql, ...bindings) {
      const result = await client.query(toPositionalQuery(sql), bindings);
      return result.rows;
    },

    async execute(sql) {
      await client.query(sql);
    },

    async close() {
      await client.query(`DROP SCHEMA "${schemaName}" CASCADE`);
      client.release();
      await pool.end();
    },
  };
}
