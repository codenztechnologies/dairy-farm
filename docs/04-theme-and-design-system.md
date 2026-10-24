# Theme and Design System

Token file: [packages/theme/tokens.css](../packages/theme/tokens.css). Every visual value comes from it. Changing the look of web and mobile means editing that one file.

**Design language reference: the mockups in [`mockups/`](../mockups/).** They define the *type* of design we follow: the shell (sidebar, top bar), cards and KPI tiles, chips, tables, forms, charts, colour, type and spacing. They are not a screen-by-screen spec. Every screen is designed by us from our own features and data in this same language; the five mockups are the closest guide for dashboard, animals list, add-animal form, report and settings screens. Where a mockup conflicts with accessibility, performance, RTL or the rules below, the deviation is listed in section 10.

| Mockup file | Screen |
|---|---|
| `DairyPro Farm Management Dashboard.png` | Dashboard |
| `DairyPro Animal Management Dashboard.png` | Animals list |
| `DairyPro Animal Entry Dashboard.png` | Add animal form |
| `DairyPro Milk Production Dashboard.png` | Milk production report |
| `DairyPro Farm Settings Dashboard.png` | Settings |

This replaces the earlier "earthy editorial" direction (cream paper, serif display, terracotta). See ADR-018 in docs/15.

## 1. Design intent

Clean, bright and calm: cool off-white canvas, white cards with thin borders, one confident emerald for actions and positive data, sky blue for milk and information, and small pastel tiles to give each metric an identity. Dense where it needs to be (tables, reports), generous elsewhere.

Principles
1. **Today first.** Dashboard opens on a greeting, the date, key numbers and what needs doing now.
2. **One obvious primary action per screen** (a single solid green button, top right). Everything else is quieter (white/outlined).
3. **Numbers lead.** KPI cards put the number first, a delta (arrow + percent + comparison text) second, and a sparkline third.
4. **Say it in words.** Status is a chip with text (and icon), never colour alone. Arrows accompany every up/down delta.
5. **Readable first.** Small text is for secondary information only (see typography).
6. **No decoration without meaning.** No gradients, no glass, no stock illustration noise; pastel tiles and thin borders carry the style.

## 2. How the token system works

```
Primitives  (--p-emerald-600, --p-slate-50 ...)  raw palette, never used by components
    v
Semantic    (--color-primary, --color-surface ...) meaning-based, what components use
    v
Component   (declared inside each component)       e.g. --button-bg: var(--color-primary)
```

- Re-brand: change primitives (or re-point semantic tokens). No component edits.
- Dark mode: `[data-theme="dark"]` re-maps semantics only.
- Urdu/RTL: `lang="ur"` / `dir="rtl"` swaps fonts and line-height tokens; components use logical properties (`margin-inline-start`, `padding-block`, `inset-inline-end`), never `left/right`.
- Tailwind v4: tokens are exposed via `@theme`, so `bg-surface`, `text-muted`, `rounded-lg` resolve to tokens. Raw hex, arbitrary radii or colours in class names are blocked by lint and a CI grep.
- React Native: `tokens.native.ts` is generated from `tokens.css` at build, so mobile stays in sync.
- Brand name, logo and app icon live in `packages/theme/brand.ts` (the mockups say "DairyPro"; the real name is still a codename decision, see docs/16 O4).

## 3. Colour

Values below are the light theme; dark values are in the token file.

| Role | Token | Value | Use |
|---|---|---|---|
| Page background | `--color-bg` | slate-50 `#F7F9FD` | canvas behind cards |
| Surface | `--color-surface` | `#FFFFFF` | cards, sidebar, header, tables |
| Text | `--color-text` | slate-900 `#0F172A` | headings, body |
| Muted text | `--color-text-muted` | `#526071` | labels, secondary |
| Subtle text | `--color-text-subtle` | `#5F6F85` | hints, captions (>= 4.5:1) |
| Border | `--color-border` | `#E2E8F0` | card and table lines |
| Input border | `--color-border-input` | `#7D8CA1` | form control edges (>= 3:1) |
| Primary | `--color-primary` | emerald-600 `#017D54` | primary button, active states, positive |
| Brand green (decorative) | `--p-emerald-500` | `#018F5E` | logo, rings, large fills where text is not on top |
| Nav active | `--color-nav-active-bg/-text` | `#E1F6EF` / `#016646` | selected sidebar item |
| Accent / info | `--color-accent`, `--color-info` | sky `#1A6FD0` / `#1565C0` | links, milk, informational |
| Success | `--color-success` | emerald-600 | confirmations, positive deltas |
| Warning | `--color-warning` | amber-700 `#9A5906` | dry, due soon, withdrawal |
| Danger | `--color-danger` | rose-600 `#C2253A` | errors, critical alerts, negative deltas, destructive |

