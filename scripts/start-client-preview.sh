#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="${ROOT_DIR}/.client-preview"
ADMIN_LOG="${STATE_DIR}/admin-dev.log"
ADMIN_PID_FILE="${STATE_DIR}/admin-dev.pid"
API_TUNNEL_NAME="mychurch-api-tunnel"
ADMIN_TUNNEL_NAME="mychurch-admin-tunnel"
ADMIN_PORT="${ADMIN_PORT:-3003}"

mkdir -p "${STATE_DIR}"

cd "${ROOT_DIR}"

docker compose up -d postgres api adminer >/dev/null

docker rm -f "${API_TUNNEL_NAME}" "${ADMIN_TUNNEL_NAME}" >/dev/null 2>&1 || true

API_CONTAINER_ID="$(docker run -d --network host --name "${API_TUNNEL_NAME}" cloudflare/cloudflared:latest tunnel --no-autoupdate --url http://127.0.0.1:4100)"
echo "${API_CONTAINER_ID}" >/dev/null

for _ in {1..20}; do
  API_URL="$(docker logs --tail=60 "${API_TUNNEL_NAME}" 2>&1 | sed -n 's/.*\(https:\/\/[A-Za-z0-9.-]*trycloudflare.com\).*/\1/p' | tail -n 1)"
  if [[ -n "${API_URL:-}" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "${API_URL:-}" ]]; then
  echo "Could not determine API tunnel URL." >&2
  exit 1
fi

if [[ -f "${ADMIN_PID_FILE}" ]]; then
  OLD_PID="$(cat "${ADMIN_PID_FILE}")"
  if ps -p "${OLD_PID}" >/dev/null 2>&1; then
    kill "${OLD_PID}" >/dev/null 2>&1 || true
  fi
fi

nohup env VITE_API_BASE_URL="${API_URL}" npm --prefix admin run dev -- --host 127.0.0.1 --port "${ADMIN_PORT}" >"${ADMIN_LOG}" 2>&1 &
ADMIN_PID=$!
echo "${ADMIN_PID}" > "${ADMIN_PID_FILE}"

for _ in {1..20}; do
  if curl -I -s "http://127.0.0.1:${ADMIN_PORT}" >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -I -s "http://127.0.0.1:${ADMIN_PORT}" >/dev/null; then
  echo "Admin server did not become ready on port ${ADMIN_PORT}." >&2
  exit 1
fi

ADMIN_CONTAINER_ID="$(docker run -d --network host --name "${ADMIN_TUNNEL_NAME}" cloudflare/cloudflared:latest tunnel --no-autoupdate --url "http://127.0.0.1:${ADMIN_PORT}")"
echo "${ADMIN_CONTAINER_ID}" >/dev/null

for _ in {1..20}; do
  ADMIN_URL="$(docker logs --tail=60 "${ADMIN_TUNNEL_NAME}" 2>&1 | sed -n 's/.*\(https:\/\/[A-Za-z0-9.-]*trycloudflare.com\).*/\1/p' | tail -n 1)"
  if [[ -n "${ADMIN_URL:-}" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "${ADMIN_URL:-}" ]]; then
  echo "Could not determine admin tunnel URL." >&2
  exit 1
fi

cat > "${STATE_DIR}/current-preview.env" <<EOF
API_URL=${API_URL}
ADMIN_URL=${ADMIN_URL}
ADMIN_PORT=${ADMIN_PORT}
ADMIN_PID=${ADMIN_PID}
EOF

echo "API_URL=${API_URL}"
echo "ADMIN_URL=${ADMIN_URL}"
echo "ADMIN_LOG=${ADMIN_LOG}"
echo "ADMIN_PID=${ADMIN_PID}"
