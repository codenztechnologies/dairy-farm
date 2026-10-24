# Architecture and Engineering Standards

Companion to [00-decisions.md](00-decisions.md). Where they disagree, 00-decisions wins.

## 1. Repository layout (pnpm + Turborepo)

```
apps/
  web/            Next.js (App Router) - farm dashboard + public animal passport + marketing shell
  api/            NestJS - REST API, OpenAPI, auth, RBAC, jobs
  mobile/         Expo React Native - offline-first field app
  worker/         NestJS standalone - BullMQ processors (alerts, reports, WhatsApp, exports)
packages/
  db/             Drizzle schema, SQL migrations, RLS policies, seeds, hand-written report SQL
  contracts/      Zod schemas + inferred types + permission catalog (single source of truth)
  api-client/     Generated typed client from OpenAPI (used by web + mobile)
  theme/          Design tokens (tokens.css + TS export) - the ONLY place visual values live
  ui/             Shared web component library (Radix + Tailwind, token-driven)
  i18n/           Message catalogs en/ur, formatters (number, date, unit, currency)
  domain/         Pure business logic (cost allocation, gestation, withdrawal, pricing formulas, health score)
  config/         Shared tsconfig, eslint, prettier
docs/
infra/            Dockerfiles, compose, CI workflows, backup scripts
```

Rule: `domain` and `contracts` have no framework imports, so web, mobile, API and worker share identical logic and validation.

## 2. Runtime topology

```
Cloudflare (WAF, TLS, cache static) -> Reverse proxy (Caddy/Nginx)
   -> web (Next.js)     -> api (NestJS, N replicas, stateless)
   mobile ------------->  api
api -> PostgreSQL (primary + 1 read replica for reports) | Redis | S3 storage
worker -> PostgreSQL | Redis | S3 | WhatsApp provider | FCM/APNs | email
```

- API is stateless; scale horizontally behind the proxy.
- Heavy reads (dashboards, reports) hit the read replica or materialized views.
- Scheduled work (alerts, rollups, invoices, backups verification) runs in `worker` via BullMQ with idempotent jobs.

## 3. Multi-tenancy and data safety

- Every business table has `farm_id uuid not null`. Accounts own farms; an organization can own several farms (Enterprise).
- Each request opens a transaction and runs `SET LOCAL app.farm_id`, `app.user_id`; RLS policies on every table: `USING (farm_id = current_setting('app.farm_id')::uuid)`.
- The API DB role is NOT a superuser and cannot bypass RLS. Migrations use a separate owner role.
- CI includes a tenant-leak test suite: for every table, user of farm A must read/update/delete zero rows of farm B.
- Soft delete (`deleted_at`) on business records; all unique constraints are partial (`WHERE deleted_at IS NULL`).
- Append-only `audit_log` (who, what, before/after JSON diff, IP, device, request id) written by DB trigger or service interceptor for all mutating operations on sensitive tables.
- Money: `numeric(14,2)` minor precision per currency, never float. Quantities: `numeric(12,3)`. Stored in canonical units (liter, kg, Celsius, meter); converted at display by the farm's unit settings.
- Timestamps `timestamptz` UTC; "business date" columns (`date`) for farm-local days (milking date), computed using the farm timezone at write time.

## 4. Authentication and authorization

- Passwords: Argon2id. Email or phone as login identifier. Breached-password check (k-anonymity), min length 10 (workers use PIN flow below).
- Tokens: access JWT 10 min (EdDSA), refresh token 30 days, rotating with reuse detection (reuse revokes the whole family). Web: httpOnly, Secure, SameSite=Lax cookies + CSRF double-submit token for state-changing calls. Mobile: refresh token in secure storage (Keychain/Keystore).
- Worker login: phone + 6-digit PIN or OTP, bound to a registered device; lockout after 5 failures; owner can revoke devices.
- Optional TOTP 2FA (mandatory for Owner on Pro+ via setting). Session list with remote logout.
- RBAC: permissions are `module.action` strings from `contracts` (e.g. `milk.record.create`, `finance.invoice.void`). A guard checks the permission per route; the UI hides what the user cannot do but the server is the authority. Row-scope rules (e.g. a Milker sees only assigned groups) are expressed as scopes on the role.
- Rate limiting (Redis): global per IP, tighter on auth, OTP and export endpoints. Idempotency-Key header on all POSTs that create money or stock effects.

