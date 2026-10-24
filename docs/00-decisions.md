# Dairy Farm Platform: Locked Decisions (v0.1)

Status: agreed in the planning interview. Change only through an explicit revision of this file.

## Product
- Multi-tenant SaaS. Target: Pakistani mid-size farms (20-500 animals). International farms supported through per-farm configuration.
- Solo build (user + AI pair), quality over speed, no fixed deadline.
- Billing: manual billing and invoices at launch. Plan limits (by animal count) are designed in from the start.

## Platforms
- Responsive web app and native mobile app (React Native + Expo).
- Mobile is offline-first for data entry only: milk, health, feeding, tasks, attendance. Queued sync, client-generated UUIDs, conflict rules. Admin and finance screens are online-only.

## Stack
- Monorepo (pnpm + Turborepo), TypeScript everywhere, shared Zod schemas and a generated typed API client.
- Web: Next.js, Tailwind CSS v4, Radix primitives (own components, shadcn-style), TanStack Query/Table/Form, Zod, Apache ECharts.
- Backend: NestJS, REST + OpenAPI, Drizzle ORM (SQL-first) plus hand-written SQL / materialized views for heavy reports.
- Data: PostgreSQL (shared schema, tenant_id on every table, Row-Level Security, composite indexes leading with farm_id, monthly partitioning for milk records), Redis (cache, queues, rate limits), S3-compatible object storage.
- Hosting: Docker on a single VPS/cloud region, managed Postgres/Redis, Cloudflare in front, GitHub Actions CI/CD.

## Auth and security
- Own auth: email or phone + password (Argon2id), short-lived JWT access token + rotating refresh token (httpOnly cookie on web), optional TOTP 2FA, phone-OTP/PIN login with device binding for workers.
- RBAC: default roles (Owner, Farm Manager, Veterinarian, Accountant, Supervisor, Worker, Driver, Read-only) plus custom roles. Permissions are `module.action` strings, enforced server-side and by RLS. Separate platform Super Admin.
- Rate limiting, lockout, audit log, strict CORS allowlist, security headers (CSP, HSTS, etc.).

## Localization
- Languages: English and Urdu (RTL). i18n architecture ready for more.
- Per-farm settings: currency (PKR default, any ISO code), units (liter/kg default; maund/seer, gallon/lb optional), timezone, date format, fiscal year, tax profile. Values stored in canonical SI units and converted at display.

## Domain
- Species: cattle and buffalo primary; goat, sheep, camel via species templates (gestation, heat cycle, pricing defaults live in data).
- Milk pricing: flat per-liter, per-customer price lists with effective dates, fat/SNF formulas; liter and kg measures.

## Scope
- Phase 1 (v1) modules: Herd registry, Milk production and sales, Breeding, Health/vet, Feed and nutrition, Finance (with customer credit ledger), Staff and tasks, Inventory.
- v1 differentiators: cost-per-liter and profit-per-animal engine; smart alerts (heat windows, withdrawal-period milk blocking, low yield, mastitis, vaccination due); WhatsApp outbound (daily summary, invoices, ledgers); QR/NFC ear-tag scan; farm health score and insights; pedigree tree; public animal passport.
- Phase 2: milk delivery routes, animal trading, Urdu voice entry, WhatsApp inbound entry.
- Phase 3: crops and fodder, equipment and maintenance.

## Theme
- Revised (v0.4): the visual design language follows the reference mockups in `mockups/` (bright, clean: cool off-white canvas, white bordered cards, emerald primary, sky-blue milk/info colour, pastel icon tiles, Inter + Noto Naskh Arabic). They set the style, not every screen: we design all screens ourselves from our own features and data in that language. Approved deviations for accessibility are listed in docs/04 section 10. Light and dark modes. This supersedes the earlier "earthy editorial" direction (ADR-018).
- All values are design tokens (CSS variables) in a single theme file. No hard-coded colors, fonts, radii or spacing in components.

## Operations decisions (v0.2)
- Name: working codename "Dairy Farm". The brand name lives in one config file plus i18n strings; finalize before public launch.
- Plan tiers by animal count: Starter (up to 25), Growth (up to 150), Pro (up to 500), Enterprise (unlimited, custom). Stored in a `plans` table; prices and caps change without code. Prices TBD.
- WhatsApp outbound: WhatsApp Business API from the start (automatic daily summaries, invoices, ledgers). Needs Meta business verification, a BSP and template approval, so start that process early. Build behind a provider interface, with wa.me share links as the fallback until approval lands.
- Backups: daily full + continuous WAL archiving (PITR 7-30 days), RPO < 15 min, RTO < 4 h, offsite copy in a second region, quarterly restore test. Soft delete + audit trail; hard purge 90 days after cancellation.
- Compliance: privacy policy and terms, per-farm data export and deletion, encryption in transit and at rest, audit log, primary region near Pakistan. No formal certification at launch.
- Testing: unit tests, API integration tests on real Postgres including RLS tenant-leak tests, Playwright E2E for core flows, mobile offline-sync tests. CI blocks merges on failure; 80%+ coverage on business logic; strict TypeScript, lint and dependency scanning.

## Database hosting (v0.3)
- Managed PostgreSQL on **Neon** for now (user decision). Pooled connections (PgBouncer, transaction mode) for the API and worker, direct connection for migrations. Scale-to-zero disabled on production; instant-restore history window set to 30 days (plan permitting).
- Neon has no region in Pakistan, India or the Gulf. Nearest candidates are AWS Singapore and AWS Frankfurt; pick by measured latency from Karachi/Lahore. Place API and worker in the same region as the database.
- Neon's instant restore covers point-in-time recovery only. The offsite-backup requirement above is met by a scheduled logical backup (`pg_dump`) to storage in a different provider/region, with a quarterly restore drill.
- Exit path: standard Postgres only (no Neon-specific SQL or APIs in application code), so moving to RDS or another host later is a dump-and-restore plus a connection-string change. See ADR-017.

## Still open
- Plan prices (decided later, before launch).
- Meta/WhatsApp business verification status and chosen BSP.
