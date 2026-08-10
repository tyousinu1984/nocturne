#!/bin/zsh

set -euo pipefail

readonly secret_service="cc.shinpei.nocturne-tokyo.NOCTURNE_SESSION_SECRET"
readonly secret_account="runtime"

session_secret="$(/usr/bin/security find-generic-password \
  -s "${secret_service}" \
  -a "${secret_account}" \
  -w)"

if (( ${#session_secret} < 32 )); then
  print -u2 "Nocturne staff session secret is unavailable."
  exit 78
fi

export NOCTURNE_SESSION_SECRET="${session_secret}"
unset session_secret

exec /opt/homebrew/bin/node "${0:A:h}/server.js"
