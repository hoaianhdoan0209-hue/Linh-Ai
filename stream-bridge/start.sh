#!/usr/bin/env bash
set -euo pipefail
: "${STREAM_KEY:?Set a private 24+ character STREAM_KEY in Railway variables}"
: "${STATUS_TOKEN:?Set a different private 24+ character STATUS_TOKEN}"
if [[ "${PORT:-8080}" != "8080" ]]; then
  echo "Set PORT=8080 because nginx auth callbacks use that internal port." >&2
  exit 1
fi
python3 /app/server.py &
api_pid=$!
cleanup() {
  kill "$api_pid" >/dev/null 2>&1 || true
  kill "${nginx_pid:-}" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM
sleep 1
if ! kill -0 "$api_pid" >/dev/null 2>&1; then
  echo "Linh receiver failed configuration checks" >&2
  exit 1
fi
nginx -c /app/nginx.conf -g "daemon off;" &
nginx_pid=$!
wait -n "$api_pid" "$nginx_pid" || true
exit 1
