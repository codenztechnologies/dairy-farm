# Features and Phased Roadmap

## 1. Personas and what each sees first

| Persona | Device | Home screen |
|---|---|---|
| Owner | Web + phone | Farm pulse: today's milk, cash position, alerts, health score |
| Farm Manager | Web + phone | Today's work: tasks, due events, anomalies to review |
| Veterinarian | Phone | My cases: sick/treatment/vaccination/pregnancy checks |
| Accountant | Web | Receivables, expenses, invoices, P&L |
| Supervisor | Phone | Group/pen view, task assignment, attendance |
| Worker / Milker | Phone (offline) | Big-button entry: milking list, feeding checklist, my tasks |
| Driver (Phase 2) | Phone | Route stops |

Navigation principle: the sidebar is organized by farm activity ("Animals", "Milk", "Breeding", "Health", "Feed", "Money", "People", "Stock"), not by database table. Every record links to its related records (animal -> milk, health, breeding, cost, lineage).

## 2. Phase 1 modules (v1)

### 2.1 Platform foundation
- Sign-up, farm creation wizard (name, location, species, currency, units, timezone, language), guided setup checklist, optional sample data.
- Users, invitations (email/SMS/WhatsApp link), roles and custom roles, devices, sessions, 2FA.
- Multi-farm switcher (Enterprise), farm settings, plan and usage meter (animal count vs limit), invoices from platform (manual).
- Audit log viewer, notifications center, global search (animals by tag/name/RFID, customers, suppliers), data import (CSV/XLSX templates with validation preview) and export.
- Platform Super Admin console: farms, plans, manual subscription activation, support impersonation (audited, time-boxed, read-only default), feature flags, system health.

### 2.2 Herd registry
- Animal profile: tag/ear-tag number, RFID/NFC, QR, name, species, breed, sex, DOB (or estimated), color, photos, origin (born/purchased), sire/dam links, status (calf, heifer, lactating, dry, pregnant, sold, dead, culled, quarantined), group/pen, weight history.
- Lifecycle events: birth, purchase, transfer between groups, weaning, status change, sale, death/culling with reason.
- Groups/pens with capacity; bulk move; filters, saved views, sortable tables; QR labels printing (PDF sheets).
- Pedigree tree (3-5 generations), inbreeding warning at mating planning.
- Public animal passport (toggle, fields chosen, PDF + link, QR).

### 2.3 Milk production and sales
- Sessions (morning/noon/evening, configurable). Entry modes: per-animal (list with big numeric keypad), per-group total, per-tank/bulk total.
- Quality: fat %, SNF %, protein, SCC, temperature, adulteration flags; per-animal CMT test.
- Milk tanks/batches with traceability; discard records (withdrawal, mastitis, spoilage).
- Withdrawal enforcement: milk from a treated animal is auto-flagged "not for sale" until the withdrawal ends; batch totals exclude it.
- Customers (households, shops, dairies, collection centers), price lists with effective dates, fat/SNF price formulas, per-customer overrides, daily recurring supply, sales/deliveries, payments, and the credit ledger (udhar) with running balance and statements.
- Reports: per-animal lactation curve, 305-day projection, daily/weekly/monthly totals, group comparison, yield drop detection.

### 2.4 Breeding and reproduction
- Heat events (observed/with signs), insemination (AI with semen straw/bull, natural), pregnancy checks (date, method, result), expected calving, dry-off planning, calving record (ease, calf details auto-create calf profiles), abortion/retained placenta.
- Reproductive KPIs: service per conception, days open, calving interval, heat detection rate, conception rate; per-animal and herd.
- Semen inventory, bull registry, mating plan suggestions (avoid close inbreeding).

### 2.5 Health and veterinary
- Health events (illness, injury, mastitis, lameness, metabolic), diagnoses, treatments with drug, dose, route, duration, cost; follow-ups.
- Withdrawal periods (milk and meat) from drug catalog; automatic clearance dates.
- Vaccination and deworming programs per species/age, schedules generate due tasks; herd-wide vaccination campaigns with batch recording.
- Vet visits, vet directory, body condition score, lab results, quarantine records, mortality analysis.
- Medicine usage deducts from inventory; costs flow to the animal's cost ledger.

