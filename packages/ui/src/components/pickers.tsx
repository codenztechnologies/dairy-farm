import { Command } from 'cmdk';
import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js/min';
import { CalendarDays, Check, ChevronDown, X } from 'lucide-react';
import { Popover as RadixPopover } from 'radix-ui';
import { useEffect, useId, useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Select } from './controls';
import { TextInput, useFieldContext } from './field';

const triggerStyles = (invalid: boolean) =>
  cn(
    'flex h-(--control-height-md) w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-start text-base text-text',
    'transition-colors duration-(--duration-fast) ease-standard disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-text-disabled',
    invalid ? 'border-danger' : 'border-border-input hover:border-border-strong',
  );

const popoverContent =
  'z-(--z-dropdown) rounded-md border border-border bg-surface-raised p-2 shadow-md outline-none';

// Dates ------------------------------------------------------------------------------------------
// Business dates are plain "YYYY-MM-DD" strings (no time zone), per docs/01: never UTC-shifted.

function toDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIso(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

interface DatePickerProps {
  /** "YYYY-MM-DD" or undefined. */
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  placeholder: string;
  /** Inclusive limits as "YYYY-MM-DD". */
  min?: string;
  max?: string;
  disabled?: boolean;
}

/** Calendar popover. Formatting goes through Intl so Urdu and any future locale work without extra data. */
export function DatePicker({
  value,
  onValueChange,
  placeholder,
  min,
  max,
  disabled,
}: DatePickerProps) {
  const { t, i18n } = useTranslation();
  const field = useFieldContext();
  const valueId = useId();
  const [open, setOpen] = useState(false);
  const locale = i18n.language === 'ur' ? 'ur-PK-u-nu-latn' : i18n.language;
  const selected = value ? toDate(value) : undefined;
  const display = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);
  const month = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  );
  const weekday = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short' }), [locale]);
  const minDate = min ? toDate(min) : undefined;
  const maxDate = max ? toDate(max) : undefined;

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger
        id={field?.id}
        {...(field ? { 'aria-labelledby': `${field.labelId} ${valueId}` } : {})}
        disabled={disabled}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid ? true : undefined}
        className={triggerStyles(field?.invalid ?? false)}
      >
        <span id={valueId} className={cn(!selected && 'text-text-subtle')}>
          {selected ? display.format(selected) : placeholder}
        </span>
        <CalendarDays className="size-4 shrink-0 text-text-muted" aria-hidden />
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content align="start" sideOffset={6} className={popoverContent}>
          <DayPicker
            mode="single"
            dir={i18n.dir()}
            selected={selected}
            defaultMonth={selected ?? new Date()}
            onSelect={(date) => {
              onValueChange(date ? toIso(date) : undefined);
              setOpen(false);
            }}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            formatters={{
              formatCaption: (date) => month.format(date),
              formatWeekdayName: (date) => weekday.format(date),
            }}
            labels={{
              labelNext: () => t('picker.nextMonth'),
              labelPrevious: () => t('picker.previousMonth'),
            }}
            classNames={{
              root: 'text-text',
              months: 'relative',
              month_caption: 'flex h-9 items-center justify-center font-semibold',
              nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
              button_previous:
                'grid size-9 place-items-center rounded-sm hover:bg-bg-sunken rtl:rotate-180',
              button_next:
                'grid size-9 place-items-center rounded-sm hover:bg-bg-sunken rtl:rotate-180',
              weekday: 'size-10 text-center text-sm font-medium text-text-muted',
              day: 'p-0 text-center',
              day_button:
                'size-10 rounded-sm text-base hover:bg-bg-sunken data-[selected=true]:bg-primary data-[selected=true]:text-on-primary',
              today: 'font-bold text-accent',
              selected: 'bg-primary text-on-primary rounded-sm',
              outside: 'text-text-disabled',
              disabled: 'text-text-disabled line-through',
            }}
          />
          {selected ? (
            <button
              type="button"
              className="mt-1 w-full rounded-sm px-3 py-2 text-start text-sm text-text-muted hover:bg-bg-sunken"
              onClick={() => {
                onValueChange(undefined);
                setOpen(false);
              }}
            >
              {t('picker.clear')}
            </button>
          ) : null}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

