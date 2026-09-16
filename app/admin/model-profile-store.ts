// Admin-editable overlay on top of app/data.ts's static `artists` array —
// see app/model-data.ts for how the two get merged for public pages. Same
// simple "save = immediately live" spirit as inquiry-store.ts /
// application-store.ts — no draft/review state machine.

export type ModelTier = "Muse" | "Signature" | "New";
export type ModelDistrict = "Aoyama" | "Ginza" | "Daikanyama";
export type ModelStatus = "Tonight" | "This week" | "Private";

export type ModelProfileRecord = {
  slug: string;
  name: string;
  tier: ModelTier;
  district: ModelDistrict;
  status: ModelStatus;
  roleEn: string;
  roleJa: string;
  roleZh: string;
  shortNoteEn: string;
  shortNoteJa: string;
  shortNoteZh: string;
  biographyEn: string;
  biographyJa: string;
  biographyZh: string;
  updatedAt: string;
};

export type ModelProfileD1Statement = {
  bind(...values: unknown[]): ModelProfileD1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes?: number } }>;
};

export type ModelProfileD1 = {
  prepare(query: string): ModelProfileD1Statement;
  batch(statements: ModelProfileD1Statement[]): Promise<Array<{ meta: { changes?: number } }>>;
};

export class ModelProfileError extends Error {
  readonly code: "not_found" | "invalid_input" | "database_error";

  constructor(code: "not_found" | "invalid_input" | "database_error", message: string) {
    super(message);
    this.code = code;
    this.name = "ModelProfileError";
  }
}

export type UpsertModelProfileInput = {
  slug: string;
  name: string;
  tier: ModelTier;
  district: ModelDistrict;
  status: ModelStatus;
  roleEn: string;
  roleJa: string;
  roleZh: string;
  shortNoteEn: string;
  shortNoteJa: string;
  shortNoteZh: string;
  biographyEn: string;
  biographyJa: string;
  biographyZh: string;
};

const modelProfileSelect = `
  SELECT
    slug,
    name,
    tier,
    district,
    status,
    role_en AS "roleEn",
    role_ja AS "roleJa",
    role_zh AS "roleZh",
    short_note_en AS "shortNoteEn",
    short_note_ja AS "shortNoteJa",
    short_note_zh AS "shortNoteZh",
    biography_en AS "biographyEn",
    biography_ja AS "biographyJa",
    biography_zh AS "biographyZh",
    updated_at AS "updatedAt"
  FROM model_profiles
`;

