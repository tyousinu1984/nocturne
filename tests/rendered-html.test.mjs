import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

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
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /<title>Tokyo after dark \| Nocturne<\/title>/i);
  assert.match(html, /The night has/);
  assert.match(html, /Choose a frequency/);
  assert.match(html, /Adults-only interface study/);
  assert.match(html, /No booking, payment, messaging/);
  assert.doesNotMatch(html, /hentaitokyo/i);
});

test("server-renders a fictional profile route", async () => {
  const response = await render("/profile/aika");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /Aika dossier/);
  assert.match(html, /Movement artist/);
  assert.match(html, /Current studio index/);
  assert.match(html, /This demo has no booking path/);
  assert.doesNotMatch(html, /https:\/\/hentaitokyo\.com/i);
});
