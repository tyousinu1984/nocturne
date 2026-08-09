import { DatabaseSync } from "node:sqlite";

class SQLiteD1Statement {
  constructor(database, sql, bindings = []) {
    this.database = database;
    this.sql = sql;
    this.bindings = bindings;
  }

  bind(...values) {
    return new SQLiteD1Statement(this.database, this.sql, values);
  }

  async first() {
    return this.database.prepare(this.sql).get(...this.bindings) ?? null;
  }

  async all() {
    return {
      results: this.database.prepare(this.sql).all(...this.bindings),
      meta: { changes: 0 },
    };
  }

  async run() {
    const result = this.database.prepare(this.sql).run(...this.bindings);
    return {
      results: [],
      success: true,
      meta: { changes: Number(result.changes) },
    };
  }

  execute() {
    if (/^\s*(?:SELECT|WITH|PRAGMA)\b/i.test(this.sql)) {
      return this.all();
    }
    return this.run();
  }
}

export function createSQLiteD1() {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  let nextBatchFailureIndex = null;

  return {
    prepare(sql) {
      return new SQLiteD1Statement(database, sql);
    },

    async batch(statements) {
      database.exec("BEGIN IMMEDIATE");
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
        database.exec("COMMIT");
        return results;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },

    failNextBatchAt(index) {
      nextBatchFailureIndex = index;
    },

    query(sql, ...bindings) {
      return database.prepare(sql).all(...bindings);
    },

    execute(sql) {
      database.exec(sql);
    },

    close() {
      database.close();
    },
  };
}
