# Nocturne Tokyo

Nocturne Tokyo is a self-hosted Vinext application for a public cast directory
and a protected shop operations console.

## Access boundary

- `/`, `/profile/*` and `/api/public/*` are public and work in a normal browser.
- `/admin` and `/api/admin/*` are protected by Caddy Basic Auth.
- Caddy strips any incoming authentication marker, verifies the shop access
  code, then injects `X-Nocturne-Admin-Authenticated: 1` for the local Node
  service.
- The Node service listens on loopback only and fails closed when the trusted
  proxy marker is absent.

The application has no dependency on an OpenAI account or an external identity
provider.

## Data

Attendance data is stored in PostgreSQL. The process applies the checked-in
Drizzle migrations at startup (guarded by a Postgres advisory lock, so
multiple replicas starting at once don't race to apply the same migration
twice) and records applied migration IDs in `nocturne_migrations`.

Set the connection string:

```bash
DATABASE_URL='postgres://user:password@host:5432/nocturne'
```

Local development and tests get a Postgres instance for free via
`compose.yaml`'s `db` service — `docker compose run --rm dev npm test` and
`docker compose up app` both default `DATABASE_URL` to it already.

## Development

```bash
npm install
npm run dev
npm run lint
npm test
```

If the host machine's Node version or npm's `optionalDependencies`
resolution (see `Dockerfile`'s `deps` stage for a known npm bug this works
around) get in the way, run the same commands inside the pinned `dev`
container instead:

```bash
docker compose run --rm dev npm test
docker compose run --rm dev npm run lint
```

The production build emits `dist/standalone/server.js`:

```bash
npm run build
HOST=127.0.0.1 PORT=4189 npm start
```

`GET /health` verifies that the process can reach PostgreSQL and reports the
currently applied migration count.

## Production shape

- Runtime: the standalone server (`dist/standalone/server.js`) running
  inside the `app` service defined in `compose.yaml`, published only on
  `127.0.0.1:4189` — see the warning comment in that file before touching
  the port mapping
- Process: LaunchAgent `cc.shinpei.nocturne-tokyo` runs
  `scripts/start-production-docker.sh`, which reads the session secret from
  Keychain and runs `docker compose up` (replaces the previous bare
  `node dist/standalone/server.js` invocation; see
  `scripts/nocturne-tokyo.launchagent.plist.template`)
- Persistent state: PostgreSQL (connection configured via `DATABASE_URL`) —
  the app container itself no longer needs a data bind mount; see the
  in-progress migration off SQLite in this repo's history/plan notes
- Reverse proxy: Caddy managed site for `nocturne.shinpei.cc.cd` — unchanged
  by containerizing the Node process; Caddy still strips any
  client-supplied `X-Nocturne-Admin-Authenticated` header and is the only
  thing permitted to reach the app container
- Public pages: no login
- Admin: username `shop` plus the separate shop access code

The previous hosted deployment remains only as a DNS rollback target until the
self-hosted release has completed public verification.
