import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const projectRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
let serverProcess;
let baseUrl;
let temporaryDirectory;
let serverOutput = "";

before(async () => {
  const port = await reservePort();
  temporaryDirectory = mkdtempSync(join(tmpdir(), "nocturne-node-test-"));
  baseUrl = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, ["dist/standalone/server.js"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      NOCTURNE_DATABASE_PATH: join(temporaryDirectory, "nocturne.sqlite"),
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
});

after(() => {
  serverProcess?.kill("SIGTERM");
  if (temporaryDirectory) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

async function render(pathname = "/", options = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: { accept: "text/html", ...options.headers },
    redirect: "manual",
  });
}

test("server-renders the Nocturne catalogue", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.doesNotMatch(html, /codex-preview/i);
  assert.match(html, /<title>Cast Directory \| NOCTURNE TOKYO<\/title>/i);
  assert.match(html, /TONIGHT/);
  assert.match(html, /MEET THE NOCTURNE LINEUP/);
  assert.match(html, /12 CAST PROFILES ARE NOW LIVE/);
  assert.match(html, /\/photos-preview\/aika-01\.jpg/);
  assert.match(html, /\/photos-preview\/yuna-01\.jpg/);
  assert.match(html, /No booking, payment or contact service is provided/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /id="mobile-menu"[^>]*aria-hidden="true"[^>]*inert/i);
  assert.doesNotMatch(html, /hentaitokyo/i);
});

test("server-renders a fictional profile route", async () => {
  const response = await render("/profile/aika");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Aika Profile/);
  assert.match(html, /Movement artist/);
  assert.match(html, /AIKA&#x27;S CURRENT INDEX/);
  assert.match(html, /\/photos-preview\/aika-01\.jpg/);
  assert.match(html, /RETURN TO CAST DIRECTORY/);
});

test("admin fails closed without the trusted reverse-proxy header", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 404);
  assert.doesNotMatch(await response.text(), /AUTHORIZED OPERATIONS ALPHA/i);
});

test("admin renders only after the reverse proxy authenticates the operator", async () => {
  const response = await render("/admin", {
    headers: { "x-nocturne-admin-authenticated": "1" },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /AUTHORIZED OPERATIONS ALPHA/i);
  assert.match(html, /STORE ACCESS/i);
  assert.match(html, /STAFF ACCESS/i);
  assert.match(html, /durable local SQLite/i);
  assert.doesNotMatch(html, /store-owner/i);
});

test("staff portal renders in an ordinary browser without an OpenAI account", async () => {
  const response = await render("/staff");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /CAST PORTAL/i);
  assert.match(html, /MY ATTENDANCE/i);
  assert.doesNotMatch(html, /openai|chatgpt|codex/i);
});

test("health confirms the SQLite migration set", async () => {
  const response = await render("/health", {
    headers: { accept: "application/json" },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    app: "nocturne-tokyo",
    storage: "sqlite",
    migrations: 3,
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