Status chips (always text + icon): lactating = green, dry = amber, pregnant = violet, calf = blue, sick = red, inactive = grey; tokens `--color-status-*` and `--color-status-*-soft`.

KPI icon tiles: six tint pairs `--tint-{green,blue,amber,violet,rose,slate}-bg/-fg` (a soft square with a coloured icon), matching the mockup cards (milk = blue, cash = green, animals = amber, tasks = violet, health alerts = rose, events = blue).

Rules
- Body text on any surface >= 4.5:1; UI component boundaries, focus rings and chart series >= 3:1. Enforced: `packages/theme/scripts/check-contrast.mjs` resolves both themes and fails CI below minimum. Last run: all pairs pass.
- Disabled controls are exempt from contrast but must not carry unique information.
- Green and red deltas always include an arrow and a number.
- Dark mode is designed, not inverted: bright primary on deep navy, tinted translucent soft backgrounds.

## 4. Charts

Library: Apache ECharts via the shared `<Chart>` wrapper, which applies the tokens.

- Meaning is fixed app-wide: **milk = blue** (`--chart-1`), **income, totals, positive = green** (`--chart-2`), **cost = amber** (`--chart-3`), violet / rose / slate for further series.
- Milking sessions use one blue in three steps (`--chart-session-morning`, `-noon`, `-evening`); stacked order is always morning at the bottom.
- Each series also has a line dash (`--chart-dash-n`), marker (`--chart-marker-n`) and bar/area pattern (`--chart-pattern-n`). The wrapper applies patterns to stacked and grouped bars, dashes and markers to lines, so charts survive colour-blindness and greyscale print.
- Patterns:
  - **Donut with centre total** (herd composition, milk sales): legend list to the right with value and percent; slices keep stroke gaps.
  - **Combo bars + line on dual axes** (milk production: total litres bars, per-animal line).
  - **Grouped bars** (income vs expenses by week).
  - **Sparklines** inside KPI cards (no axes, no tooltip clutter; end-point dot).
  - **Ring gauge** for the Farm Health Score.
