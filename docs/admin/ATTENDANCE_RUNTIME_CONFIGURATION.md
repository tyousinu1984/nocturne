# Attendance Runtime Configuration

Date: 2026-08-09

## Bindings

- `.openai/hosting.json` declares the logical D1 binding as `DB`.
- Local development uses a disposable Miniflare D1 database.
- Production D1 is created and wired by Sites when a saved version is deployed.

## Authentication variables

### `ADMIN_ALLOWED_USER_IDS`

Required in production. It contains one or more comma-separated,
site-scoped `oai-authenticated-user-id` values.

The application fails closed when this variable is missing or when the signed-in
user ID is not present. Account IDs shown in a Sites access policy must not be
copied into this variable unless a controlled authenticated request verifies
that the value matches the forwarded site-scoped user ID.

### `NOCTURNE_DEV_AUTH`

Local development only. Starting the development server with value `1` injects
the fixed `dev-owner-01` identity and enables disposable schema initialization.

The Vite build injects this switch only for a non-production development server.
A production build compiles it to `false`, so a runtime binding with the same
name cannot enable the mock identity. The key must still remain absent from the
production Sites environment.

The Worker removes any caller-supplied internal allowlist header and reconstructs
it only from `ADMIN_ALLOWED_USER_IDS`. Browser requests therefore cannot forge
the server-side allowlist.

## Production configuration

The Attendance Alpha was deployed on 2026-08-09 with these completed controls:

1. The Owner's site-scoped user ID was obtained through a controlled SIWC
   self-identity request.
2. `ADMIN_ALLOWED_USER_IDS` is stored as a secret Sites runtime value.
3. `NOCTURNE_DEV_AUTH` is absent from Sites.
4. Sites version 10 was saved from the reviewed and production-fixed commit.
5. The hosted D1 migration and anonymous projection passed smoke testing.
6. Sites version 5 remains the pre-attendance rollback version.
