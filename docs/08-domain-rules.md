# Domain Rules, Formulas and Alert Catalog

All logic below lives in `packages/domain` as pure, unit-tested functions. Defaults are data (species templates and farm settings), not code constants.

## 1. Species defaults (editable templates)

| Species | Gestation (days) | Heat cycle (days) | Heat duration | Voluntary wait after calving (days) | Dry period (days) | Puberty (months) |
|---|---|---|---|---|---|---|
| Cattle | 283 | 21 (18-24) | 12-18 h | 60 | 60 | 14-15 |
| Buffalo | 310 | 21 (18-24), silent heat common | 12-24 h | 60-90 | 60 | 24-30 |
| Goat | 150 | 21 | 24-48 h | 45 | 60 | 7-10 |
| Sheep | 147 | 17 | 24-36 h | 45 | 45 | 8-12 |
| Camel | 390 | induced ovulator | n/a | 90 | 60 | 36-48 |

These are starting values; farm vets can edit them per farm. Buffalo uses longer wait and a "silent heat" prompt in alerts.

## 2. Animal lifecycle state machine

Status: `calf -> heifer -> (pregnant heifer) -> lactating <-> dry -> ...`, terminal: `sold`, `dead`, `culled`. Side state `quarantined`.

- `lactation_state` is derived: `lactating` after calving until dry-off; `dry` after dry-off; `none` for calves/bulls/heifers.
- `lactation_no` increments at each calving. `last_calving_date` updated at calving.
- Transitions are validated (e.g., a `sold` animal cannot receive milk records); disposals require date and reason; sale links to a customer and optional invoice.
- Age-based auto suggestions (calf -> heifer at 12 months default) create tasks; never auto-change without confirmation.

## 3. Milk rules

- Allowed per-session litres: 0-80 (cattle/buffalo), configurable per species; warn above 2x the animal's 30-day average, block above hard max.
- `kg` and `litres` are interconvertible with density 1.03 kg/L default (editable). Stored as litres canonical; kg shown on demand.
- One record per (animal, date, session). Duplicate offline entries become `needs_review` and are merged by a manager.
- **Milk hold:** a treatment with a drug whose `milk_withdrawal_hours > 0` creates a hold from `start_on` through `last_dose_time + withdrawal_hours` (rounded up to the next full session). During a hold: records are accepted but flagged `is_held`, excluded from batches and sales, and show a clear banner. Override requires `milk.hold.override` plus a reason and is audited. Meat withdrawal blocks disposal-as-meat sale similarly (`meat_withdrawal_days`).
- Mastitis suspicion: CMT positive or SCC above threshold (default 400,000 cells/ml) flags the quarter/animal; milk goes to discard unless manager overrides.
- Batch: groups non-held records of a session/tank; `avg_fat`, `avg_snf` = volume-weighted. Discards reduce available volume.
- Lactation curve: 305-day projection using Wood's model `y(t) = a * t^b * e^(-c t)` fitted per animal after >= 30 days; falls back to herd average when data is thin.

## 4. Pricing

- Price list selected per customer; a list has `effective_from` and method: `flat` (price per litre), `fat_tiers` (rows with fat range -> price), or `formula` (price = base + fat_rate * (fat% - ref_fat) + snf_rate * (snf% - ref_snf)).
- Price on a sale is resolved at sale date and **snapshotted** on the line; later price changes never alter past sales.
- Units: sale in litres or kg; amount = quantity x unit price, rounded half-up to currency minor unit per line, total = sum of lines.
- Credit: sale increases customer balance (debit); payment decreases (credit). Credit limit check warns, blocks only if farm setting `enforce_credit_limit` is on.

## 5. Breeding rules

- Expected calving = insemination date + species gestation (or mating date for natural service). Pregnancy check recommended at day 35 (ultrasound) and 60-90 (palpation).
- Heat window alert: expected next heat = last heat + cycle +/- 3 days; if a post-calving animal has no heat by `voluntary_wait + 30`, flag "no heat observed".
- Insemination timing hint: best 12 h after standing heat observed (shown as guidance only).
- Dry-off date = expected calving - dry period (default 60 days); task generated 7 days before.
- Calving creates up to N offspring animals (calf profiles with dam, sire from the insemination, DOB, sex, birth weight); twins supported; stillbirth recorded without creating a live animal.
- Inbreeding check: coefficient of inbreeding computed from pedigree up to 5 generations; warn >= 6.25%, strong warning >= 12.5% before saving an insemination/mating plan.
- KPIs: conception rate = confirmed pregnancies / inseminations (by first service and overall); services per conception; days open = calving to conception date; calving interval; heat detection rate; abortion rate.

## 6. Health rules

- Vaccination programs generate due dates per animal by age/species and previous dose; overdue = after due date + grace (default 7 days).
- A treatment course (start, end, doses) consumes inventory at recording; cost attaches to the animal and to the health event.
- Quarantine: animals flagged `quarantined` are excluded from group transfers and show a warning on milk entry.
- Mortality analysis groups by age band and cause.

## 7. Feed rules

