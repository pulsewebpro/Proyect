#!/usr/bin/env bash
# Volcado lógico de Postgres (requiere pg_dump en PATH y DATABASE_URL).
set -euo pipefail
OUT="${1:-./backups}"
mkdir -p "$OUT"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="$OUT/amable-${STAMP}.sql.gz"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL no está definida" >&2
  exit 1
fi
pg_dump "$DATABASE_URL" --no-owner --format=plain | gzip -9 > "$FILE"
echo "OK: $FILE"
