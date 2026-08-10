# Nocturne Tokyo Self-Hosted Migration Release Receipt

- Release date: 2026-08-10
- Production site: `https://nocturne.shinpei.cc.cd`
- Deployment source commit:
  `035a8d985cf7757f059f1cbe7eacd15fc65c00e7`
- Release tag: `production-nocturne-2026-08-10-self-hosted`
- Runtime release:
  `/Users/shinpei/Library/Application Support/NocturneTokyo/releases/20260810T104407+0900-035a8d985cf7`
- LaunchAgent: `cc.shinpei.nocturne-tokyo`
- Loopback listener: `127.0.0.1:4189`
- Persistent SQLite:
  `/Users/shinpei/Library/Application Support/NocturneTokyo/data/nocturne.sqlite`
- Managed Caddy site:
  `/Users/shinpei/ai-server/caddy/sites/nocturne-tokyo.caddy`
- Successful App Deployer receipt:
  `/Users/shinpei/Library/Application Support/ShinpeiAppDeployer/receipts/nocturne-tokyo/2026-08-10T01-44-14-344Z-2c7fee5f.json`
- DNS rollback snapshot:
  `/Users/shinpei/Library/Application Support/NocturneTokyo/backups/dns-20260810T104747+0900/nocturne-a-records.json`

## Authorization and correction scope

The Human Owner required immediate removal of the ChatGPT account dependency
after the production admin route was found to require that account. The same
instruction confirmed that the public link must work for friends in a normal
browser. This release migrates the complete runtime away from the former hosted
path while preserving the accepted public visual design.

## Released topology

1. Public catalogue, profile pages, photographs and public attendance reads are
   anonymous.
2. `/admin`, `/admin/*` and `/api/admin/*` use Caddy Basic Auth with username
   `shop` and an independently generated shop access code.
3. Caddy removes incoming trust markers. It injects
   `X-Nocturne-Admin-Authenticated: 1` only after successful Basic Auth.
4. The upstream removes the Authorization header before forwarding requests.
5. The Node process listens only on loopback and fails closed when the trusted
   proxy marker is absent.
6. Attendance persistence uses local SQLite with foreign keys, WAL, a busy
   timeout, transactional migrations and mode `600` on the database file.

The access code is stored in macOS Keychain under service
`cc.shinpei.nocturne-tokyo.ADMIN_ACCESS_CODE`, account `shop`. The code and DNS
credentials are absent from Git, deployment manifests, receipts and logs.

## Code and dependency gates

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm test`: 30 passed, zero failed.
- Vinext standalone production build: passed.
- Production dependency audit: zero vulnerabilities.
- Active source and runtime configuration contain no legacy hosted sign-in,
  forwarded account identity or Cloudflare Worker database dependency.

## Deployment evidence

- The first App Deployer apply used occupied port `4188`, failed local health
  with `EADDRINUSE`, and automatically rolled back. Failure receipt:
  `/Users/shinpei/Library/Application Support/ShinpeiAppDeployer/receipts/nocturne-tokyo/2026-08-10T01-42-15-220Z-226581a9.json`.
- Port `4189` was selected after enumerating the local port range.
- The successful App Deployer apply installed and started the LaunchAgent,
  installed the managed Caddy site, passed local health and preserved the old
  public site until DNS cutover.
- A separate plain-HTTP Caddy smoke instance verified that a spoofed trust
  marker receives `401`, while the correct shop access code returns `200` for
  the admin page and API.
- Both existing Nocturne A records were backed up and updated to `60.95.0.58`.
- DNSHE authoritative nameservers, `1.1.1.1`, `8.8.8.8` and `223.5.5.5` all
  resolved to `60.95.0.58` after cutover.
- Caddy obtained a Let's Encrypt certificate for
  `nocturne.shinpei.cc.cd`, valid from 2026-08-10 through 2026-11-08.

## Final production smoke

- `/health`: HTTP 200, `storage: sqlite`, two migrations.
- `/`: HTTP 200 without credentials.
- `/profile/yuna`: HTTP 200 without credentials.
- `/photos-preview/yuna-01.jpg`: HTTP 200 without credentials.
- Public attendance API: HTTP 200, `availability: ready`, zero entries.
- Anonymous `/admin`: HTTP 401.
- Spoofed proxy marker without Basic Auth: HTTP 401.
- Incorrect shop access code: HTTP 401.
- Correct shop access code: admin page and admin attendance API return HTTP 200.
- Authenticated same-origin invalid write: HTTP 400 with no database write.
- Authenticated cross-origin write: HTTP 403 `cross_origin_blocked`.
- SQLite integrity: `ok`; migration count 2; entry count 0; event count 0.
- LaunchAgent stderr after successful restart: zero bytes.
- Sanitized Caddy access log contains no Authorization header field.

## Artifact checksums

- Standalone `server.js` SHA-256:
  `b8e6d68c6533cdd91b88a7de591639e1aba139c490e0484cc85b2cbc0fa7e1c3`
- Caddy site SHA-256:
  `2984e8ee9a642e43a66d62cd547a79a53760d7ee267fed5fd2b4ed40d88bc68e`
- LaunchAgent plist SHA-256:
  `61858388adbe26dde53a88a12df4b92c31ced7bca7baeefecf772aa193d2355f`
- Deployment manifest SHA-256:
  `ebd892d573ff8f8075027d25e9ab88f8e3432270378c9713f706977cf2b7ce8e`

## Rollback boundary

The previous hosted Sites version 10 remains unchanged. The DNS backup stores
both original A record IDs, contents and TTL values. A rollback restores those
two A records first and verifies the previous public site, then uses the
successful App Deployer receipt to remove the local LaunchAgent and managed
Caddy site. The local SQLite database, Keychain item, release and audit receipts
remain preserved for diagnosis unless separately approved for removal.
