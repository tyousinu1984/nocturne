import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { CastAccountError } from "../admin/cast-account-domain.ts";

export const STAFF_SESSION_COOKIE = "nocturne_staff_session";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 12;
const SCRYPT_COST = 16_384;

export type StaffSessionPayload = {
  accountId: string;
  artistSlug: string;
  sessionVersion: number;
  expiresAt: number;
};

export function generateTemporaryAccessCode() {
  return randomBytes(12)
    .toString("hex")
    .toUpperCase()
    .match(/.{1,4}/g)!
    .join("-");
}

export function hashStaffCredential(credential: string) {
  const normalized = credential.trim();
  if (normalized.length < 12 || normalized.length > 128) {
    throw new CastAccountError(
      "invalid_credential",
      "Access code must contain 12 to 128 characters.",
    );
  }
  const salt = randomBytes(16);
  const digest = scryptSync(normalized, salt, 64, { N: SCRYPT_COST });
  return `scrypt$${SCRYPT_COST}$${salt.toString("base64url")}$${digest.toString("base64url")}`;
}

export function verifyStaffCredential(credential: string, encodedHash: string) {
  try {
    const [algorithm, costValue, saltValue, digestValue] = encodedHash.split("$");
    if (algorithm !== "scrypt") return false;
    const cost = Number(costValue);
    if (!Number.isInteger(cost) || cost < SCRYPT_COST) return false;
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(digestValue, "base64url");
    const actual = scryptSync(credential.trim(), salt, expected.length, { N: cost });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function createStaffSessionToken({
  accountId,
  artistSlug,
  sessionVersion,
  now = Date.now(),
}: Omit<StaffSessionPayload, "expiresAt"> & { now?: number }) {
  const payload: StaffSessionPayload = {
    accountId,
    artistSlug,
    sessionVersion,
    expiresAt: Math.floor(now / 1000) + SESSION_LIFETIME_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function readStaffSessionToken(
  token: string | undefined,
  now = Date.now(),
): StaffSessionPayload | null {
  if (!token) return null;
  const [encodedPayload, receivedSignature, extra] = token.split(".");
  if (!encodedPayload || !receivedSignature || extra) return null;
  const expectedSignature = sign(encodedPayload);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(receivedSignature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<StaffSessionPayload>;
    if (
      typeof payload.accountId !== "string" ||
      typeof payload.artistSlug !== "string" ||
      !Number.isInteger(payload.sessionVersion) ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Math.floor(now / 1000)
    ) {
      return null;
    }
    return payload as StaffSessionPayload;
  } catch {
    return null;
  }
}

export function staffSessionCookie(token: string, secure: boolean) {
  return [
    `${STAFF_SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_LIFETIME_SECONDS}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearStaffSessionCookie(secure: boolean) {
  return [
    `${STAFF_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function cookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) return valueParts.join("=");
  }
  return undefined;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function sessionSecret() {
  const secret = process.env.NOCTURNE_SESSION_SECRET?.trim() ?? "";
  if (secret.length < 32) {
    throw new CastAccountError(
      "configuration_error",
      "Staff session secret is not configured.",
    );
  }
  return secret;
}

type LoginBucket = { failures: number[] };
const loginBuckets = new Map<string, LoginBucket>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_FAILURE_LIMIT = 5;

export function staffLoginRateLimit(key: string, now = Date.now()) {
  const bucket = loginBuckets.get(key) ?? { failures: [] };
  bucket.failures = bucket.failures.filter((time) => now - time < LOGIN_WINDOW_MS);
  loginBuckets.set(key, bucket);
  return {
    blocked: bucket.failures.length >= LOGIN_FAILURE_LIMIT,
    retryAfterSeconds:
      bucket.failures.length >= LOGIN_FAILURE_LIMIT
        ? Math.max(
            1,
            Math.ceil((LOGIN_WINDOW_MS - (now - bucket.failures[0])) / 1000),
          )
        : 0,
  };
}

export function recordStaffLoginFailure(key: string, now = Date.now()) {
  const bucket = loginBuckets.get(key) ?? { failures: [] };
  bucket.failures = bucket.failures.filter((time) => now - time < LOGIN_WINDOW_MS);
  bucket.failures.push(now);
  loginBuckets.set(key, bucket);
}

export function clearStaffLoginFailures(key: string) {
  loginBuckets.delete(key);
}

export function resetStaffLoginRateLimitsForTests() {
  loginBuckets.clear();
}
