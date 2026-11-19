# devops-lab-template

Template monorepo per un laboratorio DevOps end-to-end:

`PR → CI (GitHub-hosted) → release fidata → deploy su VPS → verifica HTTPS → recupero`

Organizzazione: [`orgthelastfurlong`](https://github.com/orgthelastfurlong)  
Dominio di laboratorio: `thelastfurlong.com`

## Stack

- Frontend: React + Vite + TypeScript (`apps/web`)
- Backend: Node.js + Fastify + TypeScript (`apps/api`)
- Database: PostgreSQL 16 + Prisma (`apps/api/prisma/`)
- Package manager: pnpm workspaces (lockfile unico)
- Locale: Docker Compose per Postgres

## Avvio locale

```bash
cp .env.example .env
docker compose -f infra/compose/docker-compose.dev.yml up -d
pnpm install
pnpm db:generate
pnpm db:migrate:deploy
pnpm dev
```

- Web: http://127.0.0.1:5173 (proxy `/api` → API)
- API: http://127.0.0.1:3000

## Topologia GitHub (lab)

| Repo | Visibilità | Ruolo |
| --- | --- | --- |
| Questo monorepo (template) | pubblico | codice + CI PR |
| Repo operativo (per istanza) | privato | runner, secret, release, deploy |

Il runner self-hosted non viene mai usato dalle PR o dai fork di questo repository.

## Licenza

MIT (laboratorio didattico).
