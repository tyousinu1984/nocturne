// Homepage promotions/event announcements (HomeNews — see
// app/nocturne.tsx). No status machine: create/update/delete take effect
// immediately, same spirit as inquiry-store.ts / application-store.ts /
// model-profile-store.ts.

export type AnnouncementRecord = {
  id: string;
  date: string;
  titleEn: string;
  titleJa: string;
  titleZh: string;
  bodyEn: string;
  bodyJa: string;
  bodyZh: string;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementD1Statement = {
  bind(...values: unknown[]): AnnouncementD1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
};

export type AnnouncementD1 = {
  prepare(query: string): AnnouncementD1Statement;
  batch(statements: AnnouncementD1Statement[]): Promise<Array<{ meta: { changes?: number } }>>;
};

export class AnnouncementError extends Error {
  readonly code: "not_found" | "invalid_input" | "database_error";

  constructor(code: "not_found" | "invalid_input" | "database_error", message: string) {
    super(message);
    this.code = code;
    this.name = "AnnouncementError";
  }
}

export type SaveAnnouncementInput = {
  date: string;
  titleEn: string;
  titleJa: string;
  titleZh: string;
  bodyEn: string;
  bodyJa: string;
  bodyZh: string;
};

const announcementSelect = `
  SELECT
    id,
    date,
    title_en AS "titleEn",
    title_ja AS "titleJa",
    title_zh AS "titleZh",
    body_en AS "bodyEn",
    body_ja AS "bodyJa",
    body_zh AS "bodyZh",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM announcements
`;

// Kept as Postgres DDL, matching drizzle/0003_sparkling_morph.sql — see
// the "development DDL stays equivalent to the generated migration" test.
export const announcementDevelopmentSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS announcements (
    id text PRIMARY KEY NOT NULL,
    date text NOT NULL,
    title_en text NOT NULL,
    title_ja text NOT NULL,
    title_zh text NOT NULL,
    body_en text NOT NULL,
    body_ja text NOT NULL,
    body_zh text NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP::text NOT NULL
  )`,
] as const;

function requireNonEmpty(value: string) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateAnnouncementInput(input: SaveAnnouncementInput) {
  if (
    !requireNonEmpty(input.date) ||
    !requireNonEmpty(input.titleEn) ||
    !requireNonEmpty(input.titleJa) ||
    !requireNonEmpty(input.titleZh) ||
    !requireNonEmpty(input.bodyEn) ||
    !requireNonEmpty(input.bodyJa) ||
    !requireNonEmpty(input.bodyZh)
  ) {
    throw new AnnouncementError("invalid_input", "Required announcement fields are missing or invalid.");
  }
}

export function createAnnouncementStore(
  d1: AnnouncementD1,
  { initializeSchema = false }: { initializeSchema?: boolean } = {},
) {
  let schemaReady = false;

  async function ensureSchema() {
    if (!initializeSchema || schemaReady) return;
    await d1.batch(
      announcementDevelopmentSchemaStatements.map((statement) => d1.prepare(statement)),
    );
    schemaReady = true;
  }

  async function listAnnouncements(limit = 20): Promise<AnnouncementRecord[]> {
    await ensureSchema();
    const result = await d1
      .prepare(`${announcementSelect} ORDER BY date DESC, created_at DESC LIMIT ?`)
      .bind(limit)
      .all<AnnouncementRecord>();
    return result.results;
  }

  async function createAnnouncement(
    input: SaveAnnouncementInput,
  ): Promise<AnnouncementRecord> {
    await ensureSchema();
    validateAnnouncementInput(input);
    const id = `news_${crypto.randomUUID()}`;
    try {
      await d1
        .prepare(
          `INSERT INTO announcements
            (id, date, title_en, title_ja, title_zh, body_en, body_ja, body_zh)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          input.date.trim(),
          input.titleEn.trim(),
          input.titleJa.trim(),
          input.titleZh.trim(),
          input.bodyEn.trim(),
          input.bodyJa.trim(),
          input.bodyZh.trim(),
        )
        .run();
    } catch (error) {
      throw mapDatabaseError(error);
    }

    const record = await d1
      .prepare(`${announcementSelect} WHERE id = ?`)
      .bind(id)
      .first<AnnouncementRecord>();
    if (!record) {
      throw new AnnouncementError(
        "database_error",
        "Announcement was written but could not be read back.",
      );
    }
    return record;
  }

  async function updateAnnouncement(
    id: string,
    input: SaveAnnouncementInput,
  ): Promise<AnnouncementRecord> {
    await ensureSchema();
    validateAnnouncementInput(input);
    const result = await d1
      .prepare(
        `UPDATE announcements
         SET date = ?, title_en = ?, title_ja = ?, title_zh = ?,
             body_en = ?, body_ja = ?, body_zh = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        input.date.trim(),
        input.titleEn.trim(),
        input.titleJa.trim(),
        input.titleZh.trim(),
        input.bodyEn.trim(),
        input.bodyJa.trim(),
        input.bodyZh.trim(),
        new Date().toISOString(),
        id,
      )
      .run();
    if (!result.meta.changes) {
      throw new AnnouncementError("not_found", "Announcement not found.");
    }
    const record = await d1
      .prepare(`${announcementSelect} WHERE id = ?`)
      .bind(id)
      .first<AnnouncementRecord>();
    if (!record) {
      throw new AnnouncementError(
        "database_error",
        "Announcement was updated but could not be read back.",
      );
    }
    return record;
  }

  async function deleteAnnouncement(id: string): Promise<void> {
    await ensureSchema();
    const result = await d1.prepare(`DELETE FROM announcements WHERE id = ?`).bind(id).run();
    if (!result.meta.changes) {
      throw new AnnouncementError("not_found", "Announcement not found.");
    }
  }

  return {
    ensureSchema,
    listAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
}

function mapDatabaseError(error: unknown) {
  return new AnnouncementError("database_error", "Announcement could not be saved.");
}

async function runtimeAnnouncementStore() {
  try {
    const { getD1Binding } = await import("../../db");
    return createAnnouncementStore(await getD1Binding());
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function ensureAnnouncementSchemaForDevelopment() {
  await (await runtimeAnnouncementStore()).ensureSchema();
}

export async function listAnnouncements(limit?: number) {
  return (await runtimeAnnouncementStore()).listAnnouncements(limit);
}

export async function createAnnouncement(input: SaveAnnouncementInput) {
  return (await runtimeAnnouncementStore()).createAnnouncement(input);
}

export async function updateAnnouncement(id: string, input: SaveAnnouncementInput) {
  return (await runtimeAnnouncementStore()).updateAnnouncement(id, input);
}

export async function deleteAnnouncement(id: string) {
  return (await runtimeAnnouncementStore()).deleteAnnouncement(id);
}