### 2.6 Feed and nutrition
- Feed items (fodder, silage, concentrate, minerals), nutrient profile (DM, CP, ME optional), purchase cost.
- Rations per group (editable recipes) with cost per head per day; feeding logs (planned vs actual), leftover tracking.
- Feed inventory with consumption driven by feeding logs, low-stock alerts, supplier purchase flow.
- Feed conversion and feed cost per liter per animal/group.

### 2.7 Finance
- Chart of accounts (simple, farm-friendly categories; accountant mode exposes full double-entry views), income and expense with categories, attachments, payment methods (cash, bank, JazzCash/Easypaisa as labels), accounts/wallets.
- Customer receivables, supplier payables, invoices (PDF, share by WhatsApp), receipts, credit limits, aging report.
- Cost allocation engine (see differentiators): feed, medicine, labor, overhead allocated to animals and groups.
- Reports: P&L (farm, group, animal), cash flow, receivables aging, expense breakdown, budget vs actual, tax-ready export.

### 2.8 Staff and tasks
- Staff directory (separate from system users), roles, salary structure, attendance (mobile check-in with optional geofence), advances/loans, monthly payroll, payslips.
- Tasks and checklists (daily milking prep, cleaning, feeding rounds), assignment, due dates, recurring templates, photo proof, completion tracking.
- Auto-generated tasks from health, breeding and feed schedules.

### 2.9 Inventory
- Items (medicine, semen, supplies, spare parts), units, locations, batches with expiry, receipts, issues, adjustments, stock counts, reorder levels, suppliers, purchase orders.
- Stock movement ledger is the single source of truth; every deduction is linked to its cause (treatment, feeding, repair).

### 2.10 Insights and alerts
- Smart alerts (see architecture doc section 9) with severity, snooze, assign-to-task, and per-role routing.
- Dashboard widgets (ECharts): milk trend, per-group yield, cost per liter, herd composition, reproduction funnel, receivables, health events, task completion.
- Farm Health Score (0-100) built from fertility, udder/health incidence, yield trend, feed efficiency, mortality, task discipline; each factor explained with "what to do next".
- Daily owner summary via WhatsApp.
- Dashboard weather chip (temperature and condition for the farm location, from a free keyless provider; cached; hidden if unavailable). Visible in the mockup; low priority and first to cut.
- Dashboard layout follows the mockup: greeting, health score, six KPI cards, milk production chart, herd composition, key metrics, tasks, alerts, top animals, milk sales, income vs expenses, upcoming events.

## 3. Differentiators (v1) - how each works

1. **Profit per animal and cost per liter.** `domain/cost-allocation`: direct costs (medicine, semen, vet) attach to the animal; shared costs (feed by group ration, labor, electricity, depreciation) are allocated by configurable drivers (head-days, dry-matter intake, milk share). Output: daily cost ledger per animal, cost/liter, margin, ranking, "culling candidates" list with the reasoning shown.
2. **Withdrawal-aware milk.** A treatment with a drug withdrawal writes a `milk_hold` for that animal; milk entry, tank batching, and sales all respect holds with a clear message and manager override (audited).
3. **Smart alerts.** Rule engine with typed rules, thresholds editable per farm, explanation in plain words, one-tap action.
4. **WhatsApp outbound.** Daily summary, invoice and ledger statements to customers, vaccination reminders to the vet/staff; opt-in tracking, templates localized en/ur.
5. **QR/NFC scan.** Camera QR scan and NFC tag read open the animal or log a quick event; printable tag sheets.
6. **Farm Health Score and insights.** Transparent formula, trend, benchmark against the farm's own history and anonymized peer ranges (opt-in).
7. **Pedigree and genetic merit.** Tree view, inbreeding coefficient, daughter-yield index for sires.
8. **Animal passport.** Verified, shareable record to build buyer trust; basis for Phase 2 animal trading.
9. **Urdu-first usability for non-technical staff.** Pictogram-supported big buttons, Urdu numerals option, Urdu terms checked by farm workers, "simple mode" role view that exposes only today's work.

## 4. Phases