- Always: data labels on small bar charts (as in the mockup's daily bars), tooltips with units, legend near the chart, visible empty/loading/error states, "view as table" and CSV export, `prefers-reduced-motion` disables entrance animation, > 1,000 points aggregate or sample.
- Pie/donut only for <= 5 categories (the mockup's "Others" bucket keeps it at 5).

## 5. Typography

| Token | Latin | Urdu |
|---|---|---|
| Display and body | **Inter** (variable, self-hosted) | **Noto Naskh Arabic** (self-hosted, subset) |
| Mono (IDs, codes) | JetBrains Mono | same |

Nastaliq is not used in the UI: Naskh is more legible at small sizes and in dense tables. Nastaliq can return later for decorative headings via `--font-urdu-display`.

- Scale: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48 px (`--text-xs ... --text-5xl`).
- Page title 30-36 px bold with a 14-16 px muted subtitle; greeting on the dashboard is the largest text. KPI numbers 24-30 px semibold. Card titles 16-18 px semibold.
- Body 16 px on mobile and forms. **Dense desktop tables and report cells may use 14 px; 12 px is for captions and delta footnotes only, never for the only copy of important information.**
- Tabular numerals on all numbers, tables, KPIs and money.
- Urdu line-height 2.0 via tokens; numerals Latin by default, Indic optional.
- Fonts are self-hosted WOFF2 with `font-display: swap`.

## 6. Shape, spacing, elevation, motion

- 4 px grid. Page gutter 24-32 px desktop, 16 px mobile; cards 16-24 px padding; 16-24 px gaps between cards.
- Radii: 8 px controls and buttons, 10 px inputs and chips, 14 px cards, 20 px hero surfaces, full for avatars/pills.
- Elevation: cards are white with a 1 px `--color-border` and `--shadow-xs/sm`; only floating layers (menus, dialogs, sheets, toasts) get `--shadow-md/lg`.
- Motion: 140-220 ms for feedback, 360 ms for large transitions; ease-out (`--ease-emphasized`, no overshoot); numbers may count up once on load; reduced-motion collapses all durations.

## 7. Layout system (from the mockups; screens without a mockup reuse these patterns)

**How we design a new screen:** pick the closest pattern below (dashboard cards, list + filter bar + table, numbered-section form with preview panel, report with filters + summary cards + chart + tables, settings with sub-navigation), assemble it only from components in section 8, use only tokens, and include all states (loading, empty, error, success, offline) plus mobile, RTL and dark variants.

**Desktop shell**
- Left sidebar (`--sidebar-width` 13 rem, white, 1 px border): logo + farm app name with chevron; items with icon + label; active item = emerald-tinted pill; **Settings** and **Help & Support** pinned to the bottom. Collapsible to icons.
- Top bar (`--header-height`): **farm switcher** (icon + name + chevron), wide **global search** ("Search animals, milk records, customers, tasks..." with `Ctrl K` hint), **notification bell with count badge**, **language switcher** (globe + EN/UR), **user menu** (avatar initials, name, role).
- Content: page header (breadcrumb on inner pages, H1, subtitle, primary and secondary actions right-aligned), then cards on a 12-column grid.

**Sidebar items (in order):** Dashboard, Animals, Milk, Breeding, Health, Feed, Money, People, Stock, Reports (expands to Milk Production, Animal Performance, Breeding, Health, Feed & Nutrition, Financial, Custom Reports), then Settings, Help & Support. Items a role cannot access are hidden.

**Dashboard** (top to bottom): greeting + date + weather chip + Farm Health Score card (ring, label, "this month" delta) -> six KPI cards (Today's Milk, Cash Position, Total Animals, Due Tasks, Health Alerts, Upcoming Events) -> Milk Production chart (7/30-day selector) + Herd Composition donut + Key Metrics (4 mini cards: average yield, feed cost per litre, cost per litre, profit per litre) -> Today's Tasks list + Recent Alerts list + Top Performing Animals table -> Milk Sales donut (by customer) + Income vs Expenses bars + Upcoming Events (date tiles). Every card has a "View all" link.

**Animals list:** title + subtitle, Import / Export / **Add Animal**; five stat cards (Total, Lactating, Dry, Pregnant, Calves, Others with percent); filter bar (search by tag/name/RFID, Status, Group, Breed, Lactation, More Filters, Clear All); table with select column, avatar icon, tag as blue link, name, breed, group chip, status chip, lactation number, days in milk, milk yield, last calving, **Next Event** chip with countdown (AI due, heat watch, dry-off, pregnancy check, expected calving, weaning), row menu; footer "Showing 1 to 10 of N", numbered pager, rows-per-page.

**Add animal form:** breadcrumb, title, Cancel / **Save Animal**; left column of numbered section cards (1 Basic Information, 2 Current Status, 3 Parentage (optional), 4 Additional Information (optional)); right column: **Animal Photo** upload (dashed dropzone + 4 thumbnails), live **Preview Summary**, and a contextual **Tip**. Required fields marked with a red asterisk; tag field has a QR/scan button; sire/dam are searchable pickers.

**Reports (milk production example):** filter bar (date range, group/pen, breed, lactation stage, More Filters) -> six summary cards -> combo chart (stacked sessions + total line, Daily/Weekly toggle) -> group-wise production table (with totals row) + top-producing animals table; Export and **Print Report** actions.

**Settings:** left sub-navigation of cards (Farm Settings, Users & Roles, Subscription & Billing, Units & Measurements, Notifications, Integrations, Data Import & Export, Security, System Preferences), right side grouped form cards (Farm Information, Farm Configuration, Preferences) with a sticky **Save Changes** button; fields show units and helper text ("days before", "days after last heat").

**Tablet:** sidebar collapses to icons, cards reflow to 2 columns.
**Mobile (not in the mockups, derived):** bottom tabs (Dashboard, Animals, Milk, Tasks, More), top bar reduced to farm switcher + bell + avatar, search as an icon opening a full-screen search, KPI cards as a horizontally snapping row, tables become stacked cards, forms single column with sticky bottom Save, large numeric keypad for litre entry, persistent scan button and sync status pill. See section 10 for the mockups still needed.

Breakpoints 640 / 768 / 1024 / 1280; density toggle for tables (comfortable 56 px rows, compact 40 px).

## 8. Component inventory (packages/ui, built on Radix primitives)

Foundations: Button (primary solid green, secondary white outlined, ghost, danger, loading), IconButton, Link, Badge, **StatusChip** (pastel pill + icon + text), **NextEventChip** (icon + label + "5 days"), Avatar (initials), Tooltip, Popover, DropdownMenu, Tabs, Accordion, Dialog, Sheet, AlertDialog, Toast, Banner, Progress, **Stepper / numbered section header**.

Shell: Sidebar (+ collapsed, + mobile drawer), TopBar, FarmSwitcher, GlobalSearch (Ctrl K command palette), NotificationBell, LanguageSwitcher, UserMenu, PageHeader (breadcrumb, title, subtitle, actions), SettingsNav.

Forms: Field (label, required asterisk, optional marker, helper, error), TextInput (with suffix/prefix unit, scan button), NumberInput, PhoneInput, MoneyInput, Select, Combobox (async animal picker), MultiSelect, DatePicker, TimePicker, RadioPills (Female / Male / Unknown), Checkbox, Switch, Textarea with counter (0/500), FileUpload + thumbnails, FormSummary, `useForm` kit (TanStack Form + Zod), PreviewSummary panel, TipCard.

Data: **KpiCard** (icon tile, label, value, delta, comparison text, sparkline), **StatCard** (icon, label, value, percent), DataTable (select, sort, filter bar, saved views, row menu, pagination, density, export, sticky header, virtualization), MiniTable (top-N lists), **DonutCard** (centre total + legend list), **ListCard** (tasks, alerts, events with icon tile, title, subtitle, time/status), DateTile (month/day), HealthScoreRing, Timeline, PedigreeTree, Calendar.

Charts: wrapper over ECharts (see section 4).

State components (mandatory on every data screen): Skeleton variants (KPI card, table, chart, form, list), EmptyState, FilteredEmptyState, ErrorState (message, retry, request id), OfflineBanner, SyncStatus pill, NoPermission, NotFound, Maintenance.

Domain: AnimalCard, AnimalPicker (tag/name/QR), QuickEntry sheet, MilkEntryGrid, WithdrawalBadge, AlertCard, TaskCard, LedgerStatement, InvoicePreview, QrScanner, TagLabelSheet.

Icons: one outline set (Lucide) at 1.75 px stroke plus ~20 custom farm icons (cow, buffalo, calf, udder, syringe, feed bag, tank) drawn to match; no emoji.

## 9. Voice and copy

- Greeting uses the user's name and time of day; subtitle states the farm ("Here's what's happening at <Farm> today.").
- Plain farm language, short sentences; define unavoidable terms (SCC, SNF, BCS) in a tooltip.
- Buttons say what happens ("Save Animal", "Print Report").
- Errors say what happened and what to do; success names the object and the number ("Recorded 12.5 L for Cow #087 (morning)").
- Empty states invite an action.

## 10. Deviations from the mockups (and why)

| Mockup | Our implementation | Reason |
|---|---|---|
| Green button `#018F5E` with white text (4.12:1) | Button fill `#017D54` (5.17:1); `#018F5E` kept for decorative uses | WCAG 4.5:1 for button text |
| Very light input borders | `--color-border-input` `#7D8CA1` (3.25:1) on inputs; cards keep the light border | WCAG 3:1 for control boundaries |
| Light blue "Morning" bars (1.7:1 on white) | Morning `#3D97F0`, noon `#1565C0`, evening `#0F4D96` + patterns | Chart elements >= 3:1, readable in greyscale |
| Amber "Pending", orange due-date text, grey captions | Text uses amber-700 / slate-600 tokens | Tinted chip text >= 4.5:1 |
| Delta colour with arrow only for green/red | Arrow + number + comparison text kept; plus accessible label | Not colour alone (already arrow-based; kept) |
| 12-14 px text widely used | 14 px for dense desktop tables; 16 px mobile and forms; 12 px captions only | Readability in sheds, accessibility |
| Charts without patterns | Pattern/dash/marker tokens added | Colour-blind safe |
| "DairyPro" name and logo | Placeholder in `brand.ts` | Final brand undecided (docs/16 O4) |
| Desktop only, English only | Mobile, tablet, dark mode and Urdu/RTL derived from the same tokens | Product requirements |

No further mockups are required. Screens without one (mobile, tablet, Urdu/RTL, dark mode, empty/loading/error states, ledger and invoice, health, breeding, feed, stock, login, onboarding) are designed by us in the same language. We build each as a real screen, review it in the browser with you, and adjust.

## 11. Theme governance

- Visual regression tests (Storybook + Playwright screenshots) in light, dark, LTR and RTL for every component and key screen. The mockups are compared by eye for style fit, not pixel-matched.
- Token lint: CI fails on hex colours, `rgb(`, hard-coded `px` radius/shadow, or font-family outside `packages/theme`.
- `check-contrast.mjs` in CI over the semantic pairs for both themes (translucent dark soft backgrounds are reviewed visually in Storybook). Any new text, border, tint or chart token must be added to its pair list.
- A "Theme preview" page in Storybook shows every token.
- Adding a token requires a dark value and a documented purpose here.
