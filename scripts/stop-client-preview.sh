#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${ROOT_DIR}/.client-preview"
ADMIN_PID_FILE="${STATE_DIR}/admin-dev.pid"

if [[ -f "${ADMIN_PID_FILE}" ]]; then
  ADMIN_PID="$(cat "${ADMIN_PID_FILE}")"
  if ps -p "${ADMIN_PID}" >/dev/null 2>&1; then
    kill "${ADMIN_PID}" >/dev/null 2>&1 || true
  fi
  rm -f "${ADMIN_PID_FILE}"
fi

docker rm -f mychurch-api-tunnel mychurch-admin-tunnel >/dev/null 2>&1 || true

echo "Preview tunnels stopped."
