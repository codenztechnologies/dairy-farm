# Database Design and ERD

PostgreSQL 16+. Diagrams are Mermaid (render in GitHub, VS Code, or any Mermaid viewer). Diagrams show keys and the columns that matter for relations and queries; the full column lists are defined in `packages/db/src/schema/*` during implementation and must follow the conventions below.

## 1. Global conventions

| Rule | Detail |
|---|---|
| Primary keys | `uuid` UUIDv7 (time-ordered, index friendly, client-generatable for offline) |
| Tenancy | `farm_id uuid not null` on every business table + RLS policy. Exceptions: global reference tables (`species`, `breeds`, `drug_catalog`, `plans`, `permissions`) and platform tables |
| Audit columns | `created_at`, `updated_at`, `created_by`, `updated_by`, `version int` (optimistic lock) |
| Soft delete | `deleted_at timestamptz null`; unique indexes are partial `WHERE deleted_at IS NULL` |
| Money | `numeric(14,2)`; currency stored on the farm, and on each foreign-currency document with `exchange_rate numeric(18,8)` |
| Quantities | `numeric(12,3)`, canonical units (L, kg, C, m) |
| Enums | Postgres enums for closed sets that change rarely; lookup tables for farm-configurable sets (e.g. expense categories) |
| Naming | snake_case, plural table names, FK = `<entity>_id` |
| Sync | Offline-writable tables also carry `client_id uuid`, `client_created_at`, `server_seq bigint` (identity, for pull) and `needs_review boolean` |
| Constraints | CHECK constraints for domain limits (e.g. `litres between 0 and 80`), FK with explicit ON DELETE (RESTRICT by default), composite FKs `(farm_id, id)` to prevent cross-tenant references |
| Cross-tenant safety | Child tables reference parents with composite FK `(farm_id, parent_id) -> parent(farm_id, id)` so a row can never point into another farm |

