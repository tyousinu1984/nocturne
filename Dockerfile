# syntax=docker/dockerfile:1
#
# Nocturne Tokyo container image. Two independent uses of the same base:
#
#   - `dev` target   : full source + devDependencies, for local development
#                       and `docker compose run dev npm test`.
#   - `runtime` target: the standalone production server only (see
#                       README.md "Production shape").
#
# Pin the Node version so it always satisfies package.json's `engines.node`
# (>=22.13.0).
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
# npm has a long-standing bug resolving optionalDependencies for nested
# packages (https://github.com/npm/cli/issues/4828): a plain `npm ci` /
# `npm install` can silently skip the platform-specific native binding that
# `rolldown` (vinext/vite's bundler) needs, and `vinext build` then crashes
# with "Cannot find native binding". This has been verified to reproduce
# even right after `rm -rf node_modules package-lock.json && npm install`,
# so it must be patched explicitly here rather than assumed away.
RUN set -eu; \
    arch="$(dpkg --print-architecture)"; \
    case "$arch" in \
      amd64) pkg=linux-x64-gnu ;; \
      arm64) pkg=linux-arm64-gnu ;; \
      *) echo "nocturne: unsupported build architecture: $arch" >&2; exit 1 ;; \
    esac; \
    if [ ! -d "node_modules/@rolldown/binding-${pkg}" ]; then \
      version="$(node -p "require('./node_modules/rolldown/package.json').version")"; \
      npm install "@rolldown/binding-${pkg}@${version}" --no-save; \
    fi

FROM deps AS dev
COPY . .
CMD ["npm", "test"]

FROM deps AS build
COPY . .
RUN npm run build

# Runtime stage starts from a clean base image, not from `deps`/`build` —
# `dist/standalone/` produced by `vinext build` already bundles the minimal
# node_modules subset the server actually needs at runtime (verified: no
# devDependencies, no build tooling), so nothing else needs to be copied in.
FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist/standalone ./
EXPOSE 4189
CMD ["node", "server.js"]
