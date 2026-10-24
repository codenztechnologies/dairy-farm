# Dairy Farm (working name)

A production-grade, multi-tenant dairy farm management platform for Pakistani and international farms. Web app plus an offline-first mobile app, in English and Urdu (RTL).

## Highlights

- Herd registry with pedigree, QR/NFC tags and a shareable animal passport
- Milk production, quality, tanks, sales, price lists, customer credit ledger (udhar)
- Breeding, health, vaccination, medicine withdrawal enforcement on milk
- Feed rations, inventory with batches and expiry, purchasing
- Finance with cost per liter and profit per animal
- Staff, attendance, payroll, tasks
- Smart alerts, farm health score, WhatsApp daily summaries and invoices
- Offline data entry on mobile with safe sync

## Status

Planning complete. Implementation starts with Phase 0 (see [docs/02-features-and-phases.md](docs/02-features-and-phases.md)).

## Documentation

Start with [CLAUDE.md](CLAUDE.md) for the document map and project rules. Product and stack decisions: [docs/00-decisions.md](docs/00-decisions.md).

## Repository layout

```
apps/       web (Next.js), api (NestJS), mobile (Expo), worker (BullMQ)
packages/   db, contracts, api-client, theme, ui, i18n, domain, config
docs/       planning, architecture, ERD, design system, runbooks
infra/      docker, CI workflows, backup scripts
```

## Getting started (after Phase 0)

Requirements: Node LTS, pnpm, Docker.

```bash
pnpm install
docker compose up -d
pnpm db:migrate && pnpm db:seed
pnpm dev
```

See [docs/13-devops-and-runbooks.md](docs/13-devops-and-runbooks.md) for environment variables and operations.
