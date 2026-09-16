// Booking inquiries submitted from /contact.html. Deliberately much
// simpler than attendance-store.ts / cast-account-store.ts: no state
// machine, no audit-event table, no idempotency handling — just a record
// staff can list and mark contacted/confirmed/cancelled. See the project
// plan's Phase 2 note: "简单的提交+人工回访", not a real booking system.

export type InquiryStatus = "new" | "contacted" | "confirmed" | "cancelled";

export type BookingInquiryRecord = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  headcount: number;
  message: string;
  status: InquiryStatus;
  staffNote: string;
  createdAt: string;
  updatedAt: string;
};

export type InquiryD1Statement = {
  bind(...values: unknown[]): InquiryD1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
};

export type InquiryD1 = {
  prepare(query: string): InquiryD1Statement;
  batch(statements: InquiryD1Statement[]): Promise<Array<{ meta: { changes?: number } }>>;
};

export class InquiryError extends Error {
  readonly code: "not_found" | "invalid_input" | "database_error";

  constructor(code: "not_found" | "invalid_input" | "database_error", message: string) {
    super(message);
    this.code = code;
    this.name = "InquiryError";
  }
}

export type SubmitInquiryInput = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  headcount: number;
  message: string;
};

// Aliases double-quoted so Postgres preserves the camelCase spelling — see
// the matching comment on attendance-store.ts's entrySelect.
const inquirySelect = `
  SELECT
    id,
    company_name AS "companyName",
    contact_name AS "contactName",
    email,
    phone,
    event_name AS "eventName",
    event_date AS "eventDate",
    event_location AS "eventLocation",
    headcount,
    message,
    status,
    staff_note AS "staffNote",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM booking_inquiries
`;

// Kept as Postgres DDL, matching drizzle/0001_left_madelyne_pryor.sql — see
// the "development DDL stays equivalent to the generated migration" test.
export const bookingInquiryDevelopmentSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS booking_inquiries (
    id text PRIMARY KEY NOT NULL,
    company_name text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL,
    phone text DEFAULT '' NOT NULL,
    event_name text NOT NULL,
    event_date text NOT NULL,
    event_location text NOT NULL,
    headcount integer DEFAULT 1 NOT NULL,
    message text DEFAULT '' NOT NULL,
    status text DEFAULT 'new' NOT NULL,
    staff_note text DEFAULT '' NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
    CONSTRAINT booking_inquiries_status_valid CHECK(booking_inquiries.status IN ('new', 'contacted', 'confirmed', 'cancelled')),
    CONSTRAINT booking_inquiries_headcount_positive CHECK(booking_inquiries.headcount >= 1)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_booking_inquiries_status_created
    ON booking_inquiries (status, created_at)`,
] as const;

function requireNonEmpty(value: string) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateInquiryInput(input: SubmitInquiryInput) {
  if (
    !requireNonEmpty(input.companyName) ||
    !requireNonEmpty(input.contactName) ||
    !requireNonEmpty(input.email) ||
    !requireNonEmpty(input.eventName) ||
    !requireNonEmpty(input.eventDate) ||
    !requireNonEmpty(input.eventLocation) ||
    !Number.isInteger(input.headcount) ||
    input.headcount < 1
  ) {
    throw new InquiryError("invalid_input", "Required inquiry fields are missing or invalid.");
  }
}

export function createInquiryStore(
  d1: InquiryD1,
  { initializeSchema = false }: { initializeSchema?: boolean } = {},
) {
  let schemaReady = false;

  async function ensureSchema() {
    if (!initializeSchema || schemaReady) return;
    await d1.batch(
      bookingInquiryDevelopmentSchemaStatements.map((statement) => d1.prepare(statement)),
    );
    schemaReady = true;
  }

  async function submitInquiry(input: SubmitInquiryInput): Promise<BookingInquiryRecord> {
    await ensureSchema();
    validateInquiryInput(input);
    const id = `inq_${crypto.randomUUID()}`;
    try {
      await d1
        .prepare(
          `INSERT INTO booking_inquiries
            (id, company_name, contact_name, email, phone, event_name, event_date, event_location, headcount, message)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          input.companyName.trim(),
          input.contactName.trim(),
          input.email.trim(),
          input.phone.trim(),
          input.eventName.trim(),
          input.eventDate.trim(),
          input.eventLocation.trim(),
          input.headcount,
          input.message.trim(),
        )
        .run();
    } catch (error) {
      throw mapDatabaseError(error);
    }

    const record = await d1
      .prepare(`${inquirySelect} WHERE id = ?`)
      .bind(id)
      .first<BookingInquiryRecord>();
    if (!record) {
      throw new InquiryError("database_error", "Inquiry was written but could not be read back.");
    }
    return record;
  }

  async function listInquiriesForAdmin(): Promise<BookingInquiryRecord[]> {
    await ensureSchema();
    const result = await d1
      .prepare(`${inquirySelect} ORDER BY created_at DESC`)
      .bind()
      .all<BookingInquiryRecord>();
    return result.results;
  }

  async function updateInquiryStatus({
    id,
    status,
    staffNote,
  }: {
    id: string;
    status: InquiryStatus;
    staffNote: string;
  }): Promise<BookingInquiryRecord> {
    await ensureSchema();
    const now = new Date().toISOString();
    const result = await d1
      .prepare(
        `UPDATE booking_inquiries
         SET status = ?, staff_note = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(status, staffNote, now, id)
      .run();
    if (!result.meta.changes) {
      throw new InquiryError("not_found", "Inquiry not found.");
    }
    const record = await d1
      .prepare(`${inquirySelect} WHERE id = ?`)
      .bind(id)
      .first<BookingInquiryRecord>();
    if (!record) {
      throw new InquiryError("database_error", "Inquiry was updated but could not be read back.");
    }
    return record;
  }

  return { ensureSchema, submitInquiry, listInquiriesForAdmin, updateInquiryStatus };
}

function mapDatabaseError(error: unknown) {
  return new InquiryError("database_error", "Inquiry could not be saved.");
}

async function runtimeInquiryStore() {
  try {
    const { getD1Binding } = await import("../../db");
    return createInquiryStore(await getD1Binding());
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function ensureInquirySchemaForDevelopment() {
  await (await runtimeInquiryStore()).ensureSchema();
}

export async function submitInquiry(input: SubmitInquiryInput) {
  return (await runtimeInquiryStore()).submitInquiry(input);
}

export async function listInquiriesForAdmin() {
  return (await runtimeInquiryStore()).listInquiriesForAdmin();
}

export async function updateInquiryStatus(params: {
  id: string;
  status: InquiryStatus;
  staffNote: string;
}) {
  return (await runtimeInquiryStore()).updateInquiryStatus(params);
}