## 5. HTTP and security hardening

- Strict CORS allowlist from env (web origin, mobile uses no browser origin); no wildcard; credentials only for the web origin.
- Headers via Helmet and Next.js middleware: CSP (nonce-based, no `unsafe-inline`), HSTS preload, X-Content-Type-Options, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera only on scan pages), COOP/CORP, frame-ancestors none (except none for passport embed).
- Input: every endpoint validates body, query, params with the shared Zod schema; unknown keys are rejected (strict). Output is shaped by DTO mappers so internal columns never leak.
- File uploads: size/type allowlist, magic-byte check, AV scan job, stored under tenant-prefixed keys, served by short-lived signed URLs; images re-encoded to strip EXIF.
- Secrets in env/secret manager, never in repo; dependency audit and secret scan in CI; Renovate for updates; lockfile pinned.
- Public passport page: opaque unguessable slug, owner-controlled field visibility, revocable, no PII of buyers, rate limited and cacheable.

## 6. API conventions

- REST, versioned `/v1`, OpenAPI 3.1 generated from NestJS + Zod; typed client generated into `packages/api-client`.
- Resource naming plural kebab-case; cursor pagination (`?limit=&cursor=`, max 100) on large collections; filtering/sorting by allowlisted fields only.
- Standard error envelope (RFC 9457 problem+json):
  `{ type, title, status, code, detail, requestId, errors: [{ field, code, message }] }`.
  `code` is stable and machine-readable (e.g. `MILK_WITHDRAWAL_ACTIVE`); `message` is localized, human, and says how to fix it.
- Optimistic concurrency via `version` column / `If-Match` on updates; conflicts return 409 `STALE_VERSION`.
- Bulk endpoints for offline sync and imports; each item reports its own success or error.
- Every request carries/returns `X-Request-Id`; structured JSON logs (pino) with farm_id and user_id; OpenTelemetry traces; Sentry for errors on web, mobile and API.

## 7. Offline sync (mobile)

- Local store: SQLite (via WatermelonDB or op-sqlite + own layer; decision in spike S1 before Phase 1 mobile work).
- Offline-writable entities: milk records, health events, treatments, feeding logs, tasks completion, attendance, animal notes/photos. Others are read-cached.
- Client generates UUIDv7 ids and `client_created_at`; writes go to an outbox queue. Sync = `POST /v1/sync/push` (ordered batch, idempotent per op id) then `GET /v1/sync/pull?since=<server_seq>` per entity group.
- Conflict policy: events are append-only so they never conflict; for mutable rows use field-level last-writer-wins with server `version`; business-rule conflicts (e.g. milk recorded for an animal under withdrawal, duplicate session) are accepted with a `needs_review` flag and surfaced to the manager rather than silently dropped.
- Visible sync status in the UI (synced / pending N / failed with retry and reason). Attachments upload in the background with resume.
- Test matrix: airplane-mode edits, two devices editing the same animal, clock skew, interrupted sync, token expiry mid-sync.

## 8. Performance and scale

- Budgets: API p95 < 200 ms for CRUD, < 800 ms for dashboards; web LCP < 2.5 s on mid-range Android over 4G; mobile cold start < 3 s.
- Indexing: all composite indexes lead with `farm_id`. Time-series tables (`milk_records`, `feed_logs`, `audit_log`, `alerts`) are range-partitioned by month with BRIN on date where append-ordered and B-tree on `(farm_id, animal_id, record_date desc)`.
- Aggregates: daily/monthly rollup tables maintained by worker and materialized views for dashboards (milk by day, cost per liter, herd KPIs); refreshed incrementally.
- Queries: no N+1 (explicit joins or batched loaders), keyset pagination, EXPLAIN-checked in review for any query touching a table > 100k rows; slow query log and `pg_stat_statements` reviewed in CI perf job on a seeded dataset (100 farms x 500 animals x 2 years of milk).
- Caching: Redis for permissions per session, plan limits, reference data (breeds, species templates); HTTP ETag on reference endpoints; Next.js ISR for public passport pages.
- Pooling with PgBouncer (transaction mode) - note `SET LOCAL` is used so it stays pooler-safe.

