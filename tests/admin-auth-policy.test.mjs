import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowedAdminUser,
  parseAllowedUserIds,
} from "../app/admin/auth-policy.ts";

test("admin allowlist parsing trims and deduplicates stable user IDs", () => {
  assert.deepEqual(
    parseAllowedUserIds(" owner-1,owner-2, owner-1 ,,"),
    ["owner-1", "owner-2"],
  );
});

test("production access fails closed when the stable user ID is absent", () => {
  assert.equal(
    isAllowedAdminUser({
      allowedUserIds: [],
      isDevelopmentMock: false,
      userId: "owner-1",
    }),
    false,
  );
  assert.equal(
    isAllowedAdminUser({
      allowedUserIds: ["owner-1"],
      isDevelopmentMock: false,
      userId: "owner-1",
    }),
    true,
  );
});

test("development mock grants only the fixed isolated owner identity", () => {
  assert.equal(
    isAllowedAdminUser({
      allowedUserIds: [],
      isDevelopmentMock: true,
      userId: "dev-owner-01",
    }),
    true,
  );
  assert.equal(
    isAllowedAdminUser({
      allowedUserIds: [],
      isDevelopmentMock: true,
      userId: "someone-else",
    }),
    false,
  );
});
