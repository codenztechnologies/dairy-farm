# CLAUDE.md

Guidance for Claude Code (and any contributor) working in this repository. Read this first, then the docs it points to. If code and docs disagree, stop and ask; do not silently pick one.

## What this is

"Dairy Farm" (working codename): a multi-tenant SaaS for dairy farms. Primary market: Pakistani farms with 20-500 animals (cattle and buffalo first); international farms supported through per-farm settings. Web app + offline-first React Native mobile app. Solo build; quality over speed; the goal is a production-ready, bug-free-as-practical product.

## Source-of-truth docs (read before changing related areas)

| Doc | Use it for |
|---|---|
| [docs/00-decisions.md](docs/00-decisions.md) | Locked product and stack decisions. Wins over all other docs |
| [docs/01-architecture.md](docs/01-architecture.md) | Layout, tenancy, auth, API, performance, UX state standards, Definition of Done |
| [docs/02-features-and-phases.md](docs/02-features-and-phases.md) | Scope per module and phase |
| [docs/03-erd.md](docs/03-erd.md) | Schema, conventions, indexes, partitioning |
| [docs/04-theme-and-design-system.md](docs/04-theme-and-design-system.md) + [packages/theme/tokens.css](packages/theme/tokens.css) + [mockups/](mockups/) | All visual values and the design language to follow (5 reference mockups; approved deviations in docs/04 section 10) |
| [docs/05-security.md](docs/05-security.md) | Threat model and security checklist |
| [docs/06-testing-strategy.md](docs/06-testing-strategy.md) | What to test and how |
| [docs/07-roles-and-permissions.md](docs/07-roles-and-permissions.md) | Permission catalog and role matrix |
| [docs/08-domain-rules.md](docs/08-domain-rules.md) | Business rules, formulas, alert catalog |
| [docs/09-offline-sync-spec.md](docs/09-offline-sync-spec.md) | Mobile offline sync protocol |
| [docs/10-screens-and-flows.md](docs/10-screens-and-flows.md) | Navigation, screens, key user flows |
| [docs/11-i18n-and-glossary.md](docs/11-i18n-and-glossary.md) | Localization rules, en/ur glossary |
| [docs/12-integrations.md](docs/12-integrations.md) | WhatsApp, push, email, SMS, storage |
| [docs/13-devops-and-runbooks.md](docs/13-devops-and-runbooks.md) | Environments, env vars, CI/CD, backups, incidents |
| [docs/14-conventions.md](docs/14-conventions.md) | Code, git, API, DB, naming conventions |
| [docs/15-adr-log.md](docs/15-adr-log.md) | Why each major decision was made |
| [docs/16-risks-and-backlog.md](docs/16-risks-and-backlog.md) | Risk register, open items, epics |
| [docs/briefs/](docs/briefs/README.md) | One-page brief per epic: start a session from the brief, read only the docs it names |

## Stack (do not substitute without an ADR)

pnpm + Turborepo monorepo, TypeScript strict everywhere. Web: Next.js (App Router), Tailwind CSS v4, Radix primitives (own components in `packages/ui`), TanStack Query/Table/Form, Zod, Apache ECharts. Mobile: Expo React Native. API: NestJS REST + OpenAPI, Drizzle ORM + hand-written SQL for reports. DB: PostgreSQL 16 with Row-Level Security, Redis, BullMQ, S3-compatible storage. Always use current stable versions of packages; pin exact versions via the lockfile; check release notes before major upgrades.

Layout: `apps/{web,api,mobile,worker}`, `packages/{db,contracts,api-client,theme,ui,i18n,domain,config}`, `docs/`, `infra/`.

## Non-negotiable rules

