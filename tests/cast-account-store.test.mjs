import assert from "node:assert/strict";
import test from "node:test";
import { createCastAccountStore } from "../app/admin/cast-account-store.ts";
import {
  createStaffSessionToken,
  generateTemporaryAccessCode,
  hashStaffCredential,
  recordStaffLoginFailure,
  readStaffSessionToken,
  resetStaffLoginRateLimitsForTests,
  staffLoginRateLimit,
  verifyStaffCredential,
} from "../app/staff/session.ts";
import { createPostgresD1 } from "./helpers/postgres-d1.mjs";

process.env.NOCTURNE_SESSION_SECRET = "test-session-secret-with-at-least-thirty-two-characters";

test("cast credentials are hashed and session versions invalidate old tokens", async (t) => {
  const d1 = await createPostgresD1();
  t.after(() => d1.close());
  const store = createCastAccountStore(d1, { initializeSchema: true });
  const firstCode = generateTemporaryAccessCode();
  const account = await store.createAccount({
    artistSlug: "yuna",
    displayName: "Yuna",
    credentialHash: hashStaffCredential(firstCode),
    actorUserId: "store-owner",
  });
  const privateAccount = await store.getAccountById(account.id);
  assert.ok(privateAccount);
  assert.notEqual(privateAccount.credentialHash, firstCode);
  assert.equal(verifyStaffCredential(firstCode, privateAccount.credentialHash), true);

  const oldToken = createStaffSessionToken({
    accountId: account.id,
    artistSlug: account.artistSlug,
    sessionVersion: account.sessionVersion,
  });
  const secondCode = generateTemporaryAccessCode();
  const rotated = await store.rotateCredential({
    accountId: account.id,
    actorUserId: "store-owner",
    credentialHash: hashStaffCredential(secondCode),
  });
  assert.equal(rotated.sessionVersion, account.sessionVersion + 1);
  assert.equal(readStaffSessionToken(oldToken)?.sessionVersion, account.sessionVersion);
  const rotatedPrivate = await store.getAccountById(account.id);
  assert.equal(verifyStaffCredential(firstCode, rotatedPrivate.credentialHash), false);
  assert.equal(verifyStaffCredential(secondCode, rotatedPrivate.credentialHash), true);

  const disabled = await store.setAccountStatus({
    accountId: account.id,
    actorUserId: "store-owner",
    status: "disabled",
  });
  assert.equal(disabled.status, "disabled");
  assert.equal(disabled.sessionVersion, rotated.sessionVersion + 1);
});

test("staff login failures are rate-limited inside a bounded window", () => {
  resetStaffLoginRateLimitsForTests();
  const key = "127.0.0.1:yuna";
  for (let index = 0; index < 5; index += 1) {
    assert.equal(staffLoginRateLimit(key, 1_000).blocked, false);
    recordStaffLoginFailure(key, 1_000 + index);
  }
  const blocked = staffLoginRateLimit(key, 2_000);
  assert.equal(blocked.blocked, true);
  assert.ok(blocked.retryAfterSeconds > 0);
  assert.equal(staffLoginRateLimit(key, 16 * 60 * 1_000).blocked, false);
});
