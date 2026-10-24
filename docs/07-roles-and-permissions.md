# Roles and Permissions

Permissions are strings `module.resource.action` (lowercase, dot-separated), defined once in `packages/contracts/permissions.ts` and seeded into `permissions`. The API checks them per route; the UI hides what the user cannot do. Owners can clone any system role into a custom role and toggle permissions.

## 1. Actions

`view`, `create`, `update`, `delete` (soft), `export`, plus special actions named per resource (`void`, `approve`, `release`, `override`, `manage`).

## 2. Permission catalog (by module)

| Module | Permissions |
|---|---|
| farm | `farm.settings.view`, `farm.settings.update`, `farm.users.manage`, `farm.roles.manage`, `farm.devices.manage`, `farm.audit.view`, `farm.data.export`, `farm.data.import`, `farm.billing.view` |
| animals | `animals.animal.view`, `.create`, `.update`, `.delete`, `.export`, `animals.group.manage`, `animals.passport.manage`, `animals.disposal.create` |
| milk | `milk.record.view`, `.create`, `.update`, `.delete`, `milk.quality.create`, `milk.batch.manage`, `milk.discard.create`, `milk.hold.override`, `milk.customer.view`, `.manage`, `milk.pricelist.manage`, `milk.sale.view`, `.create`, `.void`, `milk.ledger.view` |
| breeding | `breeding.event.view`, `.create`, `.update`, `.delete`, `breeding.semen.manage`, `breeding.kpi.view` |
| health | `health.event.view`, `.create`, `.update`, `.delete`, `health.treatment.create`, `health.vaccination.manage`, `health.vaccination.record`, `health.vet.manage` |
| feed | `feed.item.manage`, `feed.ration.view`, `.manage`, `feed.log.view`, `.create`, `.update` |
| inventory | `inventory.item.view`, `.manage`, `inventory.movement.create`, `inventory.count.manage`, `inventory.purchase.view`, `.manage`, `inventory.supplier.manage` |
| finance | `finance.transaction.view`, `.create`, `.update`, `.delete`, `finance.invoice.view`, `.create`, `.void`, `finance.payment.create`, `finance.report.view`, `finance.cost.view`, `finance.cost.run`, `finance.budget.manage`, `finance.account.manage` |
| people | `people.staff.view`, `.manage`, `people.attendance.view`, `.record`, `.manage`, `people.payroll.view`, `.run`, `people.advance.manage` |
| tasks | `tasks.task.view_own`, `tasks.task.view_all`, `.create`, `.assign`, `.complete`, `tasks.template.manage` |
| insights | `insights.dashboard.view`, `insights.alerts.view`, `.manage`, `insights.healthscore.view`, `insights.reports.view`, `.export` |
| messaging | `messaging.whatsapp.send`, `messaging.templates.manage` |

Sensitive set (audited with reason, may need re-authentication): `farm.data.export`, `farm.roles.manage`, `finance.invoice.void`, `milk.hold.override`, `people.payroll.run`, `milk.sale.void`, `farm.users.manage`.

## 3. System role matrix

Legend: **F** full module, **R** read-only, **E** enter/record, **-** none, plus notes.

| Module | Owner | Manager | Vet | Accountant | Supervisor | Worker | Driver (P2) | Read-only |
|---|---|---|---|---|---|---|---|---|
| Farm settings / users / roles | F | R (no roles) | - | - | - | - | - | R settings |
| Audit log / data export | F | R audit | - | export finance | - | - | - | - |
| Animals | F | F | R + health fields | R | R, group moves | R (assigned groups), notes | - | R |
| Milk records | F | F | R | R | F (own groups) | E (own groups) | - | R |
| Milk hold override | F | F | - | - | - | - | - | - |
| Customers / price lists / sales | F | F | - | F | R | - | R own route | R |
| Breeding | F | F | F | R | E (heat obs.) | E (heat obs.) | - | R |
| Health / vaccination | F | F | F | R | E | E (observations) | - | R |
| Feed / rations / logs | F | F | R + ration advice | R cost | E logs | E logs | - | R |
| Inventory / purchasing | F | F | Medicine items R, issue | F | R, issue | issue (limited) | - | R |
| Finance (transactions, invoices) | F | R | - | F | - | - | - | R |
| Cost & profit reports | F | R | - | F | - | - | - | R |
| People / payroll | F | R staff, attendance | - | payroll view/run | attendance record | own attendance | own attendance | - |
| Tasks | F | F | own + assign vet tasks | own | assign to workers | own | own | R |
| Insights / dashboards | F | F | health dashboards | finance dashboards | group dashboards | "Today" only | route | R |
| Messaging | F | send | - | send invoices | - | - | - | - |

Role rules
- At least one Owner per farm; the last Owner cannot be removed or demoted.
- Custom roles cannot hold permissions the creator does not have.
- Row scope on a membership (`scope.group_ids`, `scope.route_ids`) limits Supervisor/Worker data to assigned groups.
- A "Simple mode" view is automatic for Worker: only Today (tasks, milking list, feeding checklist) and quick-add.
- Platform roles (Super Admin, Support) are separate from farm roles: Support is read-only impersonation, time-boxed, audited, requires a ticket reference.

## 4. Enforcement checklist

- Route decorator `@Requires('milk.record.create')`; default is deny; unauthenticated routes are explicitly whitelisted.
- Permissions cached per session in Redis, invalidated on role change.
- UI uses `can('...')` helper from the same catalog; no role-name checks in code.
- Tests: for each permission, an allowed and a denied case; matrix above is the test table.