1. **Tenancy.** Every business table has `farm_id` + RLS + composite FKs `(farm_id, id)`. Never write a query that relies only on app-level filtering. New table => RLS policy + leak test in the same change.
2. **No hard-coded visuals.** Colors, fonts, radii, shadows, spacing, durations come from `packages/theme/tokens.css` tokens. No hex/rgb/px-radius in components. Add a token (with dark value) instead. The mockups in `mockups/` are a design-language reference, not a screen spec: design every screen ourselves in that style, using our own features and data, assembled from `packages/ui` components and tokens (docs/04 section 7). Review new screens in the browser with the user.
3. **No hard-coded text.** All user-visible strings via i18n keys (en + ur). Use logical CSS properties (RTL). Format numbers, dates, money, units through shared formatters.
4. **Validation lives in `packages/contracts`.** One Zod schema shared by web, mobile and API. Server always re-validates. Strict objects (reject unknown keys). Regexes live in `contracts/validators` with tests.
5. **Business logic lives in `packages/domain`** as pure functions with unit tests (cost allocation, pricing, gestation, withdrawal, health score, alert rules). No framework or DB imports there.
6. **Every screen ships all states:** skeleton loading, empty, error (with retry and request id), success feedback, offline. Use the shared components; do not hand-roll spinners or ad-hoc messages.
7. **Errors:** API returns RFC 9457 problem+json with stable `code`, localized human `message`, per-field `errors`. Messages say what happened and what to do next.
8. **Money = `numeric(14,2)`, quantities = `numeric(12,3)`, canonical SI units in DB, converted at display.** Never use floats for money. Timestamps are UTC `timestamptz`; farm-local "business dates" are `date` columns.
9. **Append-only ledgers** (`customer_ledger`, `stock_movements`, `audit_log`): never UPDATE/DELETE rows; correct with reversing entries.
10. **Security defaults:** server-side permission check on every route (`module.action`), Idempotency-Key on money/stock POSTs, rate limits, audit log on mutations, no secrets in repo/logs, no PII in URLs. See docs/05.
11. **Queries:** no N+1, keyset pagination, indexes for every FK and named query, EXPLAIN anything touching large tables. Heavy reads use rollups/materialized views, never the request path.
12. **Migrations:** forward-only, reviewed SQL, expand -> migrate -> contract. Never edit an applied migration.
13. **Definition of Done** (docs/01 section 12) applies to every feature: contracts -> migration/RLS/indexes -> domain tests -> API (validation, permissions, audit) -> web + mobile UI with all states -> i18n en/ur + RTL -> integration + E2E tests -> perf check -> accessibility.

## Working agreements for Claude

- Follow the phase plan in docs/02. Do not start a later phase's feature early or add scope without updating docs/16 first.
- Before implementing, state which doc sections apply. If a rule is missing or ambiguous, ask or propose a doc change rather than inventing.
- **Keep the dev servers running while developing** (web, api, worker, and the docker services they need) so the user can open the app and watch progress. Start them through the app's preview tooling using `.claude/launch.json` (create it in Phase 0), keep them running between steps, restart them after config or dependency changes, and tell the user the URL and what to look at after each visible change. Check the running app in the browser pane (console, network, mobile/dark/RTL) before reporting a UI change as done. Never leave a broken build running without saying so.
- Prefer small, reviewable changes with tests. Do not mark work done if tests, typecheck or lint fail; report failures as they are.
- Match surrounding code style; follow docs/14. Don't add dependencies lightly; justify new ones (size, maintenance, license, security).
- Never commit secrets, `.env` files, real farm data or production dumps. Use the seed generator for demo data.
- Never weaken security, RLS, validation or tests to make something pass.
- Update the relevant doc in the same change when behavior, schema or conventions change. Record big decisions in docs/15.
- Commits: Conventional Commits (`feat(milk): ...`), one logical change each. Don't push or open PRs unless asked.

## Commands (available after Phase 0 scaffolding; keep this list accurate)

```bash
pnpm install              # install workspace deps
pnpm setup:env            # create local .env with generated dev secrets (never overwrites)
pnpm services:up          # docker compose: Postgres, Redis, local S3 (needs Docker Desktop running)
pnpm dev                  # run web + api + worker via turbo (needs docker compose up -d)
pnpm verify               # all fast gates (contrast, format, lint, typecheck, unit); quiet unless a gate fails
pnpm verify:full          # + slower gates as they are added (integration/RLS, build, e2e); same as CI
pnpm lint && pnpm typecheck
pnpm test                 # unit tests
pnpm test:int             # integration tests (real Postgres + Redis, includes RLS leak suite)
pnpm test:e2e             # Playwright
pnpm db:migrate           # apply migrations
pnpm db:seed              # demo farm; use --large for 100 farms x 500 animals perf dataset
pnpm gen:api-client       # regenerate typed client from OpenAPI
pnpm gen:tokens           # regenerate theme.generated.css (Tailwind) and tokens.native.ts from tokens.css
pnpm storybook
```

## Current status

Planning complete (docs 00-16, tokens). Phase 0 in progress. E0.1 tooling done (Docker services verified; GitHub CI not yet run). E0.2 slice 1 done: theme to Tailwind mapping, base UI kit, app shell, web app with sample dashboard and `/design-system`, Urdu/RTL and dark mode reviewed in the browser. E0.2 slice 2 done (select/checkbox/switch/number/money inputs, dialogs, sheet, toast, tabs, data table on TanStack v9, ECharts wrapper, donut and list cards). Next: E0.2 slice 3 (remaining form controls and form kit, command palette, Storybook, visual regression); see [docs/briefs/E0.2-theme-and-ui-kit.md](docs/briefs/E0.2-theme-and-ui-kit.md). Update this section as epics and phases complete.
