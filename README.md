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

Attendance data is stored in SQLite. The process applies the checked-in
Drizzle migrations at startup and records applied migration IDs in
`nocturne_migrations`.

Set an explicit writable path in production:

```bash
NOCTURNE_DATABASE_PATH='/Users/shinpei/Library/Application Support/NocturneTokyo/data/nocturne.sqlite'
```

When the variable is absent, local development uses
`.local-data/nocturne.sqlite`.

## Development

```bash
npm install
npm run dev
npm run lint
npm test
```

The production build emits `dist/standalone/server.js`:

```bash
npm run build
HOST=127.0.0.1 PORT=4189 npm start
```

`GET /health` verifies that the process can open SQLite and apply both current
migrations.

## Production shape

- Runtime: standalone Node.js on `127.0.0.1:4189`
- Process: LaunchAgent `cc.shinpei.nocturne-tokyo`
- Persistent state: `~/Library/Application Support/NocturneTokyo`
- Reverse proxy: Caddy managed site for `nocturne.shinpei.cc.cd`
- Public pages: no login
- Admin: username `shop` plus the separate shop access code

The previous hosted deployment remains only as a DNS rollback target until the
self-hosted release has completed public verification.
