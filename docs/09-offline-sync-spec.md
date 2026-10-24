# Offline Sync Specification (Mobile)

Principle: the phone is a cache plus an outbox. The server is the authority. Offline entry must never lose data and must never silently corrupt it.

## 1. Scope

| Offline write | Offline read (cached) | Online only |
|---|---|---|
| milk records and quality tests, health events and treatments, vaccination records, feeding logs, task completions, attendance, animal notes/photos, heat observations | animals, groups, customers (names, balance snapshot), feed items, rations, tasks, drugs, species templates, today's schedule | finance, invoices, payroll, user/role management, reports, exports, settings |

## 2. Local storage

- SQLite with encryption (SQLCipher or OS-protected file); library chosen in spike S1 (WatermelonDB vs op-sqlite + thin layer). Requirement: transactional writes, observable queries, migrations, reasonable performance with 20k animals/100k milk rows.
- Tables mirror server rows for synced entities plus: `outbox` (pending operations), `sync_state` (per-entity-group cursor), `conflicts`, `attachments_queue`.
- Local schema versioned; migrations run on app start; incompatible versions force re-sync (never data loss of outbox: outbox exported before reset).

## 3. Identifiers and ordering

- Client generates UUIDv7 ids for new rows and an `op_id` (UUIDv7) per operation. Server treats `op_id` as idempotency key.
- Each op carries `client_created_at` (device time), `device_id`, `base_version` (row version when edited) and `schema_version`.
- Server assigns `server_seq` (bigint identity) per row change; clients pull by `server_seq`.

## 4. Protocol

### Push: `POST /v1/sync/push`
Request: `{ deviceId, schemaVersion, ops: [{ opId, entity, action: create|update|delete, id, baseVersion?, payload, clientCreatedAt }] }` (max 200 ops, ordered).
Response per op: `{ opId, status: applied|duplicate|rejected|needs_review, serverVersion?, error?: {code, message, field?} }`.

- Applied in one transaction per op (not per batch) so one bad op does not block others; dependency order is preserved (parent before child) and a child whose parent was rejected is rejected with `PARENT_REJECTED`.
- Duplicate `opId` returns the original result (idempotent).
- Validation uses the same Zod contracts and domain rules as online APIs.

### Pull: `GET /v1/sync/pull?group=<animals|milk|health|...>&since=<server_seq>&limit=500`
Returns changes (including tombstones) with `nextSince` and `hasMore`. Reference data groups support ETag. First sync does a bounded bootstrap (latest 90 days of milk, active animals, open tasks; older history fetched on demand online).

### Attachments
Photos compressed on device (max 1600 px, JPEG ~80%), queued, uploaded via signed URL with resume; row references `file_id` once uploaded; UI shows pending state.

### Triggers
App foreground, connectivity regained, after each local write (debounced 3 s), periodic background (15 min, OS permitting), pull-to-refresh, manual "Sync now".

## 5. Conflict policy

| Case | Resolution |
|---|---|
| Append-only events (milk, health, feeding, attendance) | No conflict; duplicates detected by natural key |
| Same natural key twice (animal+date+session) | Second becomes `needs_review`; manager merges or discards; litres never silently overwritten |
| Update vs update on mutable row (animal profile, task) | Field-level merge using `baseVersion`: non-overlapping fields merge; overlapping field: server wins unless the newer `client_created_at` is from a role with higher authority; loser stored in `conflicts` and shown to the user |
| Update on deleted row | Rejected `ENTITY_DELETED`; user offered to restore or discard |
| Business rule violation discovered at sync (animal sold, hold active, permission revoked) | Accepted as `needs_review` when data is factual (e.g., milk was physically produced); rejected with reason when it would corrupt state (e.g., permission revoked) |
| Clock skew | Server compares device time with server time at each sync; if skew > 5 min, record is stored with a `skew_corrected_at` and business date derived from the corrected time; user warned |
| Stock effects (feeding/treatment) | Applied in order; negative stock yields `needs_review` with shortage flag |

## 6. UX requirements

- Persistent sync pill: Synced / Syncing / N pending / Offline / Needs attention.
- Local-first feedback: saving shows "Saved on this phone" with a subtle pending marker; flips to synced when the server applies.
- Needs-attention inbox lists rejected/needs_review ops with plain-language reasons and actions (Edit & retry, Discard, Ask manager).
- Never block data entry because of sync problems. Never show raw error codes (show message + code in details).
- Logout with pending ops warns and offers to sync first; if impossible, ops stay encrypted on device until the same account signs in.

## 7. Security

- Tokens in secure storage; refresh when online; if refresh token expired while offline, allow entry (local session) and require sign-in before push.
- Device revoked by owner => local data wiped on next contact; pending ops pushed once if the user re-authenticates before the wipe.
- Optional app lock (PIN/biometric).

## 8. Test matrix (must pass in CI harness)

1. Airplane-mode entries across app restarts, then sync: all applied once.
2. Two devices edit the same animal/field: merge per policy, conflict surfaced.
3. Duplicate milk record from two workers: one applied, one `needs_review`.
4. Interrupted push (kill app mid-request): retry is idempotent.
5. Server returns 500 for some ops: others applied, failed ones retried with backoff.
6. Token expired mid-sync: refresh then continue.
7. Clock skew +/- 1 day.
8. Parent rejected, child pending.
9. Pull with deletes/tombstones and `hasMore` pagination.
10. Schema upgrade with non-empty outbox.
11. 10k-op backlog sync performance and memory.
12. Role/permission revoked while offline.
