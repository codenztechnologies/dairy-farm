# Screens, Navigation and Key Flows

Every screen implements the state standards in docs/01 section 10 (skeleton, empty, error, success, offline, forms, permissions). Labels use plain farm language (glossary in docs/11).

## 1. Navigation (web sidebar / mobile tabs)

**The shell follows the reference mockups** (docs/04 section 7); the screens inside it are designed by us from our own features: sidebar = Dashboard, Animals, Milk, Breeding, Health, Feed, Money, People, Stock, Reports (Milk Production, Animal Performance, Breeding, Health, Feed & Nutrition, Financial, Custom Reports), then Settings and Help & Support; top bar = farm switcher, global search (Ctrl K), notifications, language, user menu. "Today" is the Dashboard; Alerts and Tasks open from its cards and from the bell. The grouped table below lists the pages inside each sidebar item.

| Group | Items |
|---|---|
| Today | Today (role home), Alerts, Tasks |
| Animals | All animals, Groups & pens, Pedigree, Passports, Import |
| Milk | Daily milking, Quality tests, Tanks & batches, Customers, Price lists, Sales, Payments & ledger |
| Breeding | Heat & insemination, Pregnancy checks, Calvings, Semen & bulls, Reproduction KPIs |
| Health | Cases, Treatments, Vaccination programs & campaigns, Vets, Body condition |
| Feed | Rations, Feeding log, Feed items |
| Stock | Items, Batches & expiry, Purchases, Suppliers, Stock counts |
| Money | Overview, Transactions, Invoices, Bills, Accounts, Cost & profit, Budgets, Reports |
| People | Staff, Attendance, Payroll, Advances |
| Insights | Dashboard, Farm health score, Reports library |
| Settings | Farm, Users & roles, Devices, Units & currency, Alert rules, Notifications, Integrations, Plan & usage, Audit log, Data export |

Mobile bottom tabs: **Today, Animals, Milk, Tasks, More** + persistent Scan button and a role-based quick-add (Worker: "Record milk"; Vet: "New case"; Manager: "Add...").

Global: farm switcher, search (animals by tag/name/RFID/QR, customers, suppliers, staff), quick-add "+", notifications, sync status, language, theme, profile.

## 2. Screen inventory (Phase 1)

### Onboarding
Sign up -> verify email/phone -> Create farm wizard (name, country/region, species, herd size band, currency/units/timezone, language) -> Setup checklist (add groups, add animals or import, add milking sessions, invite team, set first price list) -> optional demo data.

### Today
- Owner: farm pulse (milk today vs yesterday, cash/receivables, alerts, health score, tasks overdue).
- Manager: anomalies to review (needs_review items, holds, low stock), today's schedule (due vaccinations, expected calvings, heats).
- Worker (simple mode): milking list for assigned groups, feeding checklist, my tasks, large buttons.
- Vet: cases, due checks, vaccination campaign list.

### Animals
List (virtualized table; filters: status, group, species, lactation state, age, search; saved views; bulk actions), Add/Edit (progressive form: essentials first, details optional), Profile (tabs: Overview, Timeline, Milk, Breeding, Health, Feed & cost, Pedigree, Files; header with status chip, withdrawal badge, QR), Group management, Import wizard (template download, validation preview with row errors, commit), Passport settings and public page.

### Milk
- Daily milking: choose date/session -> list of lactating animals with last yield, big numeric input, held animals pre-flagged, running total, save-all; keyboard/keypad optimized; offline.
- Quality entry, Tanks & batches, Customers (list, profile with ledger, statements), Price lists (rules editor with preview), Sales (quick sale from batch or stock), Payments, Ledger statement (PDF/WhatsApp).
- Discards with reasons.

### Breeding / Health / Feed / Stock / Money / People
List + detail + create patterns consistent with Animals: filter bar, table, side detail sheet, create sheet. Calendars for breeding and vaccination. Wizards for campaigns, payroll runs, allocation runs.

