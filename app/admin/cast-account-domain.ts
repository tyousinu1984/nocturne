export const castAccountStatuses = ["active", "disabled"] as const;

export type CastAccountStatus = (typeof castAccountStatuses)[number];

export type CastAccountRecord = {
  id: string;
  artistSlug: string;
  displayName: string;
  status: CastAccountStatus;
  sessionVersion: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CastAccountPrivateRecord = CastAccountRecord & {
  credentialHash: string;
};

export type CastAccountEventRecord = {
  id: number;
  accountId: string;
  action: "create" | "rotate_credential" | "enable" | "disable" | "login";
  actorUserId: string;
  detail: string;
  createdAt: string;
};

export class CastAccountError extends Error {
  readonly code:
    | "not_found"
    | "account_exists"
    | "invalid_account"
    | "invalid_credential"
    | "account_disabled"
    | "configuration_error"
    | "database_error";

  constructor(
    code: CastAccountError["code"],
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export function publicCastAccount(
  account: CastAccountPrivateRecord,
): CastAccountRecord {
  return {
    id: account.id,
    artistSlug: account.artistSlug,
    displayName: account.displayName,
    status: account.status,
    sessionVersion: account.sessionVersion,
    lastLoginAt: account.lastLoginAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
