# Architecture Decision Log

Format: ID, decision, context, alternatives, consequences. New decisions get the next ID; superseded ones are marked, never deleted.

## ADR-001 Multi-tenant SaaS with shared schema and RLS
- **Context:** Many small farms, low per-farm revenue, need one codebase and cheap ops.
- **Decision:** Shared schema, `farm_id` on every table, Postgres Row-Level Security, composite FKs.
- **Alternatives:** schema per tenant (migration pain at scale), database per tenant (cost).
- **Consequences:** Excellent density and simple migrations; requires strict discipline and a leak-test suite; noisy-neighbor controlled by quotas, rate limits, indexes leading with `farm_id`. Enterprise isolation can be offered later via dedicated DB.

## ADR-002 TypeScript monorepo (Next.js, NestJS, Expo)
- **Context:** Solo build; maximize sharing of validation, types, and logic across web, mobile, API.
- **Decision:** pnpm + Turborepo; shared `contracts`, `domain`, `theme`, `i18n`.
- **Alternatives:** Django/Laravel + separate frontends (no type sharing), Flutter (no sharing with web).
- **Consequences:** One language and toolchain; strict boundaries enforced by tooling.

## ADR-003 Drizzle + hand-written SQL, REST + OpenAPI
- **Context:** Need control over indexes, RLS, partitioning, and report SQL; typed clients for web and mobile.
- **Decision:** Drizzle for schema/CRUD, raw SQL for heavy reads, REST with generated client.
- **Alternatives:** Prisma (less control over RLS/SQL), GraphQL (caching, auth, offline sync complexity).
- **Consequences:** More SQL ownership; excellent query predictability.

## ADR-004 Own authentication
- **Context:** Workers often lack email; PIN/phone login with device binding is essential; per-user vendor cost undesirable.
- **Decision:** Own auth with Argon2id, rotating refresh tokens, optional TOTP, PIN/OTP for workers.
- **Alternatives:** Clerk/Auth0/Supabase Auth.
- **Consequences:** More security responsibility; mitigated by standards, tests, and review checklist (docs/05). Reassess if enterprise SSO needed (OIDC/SAML module later).

## ADR-005 Offline-first for data entry only
- **Context:** Poor connectivity in sheds; full offline is a bug magnet.
- **Decision:** Offline writes for append-style operational records; read-cache for reference; admin/finance online.
- **Alternatives:** Online-only (fails users), full offline (complex conflicts).
- **Consequences:** Clear scope and test matrix (docs/09); `needs_review` workflow handles business conflicts.

## ADR-006 Native mobile via React Native (Expo)
- **Context:** User chose native apps over PWA; need camera, NFC, secure storage, push, background sync.
- **Decision:** Expo React Native sharing TypeScript packages with web.
- **Alternatives:** Flutter, PWA only.
- **Consequences:** Two UI layers (web and native) share tokens/contracts/domain but not components; budget extra time for mobile QA and store releases.

## ADR-007 Canonical units and money handling
- **Decision:** Store SI units and `numeric` money; convert at display; snapshot prices on sales.
- **Consequences:** Correct reports across unit preferences; no float errors.

## ADR-008 Append-only ledgers and soft deletes
- **Decision:** Ledger-like tables are insert-only; business records use soft delete; audit log is append-only.
- **Consequences:** Reliable history and reconciliation; need reversal flows and partial unique indexes.

## ADR-009 Design tokens as single source for visuals
- **Decision:** `packages/theme/tokens.css` with primitives -> semantic layers; native tokens generated.
- **Consequences:** One-place re-theme; lint rules block raw values.

## ADR-010 Apache ECharts for charts
- **Context:** Large time series, heatmaps, dual axes, RTL, theming.
- **Alternatives:** Recharts (weaker for big data), Chart.js, Highcharts (license).
- **Consequences:** Larger bundle (mitigated by modular imports and lazy loading); strong capabilities.

## ADR-011 Rollups and materialized views for dashboards
- **Decision:** Worker-maintained read models; API request path never aggregates raw big tables for dashboards.
- **Consequences:** Eventually consistent dashboards (seconds-minutes); explicit freshness indicator.

## ADR-012 Alerts as a rule engine with dedupe keys
- **Decision:** Typed rules, per-farm thresholds, idempotent evaluation.
- **Consequences:** Predictable, explainable alerts; ML insights deferred.

## ADR-013 WhatsApp Business API with provider interface and share-link fallback
- **Decision:** Official API behind an interface; fallback to `wa.me` until approval.
- **Consequences:** Approval lead time risk (tracked in docs/16); template governance needed.

## ADR-014 Manual billing in v1
- **Decision:** Super admin manages subscriptions and platform invoices; plans table with animal-count limits.
- **Consequences:** Fast launch; Phase 2 adds automated payments (JazzCash/Easypaisa/Stripe).

