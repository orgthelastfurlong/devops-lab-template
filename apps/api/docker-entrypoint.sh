#!/bin/sh
set -eu

if [ -n "${DATABASE_URL_FILE:-}" ] && [ -f "${DATABASE_URL_FILE}" ]; then
  DATABASE_URL="$(cat "${DATABASE_URL_FILE}")"
  export DATABASE_URL
fi

if [ "${1:-}" = "migrate" ]; then
  shift
  if [ -x ./apps/api/node_modules/.bin/prisma ]; then
    exec ./apps/api/node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma "$@"
  fi
  if [ -x ./node_modules/.bin/prisma ]; then
    exec ./node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma "$@"
  fi
  echo "prisma CLI not found in image" >&2
  exit 127
fi

exec "$@"
