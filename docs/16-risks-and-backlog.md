# Risks, Open Items and Backlog

## 1. Risk register

| ID | Risk | Likelihood | Impact | Mitigation | Owner/When |
|---|---|---|---|---|---|
| R1 | Scope too large for solo build; delays or quality drop | High | High | Strict phases; exit criteria; no new scope without docs/16 update; cut order defined (section 3) | Every phase review |
| R2 | Tenant data leak via RLS gap | Low | Critical | RLS + composite FKs + automated leak suite + non-bypass role + code review checklist | Phase 0 |
| R3 | Offline sync bugs corrupt or lose data | Medium | High | Narrow offline scope, idempotent ops, `needs_review`, extensive harness (docs/09), pilot monitoring | Phase 0 spike S1; 1A |
| R4 | WhatsApp approval delays | High | Medium | Start in Phase 0; fallback share links; provider interface | Phase 0 |
| R5 | Urdu/RTL quality issues (shaping, bidi, fonts) | Medium | High | Early RTL in design system, visual regression, native reviewer, real device testing | Phase 0 and 1D |
| R6 | Domain rules wrong (withdrawal, gestation, pricing) | Medium | High | Vet advisor review of docs/08 values; editable templates; unit tests; clear disclaimers; manager override audited | Before Phase 1B |
| R7 | Poor adoption by non-technical workers | Medium | High | Simple mode, big buttons, Urdu, pictograms, training material, pilot feedback loops | 1A onward |
| R8 | Performance degradation on large tenants | Medium | Medium | Partitioning, rollups, budgets, load tests on seeded large data | Each phase |
| R9 | Security incident (auth, uploads, abuse) | Low | Critical | docs/05 controls, pen-test checklist, external test before scale, monitoring | Phase 1D |
| R10 | SMS/OTP cost fraud | Medium | Medium | Throttles, caps, Turnstile, allowlisted regions | Phase 0 |
| R11 | Mobile app store rejection/delays | Medium | Medium | Early test builds, privacy labels, follow guidelines, OTA for fixes | Phase 1A |
| R12 | Data import messy (farms' spreadsheets) | High | Medium | Import wizard with validation preview, templates, assisted onboarding | 1A |
| R13 | Dependency vulnerabilities / abandoned packages | Medium | Medium | Renovate, audits, minimal deps | Continuous |
| R14 | Regulatory/privacy changes (Pakistan data protection) | Low | Medium | Data export/delete, minimization, region choice, counsel review before GA | Before GA |
| R16 | Neon limits: no nearby region (latency), pooled-connection restrictions affect RLS context, no native offsite backup, plan limits/cost at scale | Medium | Medium | Offline-first mobile, app and DB co-located, `SET LOCAL` only plus leak tests through the pooler, nightly `pg_dump` offsite, standard-Postgres-only code, reassess at pilot gate | Phase 0 spike S3 |
| R15 | Single-person bus factor | Medium | High | Documentation (this set), runbooks, automation, backups of keys/accounts | Continuous |

## 2. Open items

| # | Item | Needed by |
|---|---|---|
| O1 | Plan prices per tier (Starter/Growth/Pro/Enterprise) | Before pilot |
| O2 | WhatsApp BSP choice and Meta verification status | Phase 0 (start) |
| O3 | Legal entity, terms of service, privacy policy text | Before pilot |
| O4 | Final product name, logo, domain (mockups use "DairyPro"; check it is free to use before adopting it) | Before public launch |
| O5 | SMS provider selection for Pakistan | Phase 0 |
| O6 | Neon chosen as DB provider (ADR-017). Still open: region (Singapore vs Frankfurt, by measured latency), Neon plan, app hosting provider in that region, offsite backup target | Phase 0 |
| O7 | Vet/dairy advisor to validate docs/08 defaults and drug catalog seed (withdrawal times) | Before 1B |
| O8 | Pilot farms (3-5) identified and agreement | Before 1D |
| O9 | Mobile store accounts (Apple Developer, Google Play) | Phase 1A |
| O10 | Drug catalog source/licensing (Pakistan-registered veterinary drugs) | 1B |
| O11 | Urdu reviewers (farm staff) | 1D |
| O12 | Closed: no further mockups will be supplied. Unmocked screens are designed by us in the mockups' style and reviewed live with the user (docs/04 section 7) | n/a |
| O13 | Weather widget data source (free, keyless provider such as Open-Meteo) and whether it stays in v1 | Phase 1D |

## 3. Scope control

If time pressure appears, cut in this order (never cut tests, security, tenancy, or sync safety):
1. Pedigree genetic-merit index (keep basic tree).
2. Public passport PDF styling (keep link).
3. Budgets module and advanced reports.
4. NFC (keep QR).
5. Health score refinements (keep simple version).
6. WhatsApp Business API automation (keep share links).

## 4. Epic backlog (initial, ordered)

### Phase 0
E0.1 Monorepo, tooling, CI/CD, docker compose · E0.2 Theme package + UI base kit + Storybook · E0.3 DB package, migrations, RLS harness, seed generator · E0.4 Auth, sessions, devices, 2FA · E0.5 RBAC engine + permission catalog + audit log · E0.6 API platform (error envelope, validation, OpenAPI, rate limits, idempotency, observability) · E0.7 i18n + RTL foundation · E0.8 Spikes S1 (offline store), S2 (WhatsApp BSP), S3 (query baseline) · E0.9 Runbooks and backup automation · E0.10 High-fidelity design mock-ups.

### Phase 1A
E1.1 Farm setup wizard and settings · E1.2 Users, invites, roles UI · E1.3 Animals CRUD, groups, import, QR labels, scan · E1.4 Milk sessions, entry (web + mobile offline), quality, tanks/batches · E1.5 Customers, price lists, sales, payments, ledger, statements · E1.6 Dashboard v1, notifications center · E1.7 Mobile sync engine and Needs-attention inbox.

### Phase 1B
E2.1 Breeding module + KPIs · E2.2 Health/treatments + drug catalog · E2.3 Withdrawal holds across milk/batches/sales · E2.4 Vaccination programs/campaigns · E2.5 Feed items, rations, feeding logs · E2.6 Task engine + auto tasks · E2.7 Alert rule engine v1.

### Phase 1C
E3.1 Inventory (items, batches, FEFO, counts) · E3.2 Purchasing and suppliers · E3.3 Finance (transactions, accounts, invoices, bills) · E3.4 Cost allocation engine + profit per animal/cost per litre · E3.5 Staff, attendance, payroll, advances · E3.6 Reports pack and exports · E3.7 Month close.

### Phase 1D
E4.1 Health score + insights · E4.2 Pedigree + inbreeding · E4.3 Animal passport · E4.4 WhatsApp outbound (API or fallback) · E4.5 Super Admin console, plan limits, usage meter · E4.6 Onboarding polish + help center · E4.7 Urdu QA with farm staff · E4.8 Performance, accessibility, security hardening, load test · E4.9 Pilot rollout and bug-bash.

### Phase 2 / 3
See docs/02 sections 4 (Phase 2: delivery routes, animal trading, voice entry, WhatsApp inbound, online payments; Phase 3: crops/fodder, equipment, IoT, benchmarking, public API and webhooks).

## 5. Success metrics (for pilot and beyond)

- Activation: farm records milk for 7 consecutive days within 14 days of sign-up.
- Reliability: data-integrity defects = 0; sync success rate > 99.5%; API availability >= 99.9%.
- Usability: new worker completes first milk entry within 5 minutes unaided; task success rate > 90% in usability tests.
- Performance: budgets in docs/01 met at P95.
- Value: cost per litre visible for >= 80% of active farms by month 2; owner weekly active rate > 70%.