// Kept as Postgres DDL, matching drizzle/0003_sparkling_morph.sql — see
// the "development DDL stays equivalent to the generated migration" test.
// Development/test schema starts empty (unlike production, which is
// seeded via scripts/seed-model-profiles.mjs) — tests that need rows
// insert their own via upsertModelProfile.
export const modelProfileDevelopmentSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS model_profiles (
    slug text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    tier text NOT NULL,
    district text NOT NULL,
    status text NOT NULL,
    role_en text NOT NULL,
    role_ja text NOT NULL,
    role_zh text NOT NULL,
    short_note_en text NOT NULL,
    short_note_ja text NOT NULL,
    short_note_zh text NOT NULL,
    biography_en text NOT NULL,
    biography_ja text NOT NULL,
    biography_zh text NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP::text NOT NULL,
    CONSTRAINT model_profiles_tier_valid CHECK(model_profiles.tier IN ('Muse', 'Signature', 'New')),
    CONSTRAINT model_profiles_district_valid CHECK(model_profiles.district IN ('Aoyama', 'Ginza', 'Daikanyama')),
    CONSTRAINT model_profiles_status_valid CHECK(model_profiles.status IN ('Tonight', 'This week', 'Private'))
  )`,
] as const;

function requireNonEmpty(value: string) {
  return typeof value === "string" && value.trim().length > 0;
}

const validTiers: ModelTier[] = ["Muse", "Signature", "New"];
const validDistricts: ModelDistrict[] = ["Aoyama", "Ginza", "Daikanyama"];
const validStatuses: ModelStatus[] = ["Tonight", "This week", "Private"];

export function validateModelProfileInput(input: UpsertModelProfileInput) {
  if (
    !requireNonEmpty(input.slug) ||
    !requireNonEmpty(input.name) ||
    !validTiers.includes(input.tier) ||
    !validDistricts.includes(input.district) ||
    !validStatuses.includes(input.status) ||
    !requireNonEmpty(input.roleEn) ||
    !requireNonEmpty(input.roleJa) ||
    !requireNonEmpty(input.roleZh) ||
    !requireNonEmpty(input.shortNoteEn) ||
    !requireNonEmpty(input.shortNoteJa) ||
    !requireNonEmpty(input.shortNoteZh) ||
    !requireNonEmpty(input.biographyEn) ||
    !requireNonEmpty(input.biographyJa) ||
    !requireNonEmpty(input.biographyZh)
  ) {
    throw new ModelProfileError("invalid_input", "Required model profile fields are missing or invalid.");
  }
}

export function createModelProfileStore(
  d1: ModelProfileD1,
  { initializeSchema = false }: { initializeSchema?: boolean } = {},
) {
  let schemaReady = false;

  async function ensureSchema() {
    if (!initializeSchema || schemaReady) return;
    await d1.batch(
      modelProfileDevelopmentSchemaStatements.map((statement) => d1.prepare(statement)),
    );
    schemaReady = true;
  }

  async function listModelProfiles(): Promise<ModelProfileRecord[]> {
    await ensureSchema();
    const result = await d1
      .prepare(`${modelProfileSelect} ORDER BY slug ASC`)
      .bind()
      .all<ModelProfileRecord>();
    return result.results;
  }

  async function getModelProfile(slug: string): Promise<ModelProfileRecord | null> {
    await ensureSchema();
    return d1.prepare(`${modelProfileSelect} WHERE slug = ?`).bind(slug).first<ModelProfileRecord>();
  }

  async function upsertModelProfile(
    input: UpsertModelProfileInput,
  ): Promise<ModelProfileRecord> {
    await ensureSchema();
    validateModelProfileInput(input);
    try {
      await d1
        .prepare(
          `INSERT INTO model_profiles
            (slug, name, tier, district, status,
             role_en, role_ja, role_zh,
             short_note_en, short_note_ja, short_note_zh,
             biography_en, biography_ja, biography_zh, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (slug) DO UPDATE SET
             name = EXCLUDED.name,
             tier = EXCLUDED.tier,
             district = EXCLUDED.district,
             status = EXCLUDED.status,
             role_en = EXCLUDED.role_en, role_ja = EXCLUDED.role_ja, role_zh = EXCLUDED.role_zh,
             short_note_en = EXCLUDED.short_note_en, short_note_ja = EXCLUDED.short_note_ja, short_note_zh = EXCLUDED.short_note_zh,
             biography_en = EXCLUDED.biography_en, biography_ja = EXCLUDED.biography_ja, biography_zh = EXCLUDED.biography_zh,
             updated_at = EXCLUDED.updated_at`,
        )
        .bind(
          input.slug,
          input.name.trim(),
          input.tier,
          input.district,
          input.status,
          input.roleEn.trim(),
          input.roleJa.trim(),
          input.roleZh.trim(),
          input.shortNoteEn.trim(),
          input.shortNoteJa.trim(),
          input.shortNoteZh.trim(),
          input.biographyEn.trim(),
          input.biographyJa.trim(),
          input.biographyZh.trim(),
          new Date().toISOString(),
        )
        .run();
    } catch (error) {
      throw mapDatabaseError(error);
    }

    const record = await getModelProfile(input.slug);
    if (!record) {
      throw new ModelProfileError(
        "database_error",
        "Model profile was written but could not be read back.",
      );
    }
    return record;
  }

  return { ensureSchema, listModelProfiles, getModelProfile, upsertModelProfile };
}

function mapDatabaseError(error: unknown) {
  return new ModelProfileError("database_error", "Model profile could not be saved.");
}

async function runtimeModelProfileStore() {
  try {
    const { getD1Binding } = await import("../../db");
    return createModelProfileStore(await getD1Binding());
  } catch (error) {
    throw mapDatabaseError(error);
  }
}

export async function ensureModelProfileSchemaForDevelopment() {
  await (await runtimeModelProfileStore()).ensureSchema();
}

export async function listModelProfiles() {
  return (await runtimeModelProfileStore()).listModelProfiles();
}

export async function getModelProfile(slug: string) {
  return (await runtimeModelProfileStore()).getModelProfile(slug);
}

export async function upsertModelProfile(input: UpsertModelProfileInput) {
  return (await runtimeModelProfileStore()).upsertModelProfile(input);
}
