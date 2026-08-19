#!/bin/zsh
#
# Docker-based replacement for scripts/start-production.sh, meant to run on
# the actual production host (not this development machine — see
# README.md "Production shape"). Intended to be invoked the same way the
# existing LaunchAgent invokes start-production.sh today: swap the
# LaunchAgent's ProgramArguments to point at this script instead (see
# scripts/nocturne-tokyo.launchagent.plist.template alongside this file).
#
# Preserves every property of the current setup:
#   - The session secret still comes from Keychain and is never written to
#     disk or to compose.yaml.
#   - The Node service still ends up reachable only on 127.0.0.1:4189 (see
#     the port-publish warning in compose.yaml) — Caddy is untouched and is
#     still the only thing allowed to reach it.
#
# The app's database moved from a local SQLite file to PostgreSQL (see
# README.md "Data"). This script now also reads a `DATABASE_URL` connection
# string from Keychain, following the exact same pattern as the session
# secret, rather than bind-mounting a local data directory. NOTE: this is an
# interim choice for whatever Postgres this host talks to today — it does
# not assume or provision anything about where that Postgres actually runs
# (self-hosted container vs. the AWS RDS instance the project plan targets
# for later). Store the real value once with:
#   security add-generic-password -s cc.shinpei.nocturne-tokyo.DATABASE_URL \
#     -a runtime -w 'postgres://user:password@host:5432/nocturne'
#
# LaunchAgents run with a minimal PATH, so every external command below is
# called by its absolute path. CHECK THESE PATHS ON THE ACTUAL HOST before
# using this script — they were not verified against the real production
# machine (this repo's dev checkout has no Docker/Caddy/LaunchAgent
# installation to introspect). In particular, confirm the real `docker`
# binary location with `which docker` on that host; Docker Desktop
# typically symlinks it under /usr/local/bin, but this varies by install
# method.

set -euo pipefail

readonly session_secret_service="cc.shinpei.nocturne-tokyo.NOCTURNE_SESSION_SECRET"
readonly database_url_service="cc.shinpei.nocturne-tokyo.DATABASE_URL"
readonly secret_account="runtime"
readonly docker_bin="/usr/local/bin/docker"
readonly repo_dir="${0:A:h}/.."

session_secret="$(/usr/bin/security find-generic-password \
  -s "${session_secret_service}" \
  -a "${secret_account}" \
  -w)"

if (( ${#session_secret} < 32 )); then
  print -u2 "Nocturne staff session secret is unavailable."
  exit 78
fi

database_url="$(/usr/bin/security find-generic-password \
  -s "${database_url_service}" \
  -a "${secret_account}" \
  -w)"

if [[ -z "${database_url}" ]]; then
  print -u2 "Nocturne DATABASE_URL is unavailable."
  exit 78
fi

export NOCTURNE_SESSION_SECRET="${session_secret}"
export DATABASE_URL="${database_url}"
unset session_secret database_url

cd "${repo_dir}"
exec "${docker_bin}" compose -f compose.yaml up --detach --build app
