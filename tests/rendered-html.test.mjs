import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
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
