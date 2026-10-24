# Localization and Glossary

## 1. Approach

- Languages at launch: English (`en`), Urdu (`ur`, RTL). Architecture supports adding locales by adding a catalog; no code changes.
- Library: ICU MessageFormat via `i18next` + `i18next-icu` (web, mobile, API for server messages). One catalog per locale in `packages/i18n/locales/<locale>/<namespace>.json`, namespaces per module.
- Keys are semantic and stable: `milk.record.saved`, `errors.milk.withdrawal_active`. English is source; CI fails on missing keys, unused keys, or placeholder mismatches between locales.
- No concatenated sentences; pass variables. Plurals via ICU (Urdu has two plural forms: one, other).
- API errors return `code` plus localized `message` according to `Accept-Language`/user locale; clients may re-localize from `code`.
- User locale is stored per user; farm locale is the default for new users and for outbound messages to customers (customer-level language override).

## 2. Formatting (shared formatters in `packages/i18n`)

| Thing | Rule |
|---|---|
| Numbers | `Intl.NumberFormat`; Latin digits default; optional Urdu-Indic digits (user preference) |
| Currency | Farm currency (PKR default); symbol `Rs` in en, `روپے`/`Rs` in ur (setting); minor units per ISO 4217 |
| Dates | Gregorian; format by locale and farm preference (`DD/MM/YYYY` default for PK); optional Hijri secondary display; relative dates for recent items |
| Time | 12/24 h by user preference; farm timezone for business times |
| Units | From farm unit prefs via `domain/units`; label localized (`L`/`لیٹر`, `kg`/`کلو`) |
| Phone | libphonenumber; default region from farm country; stored E.164 |
| Names/addresses | Free text, no assumed first/last split; Urdu/English mixed text supported (bidi isolation with `<bdi>`) |

## 3. RTL rules

- `<html lang dir>` set from locale. Use Tailwind logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`).
- Icons that imply direction (back, next, progress, charts with time axis) mirror; icons that depict objects (cow, syringe) do not.
- Charts: legends, tooltips, and axis labels mirror; the time axis remains left-to-right for numerals-heavy reading unless the user prefers mirrored (setting; default: do not mirror time axes, mirror layout).
- Tables: column order mirrors; numeric columns keep digits LTR (`dir="ltr"` isolation) and align end.
- Mixed content (tag numbers, phone numbers, English drug names) wrapped in `<bdi>`/`unicode-bidi: isolate`.
- Fonts per tokens: Noto Naskh Arabic for all Urdu UI text (body and headings; Nastaliq is not used because it is hard to read in dense UI); line-height 2.0 for Urdu body.
- Every PR touching UI includes an RTL screenshot check (visual regression in CI).

## 4. Translation workflow

1. Developer adds English key and default text in the same change.
2. Machine draft allowed for review only; **Urdu strings must be reviewed by a native speaker with farm context** before release (pilot farm staff review in Phase 1D).
3. Glossary below is authoritative for terms; add terms here first.
4. Roman Urdu is not a UI language at launch (kept as roadmap item); the search index supports Roman Urdu transliteration for animal names later.
5. Messages sent via WhatsApp use approved templates per language.

## 5. Glossary (English / Urdu / Roman Urdu / meaning)

| English | Urdu | Roman Urdu | Notes |
|---|---|---|---|
| Animal | جانور | janwar | |
| Cow | گائے | gaye | cattle female |
| Buffalo | بھینس | bhains | |
| Bull | سانڈ | sand | breeding bull |
| Calf | بچھڑا / بچھڑی | bachhra / bachhri | male / female; UI uses "calf" with sex chip |
| Heifer | بچھیا | bachhia | young female before first calving |
| Lactating | دودھ دینے والی | doodh dene wali | |
| Dry (not milking) | خشک | khushk | dry period |
| Pregnant | گابھن | gabhan | |
| Heat (estrus) | گرمی میں آنا | garmi mein aana | |
| Insemination (AI) | مصنوعی تخم ریزی | masnoi tukhm rezi | |
| Calving | بچہ دینا | bacha dena | |
| Milk | دودھ | doodh | |
| Milking | دودھ دوہنا | doodh duhna | |
| Morning / Evening session | صبح / شام کی نشست | subah / shaam | |
| Fat | چکنائی | chiknai | |
| SNF (solids-not-fat) | ایس این ایف | SNF | keep abbreviation, tooltip explains |
| Litre | لیٹر | litre | |
| Customer | گاہک | gahak | |
| Credit balance (udhar) | ادھار | udhar | |
| Payment | ادائیگی | adaigi | |
| Invoice / Bill | بل | bill | |
| Price list | نرخ نامہ | nirkh nama | |
| Vaccination | ٹیکہ لگانا / ویکسین | teeka / vaccine | |
| Treatment | علاج | ilaaj | |
| Medicine | دوا | dawa | |
| Withdrawal period | دوا کے بعد دودھ بند رہنے کی مدت | dawa ke baad doodh band | tooltip: milk unsafe to sell |
| Vet | ڈاکٹر / ویٹرنری | doctor / vet | |
| Feed | چارہ / خوراک | chara / khurak | fodder vs feed; both in catalog |
| Ration | راشن / خوراک کی مقدار | ration | |
| Stock / Inventory | ذخیرہ / اسٹاک | stock | |
| Supplier | سپلائر / فراہم کنندہ | supplier | |
| Staff | عملہ | amla | |
| Attendance | حاضری | hazri | |
| Salary | تنخواہ | tankhwah | |
| Advance | پیشگی رقم | peshgi | |
| Task | کام | kaam | |
| Alert | انتباہ | intebah | |
| Group / Pen | گروپ / باڑہ | group / bara | |
| Ear tag | کان کا ٹیگ | kaan ka tag | |
| Pedigree | نسب | nasab | |
| Dashboard | ڈیش بورڈ | dashboard | |
| Profit | منافع | munafa | |
| Loss | نقصان | nuqsan | |
| Expense | خرچ | kharch | |
| Income | آمدنی | aamdani | |

Terms marked for review: all Urdu entries are first drafts and must be validated by farm staff before release.

## 6. Writing rules for translators and developers

- Short, direct sentences. One idea per message. Verbs on buttons.
- Avoid idioms and abbreviations; define unavoidable ones (SCC, SNF, CMT, AI) in a tooltip/help link.
- Do not embed units in translations; use formatters.
- Keep a character-length budget (Urdu runs ~15-30% longer in some UI strings): test layouts with pseudo-locale (`en-XA`) in Storybook.
