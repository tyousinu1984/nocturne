import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import pg from "pg";

const { Pool } = pg;
const projectRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://nocturne:nocturne@db:5432/nocturne";
let serverProcess;
let baseUrl;
let serverOutput = "";

before(async () => {
  // This spawned server applies migrations against the database's default
  // `public` schema (unqualified table names, default search_path) — reset
  // it to a clean slate first so repeat runs don't collide with data a
  // previous run left behind (e.g. the "yuna" cast account created by the
  // "authenticated attendance writes persist..." test below).
  const resetPool = new Pool({ connectionString: databaseUrl });
  await resetPool.query("DROP SCHEMA IF EXISTS public CASCADE");
  await resetPool.query("CREATE SCHEMA public");
  await resetPool.end();

  const port = await reservePort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ["dist/standalone/server.js"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      DATABASE_URL: databaseUrl,
      NOCTURNE_SESSION_SECRET:
        "rendered-test-session-secret-with-at-least-thirty-two-characters",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", (chunk) => {
    serverOutput += chunk;
  });
  serverProcess.stderr.on("data", (chunk) => {
    serverOutput += chunk;
  });

  await waitForHealth();
  await seedAnnouncements();
});

after(() => {
  serverProcess?.kill("SIGTERM");
});

async function render(pathname = "/", options = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: { accept: "text/html", ...options.headers },
    redirect: "manual",
  });
}

test("unprefixed paths redirect to a locale, chosen by Accept-Language", async () => {
  // The server sends a relative Location header ("/ja", not an absolute
  // URL) — new URL() needs an explicit base to parse that.
  const locationPath = (response) => new URL(response.headers.get("location"), baseUrl).pathname;

  const noPreference = await render("/");
  assert.equal(noPreference.status, 307);
  assert.equal(locationPath(noPreference), "/ja");

  const english = await render("/", { headers: { "accept-language": "en-US,en;q=0.9" } });
  assert.equal(locationPath(english), "/en");

  const chinese = await render("/", { headers: { "accept-language": "zh-CN,zh;q=0.9" } });
  assert.equal(locationPath(chinese), "/zh");

  const profileRedirect = await render("/profile/aika");
  assert.equal(profileRedirect.status, 307);
  assert.equal(locationPath(profileRedirect), "/ja/profile/aika");
});

test("/api/* and /health are never locale-redirected", async () => {
  const health = await render("/health", { headers: { accept: "application/json" } });
  assert.equal(health.status, 200);

  const publicApi = await render("/api/public/attendance?artist=aika", {
    headers: { accept: "application/json" },
  });
  assert.equal(publicApi.status, 200);
});

test("server-renders the Nocturne catalogue in Japanese by default", async () => {
  const response = await render("/ja");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.doesNotMatch(html, /codex-preview/i);
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<title>キャストディレクトリ \| NOCTURNE TOKYO<\/title>/);
  assert.match(html, /今夜の/);
  // Directory/Reviews/Blog moved to their own pages (/cast/list.html,
  // /reviews.html, /blog.html) — the homepage itself is now Hero + news +
  // today's availability, see app/nocturne.tsx's HomeExperience.
  assert.match(html, /秋の展示会シーズンの予約受付を開始しました/);
  assert.match(html, /本日出勤可能なモデル/);
  assert.match(html, /\/photos-preview\/ren-01\.jpg/);
  assert.match(html, /id="mobile-menu"[^>]*aria-hidden="true"[^>]*inert/i);
  assert.doesNotMatch(html, /hentaitokyo/i);
});

test("server-renders the Nocturne catalogue in English and Chinese", async () => {
  const english = await render("/en");
  assert.equal(english.status, 200);
  const englishHtml = await english.text();
  assert.match(englishHtml, /<html lang="en">/);
  assert.match(englishHtml, /<title>Cast Directory \| NOCTURNE TOKYO<\/title>/);
  assert.match(englishHtml, /AUTUMN EXHIBITION SEASON BOOKING NOW OPEN/);

  const chinese = await render("/zh");
  assert.equal(chinese.status, 200);
  const chineseHtml = await chinese.text();
  assert.match(chineseHtml, /<html lang="zh">/);
  assert.match(chineseHtml, /<title>卡司名录 \| NOCTURNE TOKYO<\/title>/);
  assert.match(chineseHtml, /秋季展会档期预约现已开放/);
});

test("server-renders a cast profile route", async () => {
  // aika is Artist.id 1 in app/data.ts — the public URL scheme keys off
  // this stable numeric id, not the slug (see the note on Artist.id).
  const response = await render("/ja/cast/profile/1.html");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Aika Profile/);
  assert.match(html, /ムーブメントアーティスト/);
  assert.match(html, /Aikaの最新インデックス/);
  assert.match(html, /\/photos-preview\/aika-01\.jpg/);
  assert.match(html, /キャストディレクトリへ戻る/);
});

test("admin fails closed without the trusted reverse-proxy header", async () => {
  const response = await render("/ja/admin");
  assert.equal(response.status, 404);
  assert.doesNotMatch(await response.text(), /運営オペレーション（アルファ版）/);
});