### Insights
Dashboard with date range and group filters; widgets from docs/02 section 2.10; "Explain this" links to underlying data; export.

## 3. Key flows (happy path and failure handling)

### F1 Record morning milk (mobile, offline)
1. Today -> "Record milk" (or Milk tab).
2. Select session (default by time) -> list of animals in the user's groups.
3. Tap animal row -> numeric keypad -> enter litres -> next animal auto-advances. Held animals show banner "Medicine hold until 28 Oct - milk is kept separate".
4. Review total -> Save. Toast: "Recorded 184.5 L from 22 animals (saved on this phone)". Sync pill updates when synced.
5. Failures: litres out of range -> inline "That looks too high for one milking (max 80 L). Check the number." Duplicate -> "Already recorded for this session. Edit it instead?" Sync reject -> appears in Needs attention.

### F2 Treat a sick animal
Scan tag -> profile -> "Report illness" -> symptoms/diagnosis -> add treatment (drug from catalog + stock item + dose + days) -> system shows "Milk hold until <date/time>; meat withdrawal <n> days" -> confirm -> hold created, stock deducted, follow-up task, alert to manager.

### F3 Sell milk on credit and collect payment
Sales -> pick customer (balance shown) -> quantity (L/kg) + batch (non-held only) -> price auto from list (override with permission, reason) -> credit-limit warning if relevant -> save -> invoice optional -> "Send on WhatsApp". Later: Payments -> select customer -> amount -> allocate to oldest invoices -> receipt.

### F4 Breeding cycle
Heat observed (scan -> "Heat seen") -> insemination (straw/bull, by whom; inbreeding check) -> expected calving shown -> tasks at day 35/60 -> pregnancy check result -> if positive: dry-off and calving alerts scheduled -> Calving record creates calf profile(s), resets lactation, starts a new lactation.

### F5 Purchase feed and use it
Stock -> New purchase order -> goods receipt (batch, expiry, cost) -> stock increases -> ration/feeding log consumes -> low-stock alert -> cost per litre updates next run.

### F6 Month close
Finance -> Close month: checks (unreconciled sales, missing payments, pending needs_review, draft payroll) -> run payroll -> run cost allocation -> lock period -> export reports.

### F7 Invite and permission a team member
Settings -> Users -> Invite (email/phone, role, groups) -> link by WhatsApp/SMS -> invitee sets PIN/password on the device -> Owner sees device list and can revoke.

### F8 Share an animal passport
Animal profile -> Passport -> choose visible fields (photos, lineage, vaccinations, milk summary) -> Publish -> link/QR/PDF -> Revoke anytime.

## 4. Form standards (summary of docs/01)

- Required fields marked; optional labelled "(optional)"; helper text under label; unit suffix inside field; errors on blur and submit with first-invalid focus; values preserved on failure; submit disabled while saving with spinner label; success toast names the object; "Save and add another" for repeated entry.
- Limits (defaults, per species/farm editable): litres 0-80, fat 0-15%, SNF 0-15%, body temp 35-43 C, weight 5-1500 kg, tag number 1-20 chars alphanumeric/hyphen, names 1-80 chars, notes up to 2,000 chars, phone per country, money 0-99,999,999.99, quantities up to 3 decimals.

## 5. Empty-state copy examples

- Animals: "No animals yet. Add your first animal or import your herd from a spreadsheet."
- Alerts: "All clear. Nothing needs your attention right now."
- Ledger: "No sales to this customer yet. Record the first sale to start their account."

## 6. Error-state copy examples

- Network: "We can't reach the server. Your entries are safe on this phone and will sync when you're back online."
- Permission: "You don't have access to Finance. Ask the farm owner to change your role."
- Not found: "We couldn't find that animal. It may have been deleted. [Go to animals]"
- Generic: "Something went wrong on our side. Try again. If it keeps happening, tell support code 7F3A-92."
