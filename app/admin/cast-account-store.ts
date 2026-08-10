import type { AttendanceD1 } from "./attendance-store.ts";
import {
  CastAccountError,
  publicCastAccount,
  type CastAccountEventRecord,
  type CastAccountPrivateRecord,
  type CastAccountStatus,
} from "./cast-account-domain.ts";

type AccountMutation = {
  accountId: string;
  actorUserId: string;
};

const accountSelect = `
  SELECT
    id,
    artist_slug AS artistSlug,
    display_name AS displayName,
    credential_hash AS credentialHash,
    status,
    session_version AS sessionVersion,
    last_login_at AS lastLoginAt,
    created_at AS createdAt,
    updated_at AS updatedAt
  FROM cast_accounts
`;

const eventSelect = `
  SELECT
    id,
    account_id AS accountId,
    action,
    actor_user_id AS actorUserId,
    detail,
    created_at AS createdAt
  FROM cast_account_events
`;

export const castAccountDevelopmentSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS cast_accounts (
    id text PRIMARY KEY NOT NULL,
    artist_slug text NOT NULL,
    display_name text NOT NULL,
    credential_hash text NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    session_version integer DEFAULT 1 NOT NULL,
    last_login_at text,
    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT cast_accounts_status_valid CHECK(cast_accounts.status IN ('active', 'disabled')),
    CONSTRAINT cast_accounts_session_version_positive CHECK(cast_accounts.session_version >= 1)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_cast_accounts_artist_slug
    ON cast_accounts (artist_slug)`,
  `CREATE INDEX IF NOT EXISTS idx_cast_accounts_status
    ON cast_accounts (status)`,
  `CREATE TABLE IF NOT EXISTS cast_account_events (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    account_id text NOT NULL,
    action text NOT NULL,
    actor_user_id text NOT NULL,
    detail text DEFAULT '' NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT cast_account_events_action_valid CHECK(cast_account_events.action IN ('create', 'rotate_credential', 'enable', 'disable', 'login')),
    FOREIGN KEY (account_id) REFERENCES cast_accounts(id) ON UPDATE no action ON DELETE cascade
  )`,
  `CREATE INDEX IF NOT EXISTS idx_cast_account_events_account_created
    ON cast_account_events (account_id, created_at, id)`,
  "PRAGMA optimize",
] as const;

export function createCastAccountStore(
  d1: AttendanceD1,
  { initializeSchema = false }: { initializeSchema?: boolean } = {},
) {
  let schemaReady = false;

  async function ensureSchema() {
    if (!initializeSchema || schemaReady) return;
    await d1.batch(
      castAccountDevelopmentSchemaStatements.map((statement) =>
        d1.prepare(statement),
      ),
    );
    schemaReady = true;
  }

  async function getAccountByArtistSlug(artistSlug: string) {
    await ensureSchema();
    return d1
      .prepare(`${accountSelect} WHERE artist_slug = ? LIMIT 1`)
      .bind(artistSlug)
      .first<CastAccountPrivateRecord>();
  }

  async function getAccountById(accountId: string) {
    await ensureSchema();
    return d1
      .prepare(`${accountSelect} WHERE id = ? LIMIT 1`)
      .bind(accountId)
      .first<CastAccountPrivateRecord>();
  }

  async function listCastAccounts() {
    await ensureSchema();
    const [accountsResult, eventsResult] = await d1.batch([
      d1.prepare(`${accountSelect} ORDER BY display_name ASC, artist_slug ASC`),
      d1.prepare(`${eventSelect} ORDER BY id DESC LIMIT 100`),
    ]);
    const accounts = (
      accountsResult as unknown as { results: CastAccountPrivateRecord[] }
    ).results.map(publicCastAccount);
    const events = (
      eventsResult as unknown as { results: CastAccountEventRecord[] }
    ).results;
    return { accounts, events };
  }

  async function createAccount({
    artistSlug,
    displayName,
    credentialHash,
    actorUserId,
  }: {
    artistSlug: string;
    displayName: string;
    credentialHash: string;
    actorUserId: string;
  }) {
    await ensureSchema();
    const accountId = `cast_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    try {
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO cast_accounts (
              id, artist_slug, display_name, credential_hash, status,
              session_version, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'active', 1, ?, ?)`,
          )
          .bind(accountId, artistSlug, displayName, credentialHash, now, now),
        d1
          .prepare(
            `INSERT INTO cast_account_events (
              account_id, action, actor_user_id, detail, created_at
            ) VALUES (?, 'create', ?, ?, ?)`,
          )
          .bind(
            accountId,
            actorUserId,
            `Created access for ${displayName} / ${artistSlug}`,
            now,
          ),
      ]);
    } catch (error) {
      throw mapCastDatabaseError(error);
    }
    const account = await getAccountById(accountId);
    if (!account) throw databaseFailure();
    return publicCastAccount(account);
  }

  async function rotateCredential({
    accountId,
    actorUserId,
    credentialHash,
  }: AccountMutation & { credentialHash: string }) {
    return updateAccount({
      accountId,
      actorUserId,
      action: "rotate_credential",
      detail: "Rotated cast access code and invalidated existing sessions",
      setClause:
        "credential_hash = ?, session_version = session_version + 1, updated_at = ?",
      values: [credentialHash],
    });
  }

  async function setAccountStatus({
    accountId,
    actorUserId,
    status,
  }: AccountMutation & { status: CastAccountStatus }) {
    return updateAccount({
      accountId,
      actorUserId,
      action: status === "active" ? "enable" : "disable",
      detail:
        status === "active"
          ? "Enabled cast account and invalidated earlier sessions"
          : "Disabled cast account and invalidated existing sessions",
      setClause:
        "status = ?, session_version = session_version + 1, updated_at = ?",
      values: [status],
    });
  }

  async function updateAccount({
    accountId,
    actorUserId,
    action,
    detail,
    setClause,
    values,
  }: AccountMutation & {
    action: "rotate_credential" | "enable" | "disable";
    detail: string;
    setClause: string;
    values: unknown[];
  }) {
    await ensureSchema();
    const existing = await getAccountById(accountId);
    if (!existing) {
      throw new CastAccountError("not_found", "Cast account was not found.");
    }
    const now = new Date().toISOString();
    try {
      const [updateResult, eventResult] = await d1.batch([
        d1
          .prepare(`UPDATE cast_accounts SET ${setClause} WHERE id = ?`)
          .bind(...values, now, accountId),
        d1
          .prepare(
            `INSERT INTO cast_account_events (
              account_id, action, actor_user_id, detail, created_at
            ) VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(accountId, action, actorUserId, detail, now),
      ]);
      if (
        Number(updateResult.meta.changes ?? 0) !== 1 ||
        Number(eventResult.meta.changes ?? 0) !== 1
      ) {
        throw databaseFailure();
      }
    } catch (error) {
      if (error instanceof CastAccountError) throw error;
      throw mapCastDatabaseError(error);
    }
    const updated = await getAccountById(accountId);
    if (!updated) throw databaseFailure();
    return publicCastAccount(updated);
  }

  async function recordSuccessfulLogin(accountId: string) {
    await ensureSchema();
    const now = new Date().toISOString();
    try {
      await d1.batch([
        d1
          .prepare(
            "UPDATE cast_accounts SET last_login_at = ?, updated_at = ? WHERE id = ?",
          )
          .bind(now, now, accountId),
        d1
          .prepare(
            `INSERT INTO cast_account_events (
              account_id, action, actor_user_id, detail, created_at
            ) VALUES (?, 'login', ?, 'Cast portal sign-in completed', ?)`,
          )
          .bind(accountId, `cast:${accountId}`, now),
      ]);
    } catch (error) {
      throw mapCastDatabaseError(error);
    }
  }

  return {
    ensureSchema,
    getAccountByArtistSlug,
    getAccountById,
    listCastAccounts,
    createAccount,
    rotateCredential,
    setAccountStatus,
    recordSuccessfulLogin,
  };
}

