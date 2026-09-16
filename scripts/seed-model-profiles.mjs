// One-time seed: copies the current app/data.ts + i18n/dictionaries/*.ts
// artist content into the new model_profiles table, so switching the
// public site over to reading from the DB (see app/model-data.ts) doesn't
// regress anything visually. Idempotent (upsert) — safe to re-run.
//
// Run inside the `dev` container, which has the full source tree (the
// `app` container only ships the bundled standalone output):
//   docker compose run --rm dev node --experimental-strip-types scripts/seed-model-profiles.mjs
import pg from "pg";
import { artists } from "../app/data.ts";
import { en } from "../i18n/dictionaries/en.ts";
import { ja } from "../i18n/dictionaries/ja.ts";
import { zh } from "../i18n/dictionaries/zh.ts";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://nocturne:nocturne@db:5432/nocturne",
});

function translationFor(dictionary, slug, fallback) {
  const translation = dictionary.artists[slug];
  return {
    role: translation?.role ?? fallback.role,
    shortNote: translation?.shortNote ?? fallback.shortNote,
    biography: translation?.biography ?? fallback.biography,
  };
}

async function main() {
  for (const artist of artists) {
    const enText = translationFor(en, artist.slug, artist);
    const jaText = translationFor(ja, artist.slug, artist);
    const zhText = translationFor(zh, artist.slug, artist);

    await pool.query(
      `INSERT INTO model_profiles
        (slug, name, tier, district, status,
         role_en, role_ja, role_zh,
         short_note_en, short_note_ja, short_note_zh,
         biography_en, biography_ja, biography_zh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         tier = EXCLUDED.tier,
         district = EXCLUDED.district,
         status = EXCLUDED.status,
         role_en = EXCLUDED.role_en, role_ja = EXCLUDED.role_ja, role_zh = EXCLUDED.role_zh,
         short_note_en = EXCLUDED.short_note_en, short_note_ja = EXCLUDED.short_note_ja, short_note_zh = EXCLUDED.short_note_zh,
         biography_en = EXCLUDED.biography_en, biography_ja = EXCLUDED.biography_ja, biography_zh = EXCLUDED.biography_zh,
         updated_at = CURRENT_TIMESTAMP::text`,
      [
        artist.slug,
        artist.name,
        artist.tier,
        artist.district,
        artist.status,
        enText.role,
        jaText.role,
        zhText.role,
        enText.shortNote,
        jaText.shortNote,
        zhText.shortNote,
        enText.biography,
        jaText.biography,
        zhText.biography,
      ],
    );
    console.log(`seeded ${artist.slug}`);
  }
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