## 2. Identity, tenancy, access

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ FARMS : owns
    ORGANIZATIONS ||--o{ SUBSCRIPTIONS : has
    PLANS ||--o{ SUBSCRIPTIONS : defines
    SUBSCRIPTIONS ||--o{ PLATFORM_INVOICES : bills
    USERS ||--o{ FARM_MEMBERSHIPS : joins
    FARMS ||--o{ FARM_MEMBERSHIPS : has
    ROLES ||--o{ FARM_MEMBERSHIPS : assigned
    FARMS ||--o{ ROLES : "custom roles"
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : in
    USERS ||--o{ USER_DEVICES : registers
    USERS ||--o{ AUTH_SESSIONS : opens
    AUTH_SESSIONS ||--o{ REFRESH_TOKENS : rotates
    FARMS ||--o{ INVITATIONS : sends
    FARMS ||--o{ AUDIT_LOG : records
    USERS ||--o{ AUDIT_LOG : acts
    FARMS ||--o{ NOTIFICATIONS : emits
    USERS ||--o{ NOTIFICATIONS : receives
    FARMS ||--o{ FILES : stores

    ORGANIZATIONS { uuid id PK
        text name }
    FARMS { uuid id PK
        uuid organization_id FK
        text name
        text country_code
        char3 currency_code
        text timezone
        text locale
        jsonb unit_prefs
        jsonb settings
        timestamptz deleted_at }
    USERS { uuid id PK
        citext email UK
        text phone UK
        text password_hash
        text pin_hash
        bool totp_enabled
        text locale
        bool is_platform_admin }
    FARM_MEMBERSHIPS { uuid id PK
        uuid farm_id FK
        uuid user_id FK
        uuid role_id FK
        uuid staff_id FK
        jsonb scope
        text status }
    ROLES { uuid id PK
        uuid farm_id FK "null for system roles"
        text key
        bool is_system }
    PERMISSIONS { text key PK
        text module }
    ROLE_PERMISSIONS { uuid role_id FK
        text permission_key FK }
    PLANS { uuid id PK
        text code UK
        int animal_limit
        int user_limit
        jsonb features }
    SUBSCRIPTIONS { uuid id PK
        uuid organization_id FK
        uuid plan_id FK
        text status
        date current_period_end }
    PLATFORM_INVOICES { uuid id PK
        uuid subscription_id FK
        numeric amount
        text status }
    USER_DEVICES { uuid id PK
        uuid user_id FK
        text device_label
        timestamptz revoked_at }
    AUTH_SESSIONS { uuid id PK
        uuid user_id FK
        uuid device_id FK
        inet ip }
    REFRESH_TOKENS { uuid id PK
        uuid session_id FK
        text token_hash
        uuid family_id
        timestamptz used_at }
    INVITATIONS { uuid id PK
        uuid farm_id FK
        text channel
        text token_hash
        uuid role_id FK }
    AUDIT_LOG { uuid id PK
        uuid farm_id FK
        uuid user_id FK
        text entity
        uuid entity_id
        text action
        jsonb diff
        timestamptz at }
    NOTIFICATIONS { uuid id PK
        uuid farm_id FK
        uuid user_id FK
        text kind
        jsonb payload
        timestamptz read_at }
    FILES { uuid id PK
        uuid farm_id FK
        text storage_key
        text mime
        int size_bytes
        text entity
        uuid entity_id }
```

Notes
- `audit_log` is monthly-partitioned and append-only (no UPDATE/DELETE grants).
- Seeded system roles: owner, manager, veterinarian, accountant, supervisor, worker, driver, readonly. Custom roles clone a system role.
- `farm_memberships.scope` holds row-scope rules (e.g. group ids a worker may see).

## 3. Herd

```mermaid
erDiagram
    SPECIES ||--o{ BREEDS : has
    SPECIES ||--o{ SPECIES_TEMPLATES : configures
    FARMS ||--o{ ANIMAL_GROUPS : has
    FARMS ||--o{ ANIMALS : owns
    BREEDS ||--o{ ANIMALS : classifies
    ANIMAL_GROUPS ||--o{ ANIMALS : contains
    ANIMALS ||--o{ ANIMAL_GROUP_HISTORY : moves
    ANIMALS ||--o{ ANIMAL_STATUS_HISTORY : changes
    ANIMALS ||--o{ ANIMAL_WEIGHTS : weighed
    ANIMALS ||--o{ ANIMAL_IDENTIFIERS : tagged
    ANIMALS ||--o{ ANIMALS : "sire and dam"
    ANIMALS ||--o{ ANIMAL_PASSPORTS : publishes
    ANIMALS ||--o{ ANIMAL_EVENTS : "timeline"
    ANIMALS ||--o| ANIMAL_DISPOSALS : "sold or died"

    SPECIES { uuid id PK
        text code UK
        int gestation_days
        int heat_cycle_days
        jsonb defaults }
    BREEDS { uuid id PK
        uuid species_id FK
        text name }
    SPECIES_TEMPLATES { uuid id PK
        uuid species_id FK
        jsonb vaccination_program
        jsonb milk_defaults }
    ANIMAL_GROUPS { uuid id PK
        uuid farm_id FK
        text name
        text kind
        int capacity }
    ANIMALS { uuid id PK
        uuid farm_id FK
        text tag_number
        text name
        uuid species_id FK
        uuid breed_id FK
        text sex
        date dob
        bool dob_estimated
        text origin
        uuid sire_id FK
        uuid dam_id FK
        uuid group_id FK
        text status
        text lactation_state
        int lactation_no
        date last_calving_date
        timestamptz deleted_at }
    ANIMAL_IDENTIFIERS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        text kind
        text value }
    ANIMAL_GROUP_HISTORY { uuid id PK
        uuid animal_id FK
        uuid group_id FK
        date from_date
        date to_date }
    ANIMAL_STATUS_HISTORY { uuid id PK
        uuid animal_id FK
        text status
        date at_date
        text reason }
    ANIMAL_WEIGHTS { uuid id PK
        uuid animal_id FK
        date weighed_on
        numeric weight_kg }
    ANIMAL_EVENTS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        text kind
        uuid ref_id
        date event_date }
    ANIMAL_PASSPORTS { uuid id PK
        uuid animal_id FK
        text public_slug UK
        jsonb visible_fields
        timestamptz revoked_at }
    ANIMAL_DISPOSALS { uuid id PK
        uuid animal_id FK
        text kind
        date on_date
        numeric amount
        uuid customer_id FK
        text reason }
```

Notes
- `ANIMALS` unique: `(farm_id, tag_number) WHERE deleted_at IS NULL`; identifiers unique on `(farm_id, kind, value)`.
- `animals.lactation_state`, `lactation_no`, `last_calving_date` are denormalized and maintained by domain logic for fast list filters; the events remain the truth.
- `animal_events` is a lightweight timeline index (kind + ref to the source row) powering the animal profile feed without 8-way unions.
- Pedigree queries use a recursive CTE on `sire_id/dam_id` limited to 5 generations.

## 4. Milk and sales

```mermaid
erDiagram
    FARMS ||--o{ MILKING_SESSIONS : defines
    MILKING_SESSIONS ||--o{ MILK_RECORDS : captures
    ANIMALS ||--o{ MILK_RECORDS : yields
    MILK_RECORDS ||--o{ MILK_QUALITY_TESTS : tested
    FARMS ||--o{ MILK_TANKS : has
    MILK_TANKS ||--o{ MILK_BATCHES : fills
    MILK_RECORDS }o--|| MILK_BATCHES : "batched into"
    MILK_BATCHES ||--o{ MILK_DISCARDS : "loses"
    ANIMALS ||--o{ MILK_HOLDS : "withdrawal"
    CUSTOMERS ||--o{ PRICE_LISTS : "custom prices"
    PRICE_LISTS ||--o{ PRICE_LIST_RULES : "fat snf tiers"
    CUSTOMERS ||--o{ MILK_SALES : buys
    MILK_BATCHES ||--o{ MILK_SALE_LINES : "sold from"
    MILK_SALES ||--o{ MILK_SALE_LINES : contains
    CUSTOMERS ||--o{ CUSTOMER_LEDGER : balance
    MILK_SALES ||--o{ CUSTOMER_LEDGER : "debits"
    PAYMENTS ||--o{ CUSTOMER_LEDGER : "credits"
    CUSTOMERS ||--o{ PAYMENTS : pays

    MILKING_SESSIONS { uuid id PK
        uuid farm_id FK
        text name
        time start_time }
    MILK_RECORDS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        uuid session_id FK
        date record_date
        numeric litres
        numeric kg
        numeric fat_pct
        numeric snf_pct
        uuid batch_id FK
        bool is_held
        uuid client_id
        bigint server_seq }
    MILK_QUALITY_TESTS { uuid id PK
        uuid milk_record_id FK
        text test_kind
        numeric value }
    MILK_TANKS { uuid id PK
        uuid farm_id FK
        text name
        numeric capacity_l }
    MILK_BATCHES { uuid id PK
        uuid farm_id FK
        uuid tank_id FK
        date batch_date
        numeric total_l
        numeric avg_fat
        text status }
    MILK_DISCARDS { uuid id PK
        uuid batch_id FK
        numeric litres
        text reason }
    MILK_HOLDS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        uuid treatment_id FK
        date starts_on
        date ends_on
        text released_by }
    CUSTOMERS { uuid id PK
        uuid farm_id FK
        text name
        text kind
        text phone
        numeric credit_limit
        uuid price_list_id FK }
    PRICE_LISTS { uuid id PK
        uuid farm_id FK
        text name
        date effective_from
        text method }
    PRICE_LIST_RULES { uuid id PK
        uuid price_list_id FK
        numeric fat_from
        numeric fat_to
        numeric price }
    MILK_SALES { uuid id PK
        uuid farm_id FK
        uuid customer_id FK
        date sale_date
        numeric total_amount
        uuid invoice_id FK }
    MILK_SALE_LINES { uuid id PK
        uuid sale_id FK
        uuid batch_id FK
        numeric quantity_l
        numeric unit_price }
    PAYMENTS { uuid id PK
        uuid farm_id FK
        uuid customer_id FK
        uuid account_id FK
        numeric amount
        date paid_on }
    CUSTOMER_LEDGER { uuid id PK
        uuid farm_id FK
        uuid customer_id FK
        text entry_type
        uuid ref_id
        numeric debit
        numeric credit
        date entry_date }
```

Notes
- `milk_records` unique `(farm_id, animal_id, record_date, session_id) WHERE deleted_at IS NULL` prevents duplicate entry (offline duplicates become `needs_review`).
- `customer_ledger` is append-only; balance = sum(debit - credit); a cached `customers.balance` is updated in the same transaction and reconciled nightly.
- Reconciliation invariant: sum(milk_records.litres) = batched + discarded + home use + unbatched.

## 5. Breeding and health

```mermaid
erDiagram
    ANIMALS ||--o{ HEAT_EVENTS : shows
    ANIMALS ||--o{ INSEMINATIONS : receives
    SEMEN_STRAWS }o--o{ INSEMINATIONS : used
    BULLS ||--o{ SEMEN_STRAWS : produces
    INSEMINATIONS ||--o{ PREGNANCY_CHECKS : confirmed
    ANIMALS ||--o{ PREGNANCY_CHECKS : examined
    ANIMALS ||--o{ CALVINGS : gives
    CALVINGS ||--o{ CALVING_OFFSPRING : produces
    CALVING_OFFSPRING }o--|| ANIMALS : "creates calf"
    ANIMALS ||--o{ HEALTH_EVENTS : suffers
    HEALTH_EVENTS ||--o{ TREATMENTS : treated
    DRUG_CATALOG ||--o{ TREATMENTS : uses
    TREATMENTS ||--o| MILK_HOLDS : "creates"
    VETS ||--o{ HEALTH_EVENTS : attends
    VACCINATION_PROGRAMS ||--o{ VACCINATION_SCHEDULES : plans
    VACCINATION_PROGRAMS ||--o{ VACCINATION_CAMPAIGNS : runs
    VACCINATION_CAMPAIGNS ||--o{ VACCINATIONS : records
    ANIMALS ||--o{ VACCINATIONS : receives
    ANIMALS ||--o{ BODY_CONDITION_SCORES : scored

    HEAT_EVENTS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        timestamptz observed_at
        text signs }
    BULLS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        text name
        text breed }
    SEMEN_STRAWS { uuid id PK
        uuid farm_id FK
        uuid bull_id FK
        uuid inventory_batch_id FK
        text code }
    INSEMINATIONS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        text method
        uuid straw_id FK
        uuid sire_id FK
        date done_on
        uuid by_staff_id FK
        date expected_calving }
    PREGNANCY_CHECKS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        uuid insemination_id FK
        date checked_on
        text method
        text result }
    CALVINGS { uuid id PK
        uuid farm_id FK
        uuid dam_id FK
        uuid insemination_id FK
        date calved_on
        text ease
        text outcome }
    CALVING_OFFSPRING { uuid id PK
        uuid calving_id FK
        uuid animal_id FK
        text sex
        numeric birth_weight_kg
        text status }
    HEALTH_EVENTS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        text category
        text diagnosis
        date started_on
        date resolved_on
        uuid vet_id FK
        text severity }
    VETS { uuid id PK
        uuid farm_id FK
        text name
        text phone }
    DRUG_CATALOG { uuid id PK
        text name
        int milk_withdrawal_hours
        int meat_withdrawal_days }
    TREATMENTS { uuid id PK
        uuid farm_id FK
        uuid health_event_id FK
        uuid drug_id FK
        uuid item_id FK
        numeric dose
        text route
        date start_on
        date end_on
        numeric cost }
    VACCINATION_PROGRAMS { uuid id PK
        uuid farm_id FK
        text name
        uuid species_id FK }
    VACCINATION_SCHEDULES { uuid id PK
        uuid program_id FK
        text vaccine
        int age_days
        int interval_days }
    VACCINATION_CAMPAIGNS { uuid id PK
        uuid farm_id FK
        uuid program_id FK
        date planned_on
        text status }
    VACCINATIONS { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        uuid campaign_id FK
        uuid item_id FK
        date given_on
        date next_due }
    BODY_CONDITION_SCORES { uuid id PK
        uuid animal_id FK
        date scored_on
        numeric score }
```

## 6. Feed, inventory, purchasing

```mermaid
erDiagram
    FEED_ITEMS ||--|| ITEMS : "is an"
    ITEM_CATEGORIES ||--o{ ITEMS : groups
    ITEMS ||--o{ ITEM_BATCHES : stocked
    LOCATIONS ||--o{ ITEM_BATCHES : holds
    ITEM_BATCHES ||--o{ STOCK_MOVEMENTS : moves
    SUPPLIERS ||--o{ PURCHASE_ORDERS : receives
    PURCHASE_ORDERS ||--o{ PURCHASE_LINES : contains
    ITEMS ||--o{ PURCHASE_LINES : buys
    PURCHASE_ORDERS ||--o{ GOODS_RECEIPTS : fulfilled
    GOODS_RECEIPTS ||--o{ STOCK_MOVEMENTS : creates
    ANIMAL_GROUPS ||--o{ RATIONS : fed
    RATIONS ||--o{ RATION_LINES : composed
    ITEMS ||--o{ RATION_LINES : in
    ANIMAL_GROUPS ||--o{ FEEDING_LOGS : eats
    FEEDING_LOGS ||--o{ FEEDING_LOG_LINES : uses
    ITEMS ||--o{ FEEDING_LOG_LINES : consumed
    FEEDING_LOG_LINES ||--o| STOCK_MOVEMENTS : "deducts"
    STOCK_COUNTS ||--o{ STOCK_COUNT_LINES : checks

    ITEM_CATEGORIES { uuid id PK
        uuid farm_id FK
        text name
        text kind }
    ITEMS { uuid id PK
        uuid farm_id FK
        uuid category_id FK
        text name
        text sku
        text base_unit
        numeric reorder_level
        bool tracks_expiry }
    FEED_ITEMS { uuid item_id PK
        numeric dm_pct
        numeric cp_pct
        numeric me_mj_kg }
    LOCATIONS { uuid id PK
        uuid farm_id FK
        text name }
    ITEM_BATCHES { uuid id PK
        uuid farm_id FK
        uuid item_id FK
        uuid location_id FK
        text lot_no
        date expires_on
        numeric unit_cost
        numeric qty_on_hand }
    STOCK_MOVEMENTS { uuid id PK
        uuid farm_id FK
        uuid batch_id FK
        text kind
        numeric qty_delta
        text cause_type
        uuid cause_id
        timestamptz at }
    SUPPLIERS { uuid id PK
        uuid farm_id FK
        text name
        text phone
        numeric balance }
    PURCHASE_ORDERS { uuid id PK
        uuid farm_id FK
        uuid supplier_id FK
        text status
        numeric total }
    PURCHASE_LINES { uuid id PK
        uuid po_id FK
        uuid item_id FK
        numeric qty
        numeric unit_price }
    GOODS_RECEIPTS { uuid id PK
        uuid po_id FK
        date received_on }
    RATIONS { uuid id PK
        uuid farm_id FK
        uuid group_id FK
        date effective_from
        text name }
    RATION_LINES { uuid id PK
        uuid ration_id FK
        uuid item_id FK
        numeric qty_per_head_kg }
    FEEDING_LOGS { uuid id PK
        uuid farm_id FK
        uuid group_id FK
        date fed_on
        int head_count
        numeric leftover_kg }
    FEEDING_LOG_LINES { uuid id PK
        uuid log_id FK
        uuid item_id FK
        numeric qty_kg
        numeric cost }
    STOCK_COUNTS { uuid id PK
        uuid farm_id FK
        uuid location_id FK
        date counted_on }
    STOCK_COUNT_LINES { uuid id PK
        uuid count_id FK
        uuid batch_id FK
        numeric counted_qty
        numeric system_qty }
```

Notes
- `stock_movements` is append-only; `item_batches.qty_on_hand` is a cached sum updated in the same transaction (CHECK >= 0 unless farm setting allows negative).
- Costing uses FEFO issue order with batch `unit_cost` (weighted-average option per farm).
- `treatments.item_id` and `vaccinations.item_id` deduct stock through `stock_movements` with `cause_type`/`cause_id`.

## 7. Finance

```mermaid
erDiagram
    FARMS ||--o{ ACCOUNTS : "wallets and banks"
    FARMS ||--o{ TXN_CATEGORIES : classifies
    ACCOUNTS ||--o{ TRANSACTIONS : posts
    TXN_CATEGORIES ||--o{ TRANSACTIONS : tags
    TRANSACTIONS ||--o{ TRANSACTION_ALLOCATIONS : "allocated to"
    CUSTOMERS ||--o{ INVOICES : billed
    INVOICES ||--o{ INVOICE_LINES : contains
    INVOICES ||--o{ PAYMENT_ALLOCATIONS : "paid by"
    PAYMENTS ||--o{ PAYMENT_ALLOCATIONS : applies
    SUPPLIERS ||--o{ BILLS : sends
    BILLS ||--o{ BILL_LINES : contains
    ALLOCATION_RUNS ||--o{ ANIMAL_COST_LEDGER : produces
    ANIMALS ||--o{ ANIMAL_COST_LEDGER : bears
    FARMS ||--o{ BUDGETS : plans
    BUDGETS ||--o{ BUDGET_LINES : has

    ACCOUNTS { uuid id PK
        uuid farm_id FK
        text name
        text kind
        numeric opening_balance }
    TXN_CATEGORIES { uuid id PK
        uuid farm_id FK
        text name
        text type
        uuid parent_id FK }
    TRANSACTIONS { uuid id PK
        uuid farm_id FK
        uuid account_id FK
        uuid category_id FK
        text type
        numeric amount
        date txn_date
        text source_type
        uuid source_id
        uuid file_id FK }
    TRANSACTION_ALLOCATIONS { uuid id PK
        uuid transaction_id FK
        text target_type
        uuid target_id
        numeric amount }
    INVOICES { uuid id PK
        uuid farm_id FK
        uuid customer_id FK
        text number
        date issued_on
        date due_on
        numeric total
        numeric paid
        text status }
    INVOICE_LINES { uuid id PK
        uuid invoice_id FK
        text description
        numeric qty
        numeric unit_price
        uuid source_sale_id FK }
    PAYMENT_ALLOCATIONS { uuid id PK
        uuid payment_id FK
        uuid invoice_id FK
        numeric amount }
    BILLS { uuid id PK
        uuid farm_id FK
        uuid supplier_id FK
        numeric total
        text status }
    BILL_LINES { uuid id PK
        uuid bill_id FK
        text description
        numeric amount }
    ALLOCATION_RUNS { uuid id PK
        uuid farm_id FK
        date period_start
        date period_end
        jsonb drivers
        text status }
    ANIMAL_COST_LEDGER { uuid id PK
        uuid farm_id FK
        uuid animal_id FK
        uuid run_id FK
        date cost_date
        text cost_type
        numeric amount }
    BUDGETS { uuid id PK
        uuid farm_id FK
        int fiscal_year }
    BUDGET_LINES { uuid id PK
        uuid budget_id FK
        uuid category_id FK
        int month
        numeric amount }
```

Notes
- Simple farm-friendly model (cash-basis transactions plus receivables/payables) with an optional accountant view; no free-form journal editing in v1. Totals reconcile with `customer_ledger` and `bills`.
- Invoices are immutable once issued; corrections use credit notes (status `void` + new invoice).
- `animal_cost_ledger` rows are generated per period by an `allocation_run` and are replaceable (delete+insert in one transaction per run) so re-running allocation is safe.

## 8. People and tasks

```mermaid
erDiagram
    STAFF ||--o{ ATTENDANCE : logs
    STAFF ||--o{ SALARY_STRUCTURES : earns
    STAFF ||--o{ ADVANCES : takes
    PAYROLL_RUNS ||--o{ PAYSLIPS : generates
    STAFF ||--o{ PAYSLIPS : receives
    TASK_TEMPLATES ||--o{ TASKS : instantiates
    STAFF ||--o{ TASKS : assigned
    TASKS ||--o{ TASK_COMPLETIONS : done
    ALERT_RULES ||--o{ ALERTS : triggers
    ANIMALS ||--o{ ALERTS : about
    ALERTS ||--o| TASKS : "converted to"
    FARMS ||--o{ FARM_HEALTH_SCORES : scored
    FARMS ||--o{ DAILY_FARM_SUMMARIES : summarized
    FARMS ||--o{ MESSAGE_LOG : sends
    CUSTOMERS ||--o{ MESSAGE_LOG : receives

    STAFF { uuid id PK
        uuid farm_id FK
        text name
        text phone
        text job_title
        date joined_on
        text status }
    ATTENDANCE { uuid id PK
        uuid farm_id FK
        uuid staff_id FK
        date work_date
        timestamptz check_in
        timestamptz check_out
        text status }
    SALARY_STRUCTURES { uuid id PK
        uuid staff_id FK
        numeric base
        jsonb components
        date effective_from }
    ADVANCES { uuid id PK
        uuid staff_id FK
        numeric amount
        numeric recovered }
    PAYROLL_RUNS { uuid id PK
        uuid farm_id FK
        date period_start
        date period_end
        text status }
    PAYSLIPS { uuid id PK
        uuid run_id FK
        uuid staff_id FK
        numeric gross
        numeric deductions
        numeric net }
    TASK_TEMPLATES { uuid id PK
        uuid farm_id FK
        text title
        text recurrence }
    TASKS { uuid id PK
        uuid farm_id FK
        uuid template_id FK
        uuid assignee_staff_id FK
        text title
        date due_on
        text status
        text source_type
        uuid source_id
        uuid animal_id FK }
    TASK_COMPLETIONS { uuid id PK
        uuid task_id FK
        timestamptz done_at
        uuid file_id FK
        text note }
    ALERT_RULES { uuid id PK
        uuid farm_id FK
        text rule_key
        jsonb params
        bool enabled }
    ALERTS { uuid id PK
        uuid farm_id FK
        uuid rule_id FK
        uuid animal_id FK
        text severity
        text status
        text dedupe_key UK
        timestamptz raised_at }
    FARM_HEALTH_SCORES { uuid id PK
        uuid farm_id FK
        date score_date
        int score
        jsonb factors }
    DAILY_FARM_SUMMARIES { uuid id PK
        uuid farm_id FK
        date summary_date
        jsonb metrics }
    MESSAGE_LOG { uuid id PK
        uuid farm_id FK
        text channel
        text template
        text status
        text provider_ref }
```

## 9. Rollups (read models)

Maintained by worker; never written by API request paths.

| Table / view | Grain | Used by |
|---|---|---|
| `mv_milk_daily` | farm, date, session, group | dashboards, trends |
| `mv_animal_lactation` | animal, lactation_no | lactation curves, 305-day projection |
| `mv_herd_snapshot_daily` | farm, date, status | herd composition trend |
| `mv_repro_kpis_monthly` | farm, month | reproduction dashboard |
| `mv_cost_per_litre_daily` | farm, date, group | cost per liter |
| `mv_receivables_aging` | farm, customer | finance dashboard |
| `animal_profit_monthly` | animal, month | profit-per-animal ranking |

## 10. Index plan (initial; verified with EXPLAIN on seeded data)

| Table | Index | Serves |
|---|---|---|
| animals | `(farm_id, status, group_id)`, partial unique `(farm_id, tag_number)`, trigram GIN on `name, tag_number`, `(farm_id, dam_id)`, `(farm_id, sire_id)` | lists, search, pedigree |
| milk_records | PK; `(farm_id, record_date, session_id)`, `(farm_id, animal_id, record_date desc)`, partial unique dedupe key, BRIN `(record_date)`, `(farm_id, server_seq)` | daily entry, per-animal curve, sync pull |
| milk_holds | partial `(farm_id, animal_id) WHERE released_at IS NULL`, `(farm_id, ends_on)` | active hold lookup on every milk write |
| customer_ledger | `(farm_id, customer_id, entry_date, id)` | statements |
| stock_movements | `(farm_id, batch_id, at)`, `(farm_id, cause_type, cause_id)` | stock history, traceability |
| item_batches | `(farm_id, item_id, expires_on)` partial `qty_on_hand > 0` | FEFO issue |
| transactions | `(farm_id, txn_date, category_id)`, `(farm_id, account_id, txn_date)` | P&L, cash book |
| tasks | `(farm_id, assignee_staff_id, status, due_on)` | my tasks |
| alerts | unique `dedupe_key`, `(farm_id, status, severity, raised_at desc)` | alert inbox, idempotent jobs |
| audit_log | BRIN `(at)`, `(farm_id, entity, entity_id, at desc)` | history view |
| all offline tables | `(farm_id, server_seq)` | sync pull |

Rules: every FK column is indexed; no index without a named query; review unused indexes quarterly via `pg_stat_user_indexes`.

## 11. Partitioning and retention

- Range-partition by month: `milk_records`, `feeding_log_lines`, `audit_log`, `message_log`, `stock_movements`, `customer_ledger`. A worker job pre-creates partitions 3 months ahead.
- Retention: business data kept for the life of the account; `message_log` 13 months, `audit_log` 7 years (archived to cold storage after 24 months), refresh tokens purged on expiry.
- Farm deletion: 90-day grace, then cascaded purge job with a verification report.
