# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @lab/web...
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN pnpm --filter @lab/shared build && pnpm --filter @lab/web build

FROM caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d AS runtime
# File capabilities + no-new-privileges make exec fail for non-root; strip caps (we bind :8080).
RUN apk add --no-cache libcap \
  && setcap -r /usr/bin/caddy \
  && apk del libcap
COPY apps/web/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/apps/web/dist /srv
USER nobody
EXPOSE 8080