## ADR-015 Voice and WhatsApp inbound entry deferred to Phase 2
- **Context:** Accuracy and external approvals risk the "no bugs" goal.
- **Decision:** Ship outbound WhatsApp in v1; add voice/inbound later with confirmation step.

## ADR-018 Visual design follows the supplied mockups (supersedes the earthy editorial theme)
- **Context:** The user supplied five screen mockups (dashboard, animals list, add-animal form, milk production report, settings) as a design-language reference. They will not supply more; every other screen is designed by us with our own features and data in the same style.
- **Decision:** Rebuild the token palette and typography from the mockups: emerald primary, sky-blue milk/info, cool slate neutrals, Inter (Latin) and Noto Naskh Arabic (Urdu); cards, KPI tiles, donuts, chips and table styles as shown. Keep the token architecture, i18n/RTL, dark mode and accessibility rules.
- **Approved deviations:** button green darkened for contrast, stronger input borders, darker morning series, chart patterns, minimum text sizes (docs/04 section 10).
- **Consequences:** Faster, lower-risk UI build (a concrete target to compare against); less distinctive than the earlier concept, so differentiation shifts to product features and polish. Mobile, RTL, dark mode and most module screens are designed by us and reviewed in the browser with the user. Weather widget and a custom report builder appear in the mockups and become scoped items.

## ADR-017 Neon as the managed PostgreSQL provider (for now)
- **Context:** User chose Neon for the initial period. Neon supports the extensions we need (`pg_trgm`, `pg_partman`, `pg_cron`), read replicas, branching for staging/test databases, and PgBouncer in transaction mode.
- **Alternatives:** AWS RDS (previous recommendation: nearest regions in Mumbai/UAE, full parameter control), DigitalOcean Managed Postgres, Aurora.
- **Consequences:**
  - No Neon region in Pakistan, India or the Gulf (nearest: AWS Singapore, AWS Frankfurt), so higher latency to farms; mitigated by offline-first mobile, Cloudflare, and keeping app and DB in one region. Measure in spike S3.
  - Pooled connections run PgBouncer in transaction mode: session-level `SET` does not persist, so tenant context must use `SET LOCAL` inside the request transaction (already the rule in docs/01). Migrations and `pg_cron` setup use the direct connection. RLS behavior under the pooler must be covered by the leak suite.
  - Disable scale-to-zero on production (cold starts); set the history window to 30 days.
  - Neon provides point-in-time recovery, not an offsite copy: nightly `pg_dump` to another provider is mandatory.
  - Keep SQL and tooling standard Postgres so migration to RDS or another host stays a dump-and-restore. Reassess at the pilot gate or when latency, cost or limits hurt.

## ADR-019 Local-dev tooling choices made in E0.1
- **Local S3:** RustFS (`rustfs/rustfs`) instead of MinIO. On 2026-10-24 no current official MinIO image could be found on Docker Hub or Quay. Production uses managed S3-compatible storage, and app code only speaks the S3 API, so this is swappable. Config was written without a running Docker daemon: verify on first `pnpm services:up`.
- **TypeScript pinned to 6.0.3** (not 7.x): typescript-eslint 8.72 declares support for `<6.1.0`. Renovate holds `typescript` below 6.1 until that changes; revisit at the pilot gate.
- **Dependency install scripts denied by default** (pnpm `allowBuilds`); each exception is listed with a reason in `pnpm-workspace.yaml` (currently `unrs-resolver: false`, not needed).
- **DB roles from day one:** `dairy_owner` (migrations) and `dairy_app` (runtime, `NOBYPASSRLS`) in local Postgres, mirroring the Neon setup so RLS behaves the same locally.
- **Node tests for lint rules:** custom ESLint rules are tested with `node:test` + ESLint `RuleTester` (no extra test dependency in `packages/config`).

## ADR-020 Tokens reach Tailwind through a generated mapping
- **Context:** tokens.css must stay the single source (also feeding React Native), while Tailwind v4 only creates utilities for variables declared in `@theme`.
- **Decision:** `pnpm gen:tokens` generates `theme.generated.css` (a `@theme inline` block with identical names) and `tokens.native.ts`. `pnpm verify` fails if they are stale. `--color-*: initial` removes Tailwind's default palette so raw colours cannot be used.
- **Consequences:** Re-theming is one file. tokens.css must remain unlayered so its values win over the same-named theme declarations. Generated files are never edited by hand.

## ADR-016 Hosting: containers on VPS/cloud with managed data services
- **Decision:** Docker, managed Postgres/Redis/S3, Cloudflare; Kubernetes deferred.
- **Consequences:** Low cost and operational simplicity; clear scaling path in docs/13.
