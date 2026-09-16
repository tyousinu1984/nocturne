// Model applications submitted from /recruit.html. Same shape/spirit as
// inquiry-store.ts: no state machine, no audit-event table, just a record
// staff can list and mark contacted/hired/rejected.

export type ApplicationStatus = "new" | "contacted" | "hired" | "rejected";

export type ModelApplicationRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  portfolioUrl: string;
  experience: string;
  message: string;
  status: ApplicationStatus;
  staffNote: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationD1Statement = {
  bind(...values: unknown[]): ApplicationD1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
};

export type ApplicationD1 = {
  prepare(query: string): ApplicationD1Statement;
  batch(statements: ApplicationD1Statement[]): Promise<Array<{ meta: { changes?: number } }>>;
};

export class ApplicationError extends Error {
  readonly code: "not_found" | "invalid_input" | "database_error";

  constructor(code: "not_found" | "invalid_input" | "database_error", message: string) {
    super(message);
    this.code = code;
    this.name = "ApplicationError";
  }
}

export type SubmitApplicationInput = {
  name: string;
  email: string;
  phone: string;
  portfolioUrl: string;
  experience: string;
  message: string;
};

// Aliases double-quoted so Postgres preserves the camelCase spelling — see
// the matching comment on attendance-store.ts's entrySelect.
const applicationSelect = `
  SELECT
    id,
    name,
    email,
    phone,
    portfolio_url AS "portfolioUrl",
    experience,
    message,
    status,
    staff_note AS "staffNote",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM model_applications
`;

// Kept as Postgres DDL, matching drizzle/0002_graceful_beyonder.sql — see
// the "development DDL stays equivalent to the generated migration" test.
export const modelApplicationDevelopmentSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS model_applications (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text DEFAULT '' NOT NULL,
    portfolio_url text DEFAULT '' NOT NULL,
    experience text DEFAULT '' NOT NULL,
    message text DEFAULT '' NOT NULL,
    status text DEFAULT 'new' NOT NULL,
    staff_note text DEFAULT '' NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
    CONSTRAINT model_applications_status_valid CHECK(model_applications.status IN ('new', 'contacted', 'hired', 'rejected'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_model_applications_status_created
    ON model_applications (status, created_at)`,
] as const;

function requireNonEmpty(value: string) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateApplicationInput(input: SubmitApplicationInput) {
  if (!requireNonEmpty(input.name) || !requireNonEmpty(input.email)) {
    throw new ApplicationError("invalid_input", "Required application fields are missing or invalid.");
  }
}

export function createApplicationStore(
  d1: ApplicationD1,
  { initializeSchema = false }: { initializeSchema?: boolean } = {},
) {
  let schemaReady = false;

  async function ensureSchema() {
    if (!initializeSchema || schemaReady) return;
    await d1.batch(
      modelApplicationDevelopmentSchemaStatements.map((statement) => d1.prepare(statement)),
    );
    schemaReady = true;
  }

  async function submitApplication(
    input: SubmitApplicationInput,
  ): Promise<ModelApplicationRecord> {
    await ensureSchema();
    validateApplicationInput(input);
    const id = `app_${crypto.randomUUID()}`;
    try {
      await d1
        .prepare(
          `INSERT INTO model_applications
            (id, name, email, phone, portfolio_url, experience, message)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          input.name.trim(),
          input.email.trim(),
          input.phone.trim(),
          input.portfolioUrl.trim(),
          input.experience.trim(),
          input.message.trim(),
        )
        .run();
    } catch (error) {
      throw mapDatabaseError(error);
    }

    const record = await d1
      .prepare(`${applicationSelect} WHERE id = ?`)
      .bind(id)
      .first<ModelApplicationRecord>();
    if (!record) {
      throw new ApplicationError(
        "database_error",
        "Application was written but could not be read back.",
      );
    }
    return record;
  }

  async function listApplicationsForAdmin(): Promise<ModelApplicationRecord[]> {
    await ensureSchema();
    const result = await d1
      .prepare(`${applicationSelect} ORDER BY created_at DESC`)
      .bind()
      .all<ModelApplicationRecord>();
    return result.results;
  }

  async function updateApplicationStatus({
    id,
    status,
    staffNote,
  }: {
    id: string;
    status: ApplicationStatus;
    staffNote: string;
  }): Promise<ModelApplicationRecord> {
    await ensureSchema();
    const now = new Date().toISOString();
    const result = await d1
      .prepare(
        `UPDATE model_applications
         SET status = ?, staff_note = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(status, staffNote, now, id)
      .run();
    if (!result.meta.changes) {
      throw new ApplicationError("not_found", "Application not found.");
    }
    const record = await d1
      .prepare(`${applicationSelect} WHERE id = ?`)
      .bind(id)
      .first<ModelApplicationRecord>();
    if (!record) {
      throw new ApplicationError(
        "database_error",
        "Application was updated but could not be read back.",
      );
    }
    return record;
  }

  return {
    ensureSchema,
    submitApplication,
    listApplicationsForAdmin,
    updateApplicationStatus,
  };
}

function mapDatabaseError(error: unknown) {
  return new ApplicationError("database_error", "Application could not be saved.");
}

async function runtimeApplicationStore() {
  try {
    const { getD1Binding } = await import("../../db");
    return createApplicationStore(await getD1Binding());
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function ensureApplicationSchemaForDevelopment() {
  await (await runtimeApplicationStore()).ensureSchema();
}

export async function submitApplication(input: SubmitApplicationInput) {
  return (await runtimeApplicationStore()).submitApplication(input);
}

export async function listApplicationsForAdmin() {
  return (await runtimeApplicationStore()).listApplicationsForAdmin();
}

export async function updateApplicationStatus(params: {
  id: string;
  status: ApplicationStatus;
  staffNote: string;
}) {
  return (await runtimeApplicationStore()).updateApplicationStatus(params);
}