test("admin renders only after the reverse proxy authenticates the operator", async () => {
  const response = await render("/ja/admin", {
    headers: { "x-nocturne-admin-authenticated": "1" },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /運営オペレーション（アルファ版）/);
  // access.ts's adminIdentityLabel() isn't translated (deferred, see the
  // i18n plan) — still English regardless of locale.
  assert.match(html, /STORE ACCESS/i);
  assert.match(html, /スタッフアクセス/);
  assert.match(html, /永続的な PostgreSQL ストレージ/);
  assert.doesNotMatch(html, /store-owner/i);
});

test("staff portal renders in an ordinary browser without an OpenAI account", async () => {
  const response = await render("/ja/staff");
  assert.equal(response.status, 200);
  const html = await response.text();
  // staff-portal.tsx is now translated too (admin/staff i18n round) —
  // the loading-state markup reads in Japanese for /ja.
  assert.match(html, /キャストポータル/);
  assert.match(html, /自分の出勤情報/);
  assert.doesNotMatch(html, /openai|chatgpt|codex/i);
});

test("health confirms the Postgres migration set", async () => {
  const response = await render("/health", {
    headers: { accept: "application/json" },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    app: "nocturne-tokyo",
    storage: "postgres",
    migrations: 4,
  });
});

test("attendance API requires proxy authentication and same-origin writes", async () => {
  const anonymous = await render("/api/admin/attendance", {
    headers: { accept: "application/json" },
  });
  assert.equal(anonymous.status, 401);
  assert.equal((await anonymous.json()).code, "authentication_required");

  const crossOrigin = await render("/api/admin/attendance", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "idempotency-key": "cross-origin",
      "x-nocturne-admin-authenticated": "1",
      origin: "https://malicious.example",
    },
    body: JSON.stringify({ action: "create" }),
  });
  assert.equal(crossOrigin.status, 403);
  assert.equal((await crossOrigin.json()).code, "cross_origin_blocked");
});

test("authenticated attendance writes persist and drive the public projection", async () => {
  const adminHeaders = {
    accept: "application/json",
    "content-type": "application/json",
    "x-nocturne-admin-authenticated": "1",
    origin: baseUrl,
  };
  const accountResponse = await render("/api/admin/cast-accounts", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ action: "create", artistSlug: "yuna" }),
  });
  assert.equal(accountResponse.status, 201);
  const accountResult = await accountResponse.json();
  assert.ok(accountResult.temporaryAccessCode);

  const loginResponse = await render("/api/staff/session", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      origin: baseUrl,
    },
    body: JSON.stringify({
      artistSlug: "yuna",
      credential: accountResult.temporaryAccessCode,
    }),
  });
  assert.equal(loginResponse.status, 200);
  const staffCookie = loginResponse.headers.get("set-cookie");
  assert.ok(staffCookie);

  const staffCommand = async (action, body, key) => {
    const response = await render("/api/staff/attendance", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        origin: baseUrl,
        cookie: staffCookie,
        "idempotency-key": key,
      },
      body: JSON.stringify({ action, ...body }),
    });
    assert.ok(response.ok, `${action} failed with ${response.status}`);
    return response.json();
  };

  const adminCommand = async (action, body, key) => {
    const response = await render("/api/admin/attendance", {
      method: "POST",
      headers: { ...adminHeaders, "idempotency-key": key },
      body: JSON.stringify({ action, ...body }),
    });
    assert.ok(response.ok, `${action} failed with ${response.status}`);
    return response.json();
  };

  let result = await staffCommand(
    "create",
    {
      artistSlug: "yuna",
      serviceDate: "2099-01-12",
      startTime: "18:00",
      endTime: "23:00",
      note: "Node runtime integration test",
    },
    "node-create",
  );
  result = await staffCommand("submit", { attendanceId: result.entry.id, expectedVersion: result.entry.version }, "node-submit");
  result = await adminCommand("approve", { attendanceId: result.entry.id, expectedVersion: result.entry.version }, "node-approve");
  await adminCommand("publish", { attendanceId: result.entry.id, expectedVersion: result.entry.version }, "node-publish");

  const publicResponse = await render("/api/public/attendance?artist=yuna", {
    headers: { accept: "application/json" },
  });
  assert.equal(publicResponse.status, 200);
  const projection = await publicResponse.json();
  assert.equal(projection.availability, "ready");
  assert.equal(projection.managed, true);
  assert.equal(projection.entries.length, 1);

  const resetResponse = await render("/api/admin/cast-accounts", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ action: "rotate_credential", accountId: accountResult.account.id }),
  });
  assert.equal(resetResponse.status, 200);
  const expiredSession = await render("/api/staff/attendance", {
    headers: { accept: "application/json", cookie: staffCookie },
  });
  assert.equal(expiredSession.status, 401);
});

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

// The homepage's "latest news" section (app/nocturne.tsx's HomeNews) reads
// from the announcements table now instead of static dictionary content —
// seed one via the real admin API (same command path an operator would
// use from /admin) so the rendering tests below have something to find.
// Content mirrors scripts/seed-announcements.mjs's first item.
async function seedAnnouncements() {
  const response = await render("/api/admin/announcements", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-nocturne-admin-authenticated": "1",
      origin: baseUrl,
    },
    body: JSON.stringify({
      date: "2026-08-06",
      titleEn: "AUTUMN EXHIBITION SEASON BOOKING NOW OPEN",
      titleJa: "秋の展示会シーズンの予約受付を開始しました",
      titleZh: "秋季展会档期预约现已开放",
      bodyEn: "Reserve models early for October and November trade-show dates.",
      bodyJa: "10月・11月の商談会・展示会向けに、お早めのご予約をおすすめします。",
      bodyZh: "建议提前预约10月、11月的商展档期。",
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to seed a test announcement: ${response.status}`);
  }
}

async function waitForHealth() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Nocturne server exited early.\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch (error) {
      void error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for Nocturne.\n${serverOutput}`);
}
