import assert from "node:assert/strict";
import test from "node:test";
import { isSameOriginCommandRequest } from "../app/admin/request-policy.ts";

test("attendance command policy accepts same-origin browser writes", () => {
  assert.equal(
    isSameOriginCommandRequest({
      origin: "https://nocturne.shinpei.cc.cd",
      requestUrl: "https://nocturne.shinpei.cc.cd/api/admin/attendance",
    }),
    true,
  );
});
test("attendance command policy rejects cross-origin browser writes", () => {
  assert.equal(
    isSameOriginCommandRequest({
      origin: "https://attacker.example",
      requestUrl: "https://nocturne.shinpei.cc.cd/api/admin/attendance",
    }),
    false,
  );
});

test("attendance command policy permits non-browser clients without Origin", () => {
  assert.equal(
    isSameOriginCommandRequest({
      origin: null,
      requestUrl: "https://nocturne.shinpei.cc.cd/api/admin/attendance",
    }),
    true,
  );
});