## 9. Background jobs and alerts

Jobs (BullMQ, idempotent, retried with backoff, dead-letter visible to admins):
- Alert evaluation (hourly + on write): heat window, expected calving, dry-off date, vaccination due, withdrawal-ends, low yield vs rolling baseline, suspected mastitis (yield drop + SCC/CMT flag), low stock, overdue receivables.
- Daily owner summary (WhatsApp + in-app push) at the farm's local time.
- Rollups and materialized-view refresh, invoice generation, report exports (CSV/XLSX/PDF), data export per farm, backup verification.
- Notification channels behind provider interfaces: WhatsApp (Business API, wa.me fallback), push (FCM/APNs via Expo), email, in-app.

## 10. UX standards (apply to every screen)

Each screen ships with ALL of these states, enforced by the shared `ui` components and a PR checklist:
1. **Loading**: skeleton matching the final layout (no spinners for page content); button-level loading with disabled double submit.
2. **Empty**: illustration + one sentence explaining what this is + primary action ("Add your first animal"). Filtered-empty differs from truly-empty.
3. **Error**: inline, specific, actionable message from the error envelope; retry button; offline banner; error boundaries per route with request id shown for support.
4. **Success**: toast or inline confirmation naming what happened ("Milk recorded: 12.5 L for Cow #245"), with Undo where safe.
5. **Forms**: one shared `Form` kit (TanStack Form + Zod). Required marked, optional labelled "(optional)", helper text under fields, errors on blur and on submit, focus first invalid field, preserve input on failure, unit suffixes, min/max with sensible domain limits (e.g. milk per session 0-80 L, body temp 35-43 C), input masks for phone/CNIC-style IDs, and dirty-form leave warning.
6. **Destructive actions**: confirm dialog stating consequences; soft delete with restore.
7. **Guidance**: contextual help text, "why this matters" tooltips, guided setup checklist for new farms, sample data toggle.
8. **Accessibility**: WCAG 2.2 AA, keyboard navigable, 44 px touch targets on mobile, color never the only signal, reduced-motion respected.
9. **Language**: all strings via i18n keys (no hard-coded text); RTL handled with logical CSS properties; numbers/dates/units/currency through shared formatters.

Validation regex library lives in `contracts/validators`: Pakistani mobile (`^(?:\+92|0)3\d{2}-?\d{7}$`), CNIC (`^\d{5}-?\d{7}-?\d$`), international phone via libphonenumber, tag numbers (farm-configurable pattern, default `^[A-Za-z0-9-]{1,20}$`), email per RFC-lite plus MX-agnostic, decimals with fixed scale, ISO dates.

## 11. Environments and delivery

- Environments: local (docker compose), staging (prod-like, anonymized seed), production.
- CI (GitHub Actions): typecheck, lint, unit, integration (Postgres + Redis services, RLS leak tests), build, Playwright E2E, dependency + secret scan, migration dry-run, bundle-size check. Merge blocked on red.
- Migrations: forward-only, reviewed SQL, zero-downtime pattern (expand -> migrate -> contract). Feature flags table for gradual rollout.
- Releases: web/API via blue-green containers; mobile via EAS builds with OTA updates for JS-only fixes; API stays backward compatible with the last 2 mobile versions (min-supported-version check forces upgrade when needed).
- Backups/DR per 00-decisions; runbooks for restore, key rotation, incident response in `docs/runbooks/` (written in Phase 0).

## 12. Definition of Done (per feature)

Contracts defined -> migration + RLS + indexes -> domain logic with unit tests -> API with validation, permissions, audit -> web + mobile UI with all states -> i18n en/ur + RTL check -> integration + E2E tests -> docs/help text -> perf check on seeded data -> accessibility check.
