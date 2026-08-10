# Attendance runtime configuration

Updated: 2026-08-10

## Node runtime

The production process runs the standalone bundle on loopback:

```text
HOST=127.0.0.1
PORT=4189
NOCTURNE_DATABASE_PATH=~/Library/Application Support/NocturneTokyo/data/nocturne.sqlite
```

The database directory is mode `700`; the SQLite file is mode `600`. Startup
enables foreign keys, WAL mode and a five-second busy timeout, then applies the
three checked-in attendance and cast-access migrations transactionally.

The production entrypoint is `scripts/start-production.sh`, copied into each
read-only release beside `server.js`. It loads the staff-session signing secret
from macOS Keychain service
`cc.shinpei.nocturne-tokyo.NOCTURNE_SESSION_SECRET`, account `runtime`, then
exports it only to the Node child process. The secret is absent from Git,
LaunchAgent environment variables, deployment manifests and receipts.

## Admin authentication

Caddy protects `/admin`, `/admin/*` and `/api/admin/*` with Basic Auth. After
successful authentication it removes the browser Authorization header and
injects this local trust marker:

```text
X-Nocturne-Admin-Authenticated: 1
```

Both protected and public proxy branches delete any client-supplied copy of the
marker before routing. The application accepts admin access only when the final
trusted marker equals `1`.

The Node listener stays on `127.0.0.1`, so the marker cannot be supplied over
the public network without first passing through Caddy.

## Public projection

`GET /api/public/attendance?artist=<slug>` exposes only published date and time
fields. Internal notes, operator identity, review history and cancelled records
remain private.