async function runtimeCastAccountStore() {
  try {
    const { getD1Binding } = await import("../../db");
    return createCastAccountStore(getD1Binding());
  } catch (error) {
    throw mapCastDatabaseError(error);
  }
}

export async function listCastAccounts() {
  return (await runtimeCastAccountStore()).listCastAccounts();
}

export async function getCastAccountByArtistSlug(artistSlug: string) {
  return (await runtimeCastAccountStore()).getAccountByArtistSlug(artistSlug);
}

export async function getCastAccountById(accountId: string) {
  return (await runtimeCastAccountStore()).getAccountById(accountId);
}

export async function createCastAccount(
  input: Parameters<ReturnType<typeof createCastAccountStore>["createAccount"]>[0],
) {
  return (await runtimeCastAccountStore()).createAccount(input);
}

export async function rotateCastCredential(
  input: Parameters<ReturnType<typeof createCastAccountStore>["rotateCredential"]>[0],
) {
  return (await runtimeCastAccountStore()).rotateCredential(input);
}

export async function setCastAccountStatus(
  input: Parameters<ReturnType<typeof createCastAccountStore>["setAccountStatus"]>[0],
) {
  return (await runtimeCastAccountStore()).setAccountStatus(input);
}

export async function recordCastLogin(accountId: string) {
  return (await runtimeCastAccountStore()).recordSuccessfulLogin(accountId);
}

function mapCastDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes("uq_cast_accounts_artist_slug") ||
    message.includes("UNIQUE constraint failed: cast_accounts.artist_slug")
  ) {
    return new CastAccountError(
      "account_exists",
      "This cast profile already has an account.",
    );
  }
  return databaseFailure();
}

function databaseFailure() {
  return new CastAccountError(
    "database_error",
    "Cast account storage could not complete the command.",
  );
}
