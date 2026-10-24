# DevOps, Environments and Runbooks

## 1. Environments

| Env | Purpose | Data | Deploy |
|---|---|---|---|
| local | Development | Seed generator | `docker compose up -d` + `pnpm dev` |
| ci | Automated tests | Ephemeral Testcontainers | GitHub Actions |
| staging | Prod-like verification, pilot demos, E2E | Anonymized seed (never prod copies) | Auto-deploy from `main` |
| production | Customers | Real | Manual approval of a tagged release |

## 2. Infrastructure (initial)

- 1-2 app VMs (api, web, worker containers) behind Caddy/Nginx; Cloudflare in front (WAF, TLS, caching of static assets, DDoS).
- Managed PostgreSQL on **Neon** (primary + read replica compute when needed, built-in PgBouncer), managed Redis, S3-compatible bucket. Neon has no regions in Pakistan, India or the Gulf; candidates are AWS Singapore and AWS Frankfurt, chosen by measured latency (spike S3). App servers run in the same region as the database. Backups: Neon instant restore plus our own scheduled `pg_dump` to a different provider/region.
- Docker images built in CI, tagged by git SHA, scanned (Trivy), pushed to a registry; Compose or a lightweight orchestrator in prod initially; Kubernetes only when scale demands.
- IaC: Terraform (or Pulumi) for cloud resources in `infra/terraform`; no manual console changes without recording them.
- Scaling path: vertical -> add API replicas -> read replica for reports -> partition/rollups -> queue worker autoscaling -> (later) region split.

## 3. Configuration and secrets

- 12-factor: config via environment variables validated at startup by a Zod schema (app refuses to boot on invalid config).
- Secrets in a secret manager (cloud KMS-backed) and injected at deploy; `.env.example` lists names only.

| Variable | Purpose |
|---|---|
| `NODE_ENV`, `APP_ENV` | runtime and environment name |
| `DATABASE_URL`, `DATABASE_READ_URL` | Postgres via the Neon **pooled** host (`-pooler`), app role, no BYPASSRLS |
| `DATABASE_MIGRATOR_URL` | Neon **direct** (unpooled) host, owner role, used only by migrations and maintenance jobs |
| `REDIS_URL` | cache, rate limit, queues |
| `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `JWT_KEY_ID` | EdDSA signing keys (rotation supported) |
| `COOKIE_DOMAIN`, `WEB_ORIGIN`, `CORS_ALLOWED_ORIGINS` | web cookie and CORS allowlist |
| `ENCRYPTION_MASTER_KEY_REF` | envelope encryption key reference |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION` | storage |
| `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM` | email |
| `SMS_PROVIDER`, `SMS_API_KEY` | SMS/OTP |
| `WHATSAPP_PROVIDER`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_WEBHOOK_SECRET` | WhatsApp |
| `EXPO_ACCESS_TOKEN`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | push |
| `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_ENDPOINT` | observability |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET` | bot protection |
| `RATE_LIMIT_*` | limits per route class |
| `FEATURE_FLAGS_SOURCE` | flags (db / env) |

## 4. CI/CD (GitHub Actions)

Pipeline on PR: install (frozen lockfile, cached) -> lint + typecheck -> unit -> integration (Postgres/Redis services + leak suite) -> build all -> E2E (Playwright, staging-like compose) -> bundle-size and Lighthouse budgets -> dependency/secret/SAST/container scans -> migration dry run on a snapshot -> OpenAPI diff.

Pipeline on `main`: same + build/push images + deploy to staging + smoke tests.

Release: tag `vX.Y.Z` -> changelog -> promote same images to production (approval) -> run migrations (expand phase first) -> blue-green switch -> smoke tests -> monitor 30 min -> contract-phase migration in a later release. Mobile: EAS build/submit; OTA for JS-only changes; minimum supported API version enforced by `/v1/meta/min-app-version`.

Branching: trunk-based with short-lived branches; protected `main`; required reviews/checks; signed commits optional.

## 5. Observability

- Logs: JSON via pino -> aggregator (Loki/ELK/vendor); request id correlation across web, api, worker.
- Metrics: RED (rate, errors, duration) per route, DB pool saturation, queue depth/age, job failure rate, sync success rate, p95/p99 latency, WhatsApp delivery rate.
- Traces: OpenTelemetry for web -> api -> db/redis/providers.
- Dashboards: API health, DB (slow queries, locks, replication lag, bloat), queues, business KPIs (active farms, records/day).
- Alerts (page vs ticket): API 5xx > 2% for 5 min, p95 above budget 10 min, DB connections > 80%, replication lag > 60 s, queue age > 10 min, backup failure, certificate expiry < 14 days, auth anomaly spikes, disk > 80%.
- Status page and uptime checks for web, API, and webhook endpoints.

## 6. Backup and recovery

- Postgres (Neon): instant restore / point-in-time recovery with a 30-day history window (plan permitting), plus a nightly logical `pg_dump` (encrypted) to object storage at a different provider/region, retained 35 days. The dump is the offsite copy and the exit path from Neon. Redis is cache/queue (rebuildable); queue persistence enabled but not a backup source of truth.
- Object storage: versioning + cross-region replication; deletion protection.
- Targets: RPO < 15 min, RTO < 4 h.
- **Quarterly restore drill** (scripted): restore latest backup to an isolated instance, run integrity checks and reconciliation tests, record duration. Failed drill = P1.

## 7. Runbooks (each as its own file in `docs/runbooks/` during Phase 0)

| Runbook | Summary |
|---|---|
| `restore-database.md` | Point-in-time restore steps, validating tenant isolation and reconciliation after restore |
| `deploy-and-rollback.md` | Blue-green switch, migration phases, how to roll back app vs data |
| `rotate-secrets.md` | JWT keys (dual-key overlap), DB passwords, provider tokens |
| `incident-response.md` | Severity levels, roles, comms template, evidence capture, breach notification (72 h), post-mortem template |
| `tenant-data-export-and-delete.md` | Per-farm export, 90-day grace, purge verification |
| `queue-stuck-or-dlq.md` | Inspect, replay, discard jobs safely (idempotency) |
| `slow-query.md` | Find via pg_stat_statements, EXPLAIN, index/rewrites, rollup refresh |
| `sync-incident.md` | Diagnosing mass `needs_review`, clock skew, min-version enforcement |
| `whatsapp-outage-or-template-reject.md` | Fallback to share links, template resubmission |
| `partition-maintenance.md` | Create/attach/detach partitions, archive old |
| `onboard-pilot-farm.md` | Data import, training checklist, support channel |

## 8. Capacity planning (initial assumptions)

- 1,000 farms x 150 animals = 150k animals; milk records ~ 1,000 farms x 100 lactating x 2.5 sessions x 365 = ~91M rows/year (partitioned monthly, ~7.6M/month). Fits a single well-indexed Postgres with partitions; rollups serve dashboards.
- Peak concurrent users ~ 5% of active (milking windows early morning/evening); plan for 3x burst at 5-7 am and 4-6 pm PKT. Queue sync pushes with rate limits per device.
- Storage: photos dominate; budget ~2 GB/farm/year at 1600 px compressed.

## 9. Operational policies

- Support SLA targets for pilot: response < 4 business hours; P1 within 1 hour.
- Change windows avoid peak milking hours (04:00-08:00 and 15:00-19:00 PKT).
- Data fixes in production only via reviewed, audited scripts (no ad-hoc SQL on tenant data).
- Dependency updates weekly (Renovate); security patches within 7 days (critical within 48 h).
