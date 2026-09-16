// One-time seed: carries over the 3 placeholder promo items that used to
// live as static dictionary.homeNews.items content (now removed — see
// app/nocturne.tsx's HomeNews, which reads from the announcements table
// via app/admin/announcement-store.ts instead) so the homepage doesn't go
// blank when this ships. Not idempotent by content (re-running adds
// duplicates) — this is meant to run exactly once.
//   docker compose run --rm dev node --experimental-strip-types scripts/seed-announcements.mjs
import { randomUUID } from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://nocturne:nocturne@db:5432/nocturne",
});

const items = [
  {
    date: "2026-08-06",
    titleEn: "AUTUMN EXHIBITION SEASON BOOKING NOW OPEN",
    titleJa: "秋の展示会シーズンの予約受付を開始しました",
    titleZh: "秋季展会档期预约现已开放",
    bodyEn:
      "Reserve models early for October and November trade-show dates — placeholder promotional copy.",
    bodyJa:
      "10月・11月の商談会・展示会向けに、お早めのご予約をおすすめします（仮の告知文です）。",
    bodyZh: "建议提前预约10月、11月的商展档期（占位宣传文案）。",
  },
  {
    date: "2026-08-02",
    titleEn: "TWO NEW MODELS JOINED THE ROSTER",
    titleJa: "新しいモデルが2名加わりました",
    titleZh: "新增两位模特加入阵容",
    bodyEn: "Kei and Nami are now available for booking. See their full profiles on the cast list.",
    bodyJa: "KeiとNamiがご予約いただけるようになりました。キャスト一覧で詳しいプロフィールをご覧いただけます。",
    bodyZh: "Kei 和 Nami 现已可预约，详细资料请见卡司列表。",
  },
  {
    date: "2026-07-24",
    titleEn: "MULTI-DAY BOOKING DISCOUNT",
    titleJa: "複数日予約の割引について",
    titleZh: "连续多日预约优惠",
    bodyEn:
      "Book the same model for 3+ consecutive event days and ask about a bundled rate — placeholder promotional copy.",
    bodyJa: "同じモデルを3日以上連続でご予約いただく場合、割引プランをご案内できます（仮の告知文です）。",
    bodyZh: "同一模特连续预约3天以上活动，可咨询组合优惠方案（占位宣传文案）。",
  },
];

async function main() {
  for (const item of items) {
    const id = `news_${randomUUID()}`;
    await pool.query(
      `INSERT INTO announcements
        (id, date, title_en, title_ja, title_zh, body_en, body_ja, body_zh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, item.date, item.titleEn, item.titleJa, item.titleZh, item.bodyEn, item.bodyJa, item.bodyZh],
    );
    console.log(`seeded ${id} (${item.date})`);
  }
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