Each phase ends with a releasable, fully tested slice. Exit criteria are strict: no known P1/P2 bugs, DoD from architecture doc section 12 satisfied for every item.

### Phase 0 - Foundations (spikes and scaffolding)
- Monorepo, CI/CD, docker compose, environments, lint/type strictness, commit hooks.
- `theme` tokens + `ui` base kit (Button, Input, Select, DatePicker, Table, Dialog, Toast, Skeleton, EmptyState, ErrorState, Form kit, Charts wrapper) with Storybook and visual regression.
- DB package with migration tooling, RLS harness, tenant-leak test suite, seed generator for large datasets.
- Auth, sessions, RBAC engine, audit log, rate limiting, error envelope, OpenAPI client generation, i18n with RTL, observability.
- Spike S1: offline store (WatermelonDB vs op-sqlite + custom) with sync prototype. Spike S2: WhatsApp BSP selection and template approval started. Spike S3: query performance baseline.
- Runbooks and backup/restore automation.
- **Exit:** a user can sign up, create a farm, invite a staff user with a custom role, sign in on web and mobile, and everything is audited and tenant-isolated; CI green with leak tests.

### Phase 1A - Herd and milk (first usable product)
- Herd registry, groups, QR labels, lifecycle events, imports.
- Milk entry (web + offline mobile), quality, tanks, customers, price lists, sales, payments, ledger, statements.
- Basic dashboard, notifications center, daily summary (in-app first).
- **Exit:** a real farm can run daily milking and milk sales end to end on web and offline on mobile.

### Phase 1B - Health, breeding, feed
- Breeding module and KPIs, health and vaccination programs, withdrawal holds wired into milk, feed rations and logs.
- Task engine and auto-generated tasks; alert rule engine v1.
- **Exit:** a withdrawal hold blocks milk sale; a calving creates a calf; vaccination campaign generates tasks; feed cost per animal visible.

### Phase 1C - Money, people, stock
- Inventory with batches and expiry, purchasing, finance (income, expense, invoices, receivables, payables), cost allocation engine, staff, attendance, payroll.
- Reports pack, exports, P&L per animal and cost per liter.
- **Exit:** monthly close works; cost/liter reconciles with ledger totals in automated tests.

### Phase 1D - Intelligence, sharing, hardening
- Health Score, insights, pedigree and inbreeding, animal passport, WhatsApp Business API outbound (or fallback if approval pending), QR/NFC on mobile.
- Super Admin console, plan limits enforcement, onboarding wizard polish, help center content, Urdu QA pass with real farm staff.
- Performance, accessibility, security review (internal pen-test checklist, dependency review), load test (see section 5), full E2E suite.
- **Exit = v1 release candidate.** Beta with 3-5 pilot farms for 4-6 weeks; bug-fix only; then GA.

### Phase 2
- Milk delivery routes (customers, route planning, driver app, proof of delivery, collection).
- Animal trading (listings, buyers, deals, transport, passport integration).
- Urdu voice entry; WhatsApp inbound entry (structured message parsing with confirmation step).
- Online payments (JazzCash/Easypaisa/Stripe) and automated subscription billing.
- Custom report builder (the "Custom Reports" item in the mockup sidebar); v1 ships the fixed reports only.

### Phase 3
- Crops and fodder (fields, sowing, irrigation, harvest, silage), equipment and maintenance, IoT integrations (milking meters, collars, scales), advanced benchmarking, open API and webhooks.

## 5. Quality gates for "no bugs"

- Zero open P1/P2 defects to exit any phase; P3 list is reviewed and time-boxed.
- Coverage: 80%+ on `domain`, `contracts`, and API services; every state machine (animal status, invoice, stock, sync) has property-based or table-driven tests.
- Reconciliation tests: milk produced = sold + discarded + home use + in tank; ledger balances; stock movements sum to on-hand; cost allocation sums to total costs.
- Load test target: 1,000 farms, 200 concurrent users, 50 req/s sustained, p95 within budgets.
- Pilot farms provide real-world data before GA; production monitoring with alerts on error rate, latency, queue depth, and sync failures.
- Honest note: no system is provably bug-free. The strategy above is how we get as close as practical and detect the remainder fast.