interface TimePickerProps {
  /** "HH:mm" (24 h) or "". The browser shows the user's own 12/24 h format. */
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

/** Native time input: best keyboard, screen reader and phone support, and follows the user's clock format. */
export function TimePicker({ value, onValueChange, disabled }: TimePickerProps) {
  return (
    <TextInput
      type="time"
      dir="ltr"
      value={value}
      {...(disabled ? { disabled } : {})}
      onChange={(event) => {
        onValueChange(event.target.value);
      }}
    />
  );
}

// Phone ------------------------------------------------------------------------------------------

const COUNTRIES: readonly CountryCode[] = ['PK', 'IN', 'BD', 'AE', 'SA', 'GB', 'US'];

interface PhoneInputProps {
  /** E.164 such as "+923001234567", or "" while incomplete or invalid. */
  value: string;
  onValueChange: (e164: string) => void;
  defaultCountry?: CountryCode;
}

/** National-number entry with a country selector. Emits E.164 only when the number is valid. */
export function PhoneInput({ value, onValueChange, defaultCountry = 'PK' }: PhoneInputProps) {
  const { t, i18n } = useTranslation();
  const initial = value ? parsePhoneNumberFromString(value) : undefined;
  const [country, setCountry] = useState<CountryCode>(initial?.country ?? defaultCountry);
  const [national, setNational] = useState(initial?.nationalNumber ?? '');
  const names = useMemo(
    () => new Intl.DisplayNames(i18n.language, { type: 'region' }),
    [i18n.language],
  );

  function emit(nextCountry: CountryCode, digits: string) {
    const parsed = parsePhoneNumberFromString(digits, nextCountry);
    onValueChange(parsed?.isValid() ? parsed.number : '');
  }

  return (
    <div className="flex gap-2" dir="ltr">
      <div className="w-44 shrink-0">
        <Select
          value={country}
          onValueChange={(next) => {
            const code = next as CountryCode;
            setCountry(code);
            emit(code, national);
          }}
          placeholder={t('picker.country')}
          ariaLabel={t('picker.country')}
          standalone
          options={COUNTRIES.map((code) => ({
            value: code,
            label: `${names.of(code) ?? code} (+${getCountryCallingCode(code)})`,
          }))}
        />
      </div>
      <TextInput
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={national}
        onChange={(event) => {
          const digits = event.target.value.replaceAll(/[^\d\s-]/g, '');
          setNational(digits);
          emit(country, digits);
        }}
      />
    </div>
  );
}

// Combobox / MultiSelect -------------------------------------------------------------------------

export interface ComboOption {
  value: string;
  label: string;
  /** Secondary line, e.g. the animal's group or tag. */
  hint?: string;
}

interface ComboBase {
  placeholder: string;
  searchPlaceholder: string;
  options?: readonly ComboOption[];
  /** Async source. Called with the typed text (debounced); older responses are ignored. */
  loadOptions?: (query: string) => Promise<readonly ComboOption[]>;
  disabled?: boolean;
}

function useComboOptions({ options, loadOptions }: Pick<ComboBase, 'options' | 'loadOptions'>) {
  const [query, setQuery] = useState('');
  // The last settled server answer, tagged with the query it answered. "Loading" is derived from
  // it (no setState inside the effect body), and answers for older queries are never shown.
  const [settled, setSettled] = useState<{
    query: string;
    items: readonly ComboOption[];
    failed: boolean;
  }>();

  useEffect(() => {
    if (!loadOptions) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      loadOptions(query)
        .then((items) => {
          if (!cancelled) setSettled({ query, items, failed: false });
        })
        .catch(() => {
          if (!cancelled)
            setSettled((previous) => ({ query, items: previous?.items ?? [], failed: true }));
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, loadOptions]);

  const remote = loadOptions !== undefined;
  return {
    query,
    setQuery,
    items: remote ? (settled?.items ?? []) : (options ?? []),
    loading: remote && settled?.query !== query,
    failed: remote && settled?.query === query && settled.failed,
  };
}

function ComboList({
  items,
  query,
  loading,
  failed,
  isSelected,
  onPick,
  remote,
}: {
  items: readonly ComboOption[];
  query: string;
  loading: boolean;
  failed: boolean;
  isSelected: (value: string) => boolean;
  onPick: (option: ComboOption) => void;
  remote: boolean;
}) {
  const { t } = useTranslation();
  const visible = remote
    ? items
    : items.filter((o) =>
        `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
      );
  return (
    <Command.List className="max-h-64 overflow-y-auto p-1">
      {loading ? (
        <div className="px-3 py-2 text-sm text-text-muted" role="status">
          {t('state.loading')}
        </div>
      ) : null}
      {failed ? (
        <div className="px-3 py-2 text-sm text-danger" role="alert">
          {t('picker.loadFailed')}
        </div>
      ) : null}
      {!loading && !failed && visible.length === 0 ? (
        <div className="px-3 py-3 text-sm text-text-muted">{t('picker.noMatches')}</div>
      ) : null}
      {visible.map((option) => (
        <Command.Item
          key={option.value}
          value={option.value}
          onSelect={() => {
            onPick(option);
          }}
          className="flex min-h-(--control-height-md) cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-1.5 text-base text-text data-[selected=true]:bg-bg-sunken"
        >
          <span className="min-w-0">
            <span className="block truncate">{option.label}</span>
            {option.hint ? (
              <span className="block truncate text-sm text-text-muted">{option.hint}</span>
            ) : null}
          </span>
          {isSelected(option.value) ? (
            <Check className="size-4 shrink-0 text-primary" aria-hidden />
          ) : null}
        </Command.Item>
      ))}
    </Command.List>
  );
}

interface ComboboxProps extends ComboBase {
  value: string | undefined;
  /** Label to show for the current value when it is not in the loaded options (e.g. after reload). */
  valueLabel?: string;
  onValueChange: (value: string | undefined, option?: ComboOption) => void;
}

/** Searchable single choice. Static `options` filter locally; `loadOptions` queries a server (animal picker). */
export function Combobox({
  value,
  valueLabel,
  onValueChange,
  placeholder,
  searchPlaceholder,
  options,
  loadOptions,
  disabled,
}: ComboboxProps) {
  const field = useFieldContext();
  const valueId = useId();
  const [open, setOpen] = useState(false);
  const state = useComboOptions({
    ...(options ? { options } : {}),
    ...(loadOptions ? { loadOptions } : {}),
  });
  const current = state.items.find((o) => o.value === value)?.label ?? valueLabel;

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger
        id={field?.id}
        {...(field ? { 'aria-labelledby': `${field.labelId} ${valueId}` } : {})}
        role="combobox"
        aria-expanded={open}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid ? true : undefined}
        disabled={disabled}
        className={triggerStyles(field?.invalid ?? false)}
      >
        <span id={valueId} className={cn('truncate', !current && 'text-text-subtle')}>
          {current ?? placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 text-text-muted" aria-hidden />
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align="start"
          sideOffset={6}
          className={cn(popoverContent, 'w-(--radix-popover-trigger-width) p-0')}
        >
          <Command shouldFilter={false} loop>
            <Command.Input
              value={state.query}
              onValueChange={state.setQuery}
              placeholder={searchPlaceholder}
              className="h-(--control-height-md) w-full border-b border-border bg-transparent px-3 text-base text-text outline-none placeholder:text-text-subtle"
            />
            <ComboList
              items={state.items}
              query={state.query}
              loading={state.loading}
              failed={state.failed}
              remote={Boolean(loadOptions)}
              isSelected={(v) => v === value}
              onPick={(option) => {
                onValueChange(option.value === value ? undefined : option.value, option);
                setOpen(false);
              }}
            />
          </Command>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

interface MultiSelectProps extends ComboBase {
  value: readonly string[];
  /** Labels for values that may not be in the current option list. */
  labels?: Readonly<Record<string, string>>;
  onValueChange: (value: string[]) => void;
}

/** Searchable multiple choice shown as removable chips. */
export function MultiSelect({
  value,
  labels,
  onValueChange,
  placeholder,
  searchPlaceholder,
  options,
  loadOptions,
  disabled,
}: MultiSelectProps) {
  const { t } = useTranslation();
  const field = useFieldContext();
  const [open, setOpen] = useState(false);
  const state = useComboOptions({
    ...(options ? { options } : {}),
    ...(loadOptions ? { loadOptions } : {}),
  });
  const labelOf = (v: string) => labels?.[v] ?? state.items.find((o) => o.value === v)?.label ?? v;

  function toggle(v: string) {
    onValueChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <div className="flex flex-col gap-2">
      <RadixPopover.Root open={open} onOpenChange={setOpen}>
        <RadixPopover.Trigger
          id={field?.id}
          {...(field ? { 'aria-labelledby': field.labelId } : {})}
          role="combobox"
          aria-expanded={open}
          aria-describedby={field?.describedBy}
          aria-invalid={field?.invalid ? true : undefined}
          disabled={disabled}
          className={triggerStyles(field?.invalid ?? false)}
        >
          <span className="truncate text-text-subtle">{placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-text-muted" aria-hidden />
        </RadixPopover.Trigger>
        <RadixPopover.Portal>
          <RadixPopover.Content
            align="start"
            sideOffset={6}
            className={cn(popoverContent, 'w-(--radix-popover-trigger-width) p-0')}
          >
            <Command shouldFilter={false} loop>
              <Command.Input
                value={state.query}
                onValueChange={state.setQuery}
                placeholder={searchPlaceholder}
                className="h-(--control-height-md) w-full border-b border-border bg-transparent px-3 text-base text-text outline-none placeholder:text-text-subtle"
              />
              <ComboList
                items={state.items}
                query={state.query}
                loading={state.loading}
                failed={state.failed}
                remote={Boolean(loadOptions)}
                isSelected={(v) => value.includes(v)}
                onPick={(option) => {
                  toggle(option.value);
                }}
              />
            </Command>
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((v) => (
            <li
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 ps-3 pe-1 text-sm font-medium text-nav-active-text"
            >
              {labelOf(v)}
              <button
                type="button"
                onClick={() => {
                  toggle(v);
                }}
                aria-label={t('picker.remove', { name: labelOf(v) })}
                className="grid size-6 place-items-center rounded-full hover:bg-surface/60"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