- Ration is per group per head per day (kg as-fed, optional dry matter). Daily planned requirement = head_count x ration quantity.
- Actual feeding log lines deduct stock FEFO; shortages block with a clear message or allow negative stock when the farm setting permits (flagged for review).
- Cost per head per day = sum(item qty x batch unit cost) / head_count.
- Feed efficiency (feed conversion) = litres milk / kg dry matter fed (group level).

## 8. Cost allocation (profit per animal, cost per litre)

Run per period (default monthly, also daily preview). Inputs: all costs in the period by category and their allocation driver.

1. **Direct costs** (medicine, vet, semen, vaccination): attached to the animal.
2. **Group costs** (feed by group ration, group-specific labor): split across the group's animals by *head-days* in the period (or dry-matter intake if configured).
3. **Shared costs** (general labor, electricity, rent, depreciation, overhead): split across lactating animals by *milk share* (or all animals by head-days; per-category setting).
4. **Revenue:** milk allocated by actual litres x average realized price for the period; calf/animal sales at disposal.
5. Per animal: `cost_per_litre = total_cost / litres`, `margin = revenue - cost`, `margin_per_day`.
6. Rounding: allocate with `numeric(14,4)`, round to 2 dp, and add the remainder to the animal with the largest share so allocations sum exactly to the source total.
7. Runs are replaceable: re-running a period deletes and re-inserts that period's ledger rows in one transaction; closed periods require `finance.cost.run` and are locked after month close.
8. "Cull candidates": animals with margin below farm threshold for 3 consecutive periods and an age/lactation/reproduction reason list (e.g., days open > 180, repeated mastitis); always shown with reasons and never auto-acted.

## 9. Farm Health Score (0-100)

| Factor | Weight | Measure |
|---|---|---|
| Fertility | 25 | conception rate, days open vs target |
| Animal health | 20 | disease incidence per 100 cows/month, mastitis rate |
| Milk performance | 20 | yield trend vs own 90-day baseline and lactation curve |
| Feed efficiency | 15 | litres per kg DM vs own baseline/target |
| Calf & mortality | 10 | calf mortality, culling due to disease |
| Operational discipline | 10 | task completion rate, record completeness |

Each factor maps to 0-100 using farm-editable target bands; score = weighted sum; missing data lowers confidence (shown) rather than silently scoring zero. Every factor shows its inputs and a "what to do next" suggestion.

## 10. Alert catalog (rule engine)

Each rule: key, default thresholds (editable per farm), severity, dedupe key, default recipients, suggested action.

| Key | Trigger | Severity | Action |
|---|---|---|---|
| `heat.expected` | Expected heat in next 2 days | info | Observe animal; create task |
| `heat.missed` | No heat by voluntary wait + 30 d | warning | Vet check |
| `breeding.pregnancy_check_due` | 35 / 60 d after insemination | info | Create task |
| `calving.upcoming` | 14 and 3 d before expected | warning | Move to calving pen |
| `calving.overdue` | > expected + 7 d | critical | Call vet |
| `dryoff.due` | 7 d before dry-off date | info | Plan dry-off |
| `vaccination.due` / `.overdue` | due in 7 d / past due | warning / critical | Open campaign |
| `milk.hold.active` | Treatment created hold | warning | Exclude milk (auto) |
| `milk.hold.ending` | Hold ends within 12 h | info | Prepare release |
| `milk.yield_drop` | Yield < 70% of 7-day avg for 2 sessions | warning | Check health |
| `milk.mastitis_suspect` | CMT/SCC flag or yield drop + temp | critical | Treat/isolate |
| `milk.tank_variance` | Batch total differs from animal sum > 3% | warning | Re-measure |
| `stock.low` | On hand < reorder level | warning | Create PO |
| `stock.expiring` | Batch expires in 30 d | warning | Use first / return |
| `receivable.overdue` | Invoice past due | info/warning | Send reminder |
| `credit.limit_exceeded` | Balance > limit | warning | Contact customer |
| `task.overdue` | Past due date | info | Reassign |
| `attendance.missing` | No check-in by shift start + 60 min | info | Contact staff |
| `sync.failed_ops` | Device has failed ops > 24 h | warning | Resolve conflicts |
| `subscription.limit_near` | >= 90% animal limit | info | Upgrade |

Engine behavior: evaluated on relevant writes and by hourly sweep; `dedupe_key` (`rule:entity:window`) guarantees one open alert per condition; resolving the condition auto-closes; users can snooze or convert to a task; notifications respect per-user channel and quiet hours.

## 11. Units and conversion

- Canonical: litre, kilogram, Celsius, metre, PKR minor units by currency decimals (PKR 2).
- Display options: litre/gallon (US/UK), kg/lb/seer/maund (1 maund = 40 kg; 1 seer = 0.9331 kg traditional, shown as farm-defined), Celsius/Fahrenheit.
- Conversions centralized in `domain/units` with round-trip tests; never convert inline in components.

## 12. Dates and time

- All instants UTC; each farm has an IANA timezone (default `Asia/Karachi`).
- "Business date" for milking = farm-local date at session start, saved on the row so reports don't depend on later timezone changes.
- Fiscal year start month configurable (default July for Pakistan, January otherwise).
- Hijri date display optional in UI only; storage always Gregorian.
