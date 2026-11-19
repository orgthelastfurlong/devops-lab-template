#!/bin/sh
set -eu

if [ -n "${DATABASE_URL_FILE:-}" ] && [ -f "${DATABASE_URL_FILE}" ]; then
  DATABASE_URL="$(cat "${DATABASE_URL_FILE}")"
  export DATABASE_URL
fi

if [ "${1:-}" = "migrate" ]; then
  shift
  exec ./node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma "$@"
fi

exec "$@"
