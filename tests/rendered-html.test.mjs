import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/", options = {}) {
  const { bindings, headers, ...requestOptions } = options;
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      ...requestOptions,
      headers: { accept: "text/html", ...headers },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      ...bindings,
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
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
  assert.match(
    html,
    /id="mobile-menu"[^>]*aria-hidden="true"[^>]*inert/i,
  );
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
  assert.match(html, /\/photos-preview\/aika-02\.jpg/);
  assert.match(html, /RETURN TO CAST DIRECTORY/);
  assert.doesNotMatch(html, /https:\/\/hentaitokyo\.com/i);
});

test("production redirects anonymous admin visitors to route-scoped SIWC", async () => {
  const response = await render("/admin");
  assert.ok([302, 303, 307, 308].includes(response.status));
  assert.match(
    response.headers.get("location") ?? "",
    /^\/signin-with-chatgpt\?return_to=%2Fadmin$/,
  );
});

test("production cannot enable the development owner through a runtime binding", async () => {
  const response = await render("/admin", {
    bindings: {
      NOCTURNE_DEV_AUTH: "1",
    },
  });
  assert.ok([302, 303, 307, 308].includes(response.status));
  assert.match(
    response.headers.get("location") ?? "",
    /^\/signin-with-chatgpt\?return_to=%2Fadmin$/,
  );
});

test("production hides admin from authenticated users outside the owner allowlist", async () => {
  const response = await render("/admin", {
    headers: {
      "oai-authenticated-user-id": "unlisted-user",
      "oai-authenticated-user-email": "unlisted@example.test",
    },
    bindings: {
      ADMIN_ALLOWED_USER_IDS: "owner-user",
    },
  });
  assert.equal(response.status, 404);
  const html = await response.text();
  assert.doesNotMatch(html, /AUTHORIZED OPERATIONS ALPHA/i);
});

test("production renders admin for the stable allowlisted owner identity", async () => {
  const response = await render("/admin", {
    headers: {
      "oai-authenticated-user-id": "owner-user",
      "oai-authenticated-user-email": "owner@example.test",
      "oai-authenticated-user-full-name": "Shinpei%20Owner",
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    },
    bindings: {
      ADMIN_ALLOWED_USER_IDS: "owner-user",
    },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /AUTHORIZED OPERATIONS ALPHA/i);
  assert.match(html, /WORK QUEUE/i);
  assert.match(
    html,
    /02<\/span>\s*<b>ATTENDANCE<\/b>\s*<small>Schedule and publish/i,
  );
  assert.doesNotMatch(html, /owner-user/i);
});

test("public attendance fails closed when D1 is unavailable", async () => {
  const response = await render("/api/public/attendance?artist=yuna", {
    headers: { accept: "application/json" },
    bindings: {
      DB: {
        prepare() {
          throw new Error("D1 unavailable");
        },
      },
    },
  });

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    availability: "unavailable",
    entries: [],
  });
});

test("missing attendance storage returns service unavailable for writes", async () => {
  const response = await render("/api/admin/attendance", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "idempotency-key": "missing-storage",
      "oai-authenticated-user-id": "owner-user",
      "oai-authenticated-user-email": "owner@example.test",
      origin: "http://localhost",
    },
    body: JSON.stringify({
      action: "create",
      artistSlug: "yuna",
      serviceDate: "2026-08-12",
      startTime: "18:00",
      endTime: "23:00",
    }),
    bindings: { ADMIN_ALLOWED_USER_IDS: "owner-user" },
  });

  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "database_error");
});

test("null attendance JSON is rejected as a bad request", async () => {
  const response = await render("/api/admin/attendance", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "idempotency-key": "null-payload",
      "oai-authenticated-user-id": "owner-user",
      "oai-authenticated-user-email": "owner@example.test",
      origin: "http://localhost",
    },
    body: "null",
    bindings: { ADMIN_ALLOWED_USER_IDS: "owner-user" },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Request body must be a JSON object.",
  });
});

test("attendance API distinguishes auth, allowlist and origin failures", async () => {
  const anonymous = await render("/api/admin/attendance", {
    headers: { accept: "application/json" },
  });
  assert.equal(anonymous.status, 401);
  assert.equal((await anonymous.json()).code, "authentication_required");

  const forbidden = await render("/api/admin/attendance", {
    headers: {
      accept: "application/json",
      "oai-authenticated-user-id": "unlisted-user",
      "oai-authenticated-user-email": "unlisted@example.test",
    },
    bindings: { ADMIN_ALLOWED_USER_IDS: "owner-user" },
  });
  assert.equal(forbidden.status, 403);
  assert.equal((await forbidden.json()).code, "admin_forbidden");

  const crossOrigin = await render("/api/admin/attendance", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "idempotency-key": "cross-origin",
      "oai-authenticated-user-id": "owner-user",
      "oai-authenticated-user-email": "owner@example.test",
      origin: "https://malicious.example",
    },
    body: JSON.stringify({ action: "create" }),
    bindings: { ADMIN_ALLOWED_USER_IDS: "owner-user" },
  });
  assert.equal(crossOrigin.status, 403);
  assert.equal((await crossOrigin.json()).code, "cross_origin_blocked");
});
