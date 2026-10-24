import { Check, ChevronDown, Minus } from 'lucide-react';
import {
  Checkbox as RadixCheckbox,
  RadioGroup,
  Select as RadixSelect,
  Switch as RadixSwitch,
} from 'radix-ui';
import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { TextInput, useFieldContext, type TextInputProps } from './field';

// Select ---------------------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  /** Accessible name when used without a Field (e.g. inside PhoneInput). */
  ariaLabel?: string;
  /** Ignore the surrounding Field: this select is a sub-control of a composite input. */
  standalone?: boolean;
}

/** Single choice from a short list. For long or searchable lists use Combobox (next slice). */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  ariaLabel,
  standalone = false,
}: SelectProps) {
  const outer = useFieldContext();
  const field = standalone ? null : outer;
  const valueId = useId();
  const invalid = field?.invalid ?? false;
  return (
    <RadixSelect.Root
      {...(value === undefined ? {} : { value })}
      onValueChange={onValueChange}
      {...(disabled ? { disabled } : {})}
    >
      <RadixSelect.Trigger
        id={field?.id}
        {...(field ? { 'aria-labelledby': `${field.labelId} ${valueId}` } : {})}
        {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid || undefined}
        className={cn(
          'flex h-(--control-height-md) w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-start text-base text-text',
          'data-[placeholder]:text-text-subtle disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-text-disabled',
          'transition-colors duration-(--duration-fast) ease-standard',
          invalid ? 'border-danger' : 'border-border-input hover:border-border-strong',
          className,
        )}
      >
        <RadixSelect.Value id={valueId} placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="size-4 text-text-muted" aria-hidden />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-(--z-dropdown) max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-md border border-border bg-surface-raised shadow-md"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                {...(option.disabled ? { disabled: true } : {})}
                className="flex h-(--control-height-md) cursor-pointer items-center justify-between gap-3 rounded-sm px-3 text-base text-text outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-text-disabled data-[highlighted]:bg-bg-sunken"
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <Check className="size-4 text-primary" aria-hidden />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

// Checkbox, Switch -----------------------------------------------------------------------------

const rowStyles =
  'inline-flex min-h-(--touch-target-min) cursor-pointer items-center gap-3 text-base text-text';

interface CheckboxProps {
  checked: boolean | 'indeterminate';
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onCheckedChange, label, disabled, className }: CheckboxProps) {
  return (
    <label
      className={cn(rowStyles, disabled && 'cursor-not-allowed text-text-disabled', className)}
    >
      <RadixCheckbox.Root
        checked={checked}
        onCheckedChange={(next) => {
          onCheckedChange(next === true);
        }}
        {...(disabled ? { disabled } : {})}
        className="grid size-5 shrink-0 place-items-center rounded-xs border border-border-input bg-surface data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary"
      >
        <RadixCheckbox.Indicator className="text-on-primary">
          {checked === 'indeterminate' ? (
            <Minus className="size-3.5" aria-hidden />
          ) : (
            <Check className="size-3.5" aria-hidden />
          )}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label}
    </label>
  );
}

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, label, disabled, className }: SwitchProps) {
  return (
    <label
      className={cn(rowStyles, disabled && 'cursor-not-allowed text-text-disabled', className)}
    >
      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        {...(disabled ? { disabled } : {})}
        className="relative h-6 w-11 shrink-0 rounded-full border border-border-input bg-bg-sunken transition-colors duration-(--duration-fast) data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      >
        <RadixSwitch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-text-muted transition-transform duration-(--duration-fast) data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-primary rtl:-translate-x-0.5 rtl:data-[state=checked]:-translate-x-6" />
      </RadixSwitch.Root>
      {label}
    </label>
  );
}

// RadioPills (e.g. Female / Male / Unknown) ----------------------------------------------------

interface RadioPillsProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  /** Accessible name for the group when no visible Field label wraps it. */
  label: string;
  className?: string;
}

export function RadioPills({ value, onValueChange, options, label, className }: RadioPillsProps) {
  return (
    <RadioGroup.Root
      {...(value === undefined ? {} : { value })}
      onValueChange={onValueChange}
      aria-label={label}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          className="inline-flex h-(--control-height-md) items-center rounded-full border border-border-input bg-surface px-4 text-base font-medium text-text hover:bg-bg-sunken data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft data-[state=checked]:text-nav-active-text"
        >
          {option.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}

// NumberInput / MoneyInput: values stay strings so decimals are never float-rounded -------------

interface NumberInputProps extends Omit<
  TextInputProps,
  'value' | 'onChange' | 'type' | 'inputMode'
> {
  value: string;
  onValueChange: (value: string) => void;
  /** Decimal places allowed: 0 for whole numbers, 3 for quantities, 2 for money. */
  decimals?: number;
}

function acceptsNumber(text: string, decimals: number): boolean {
  if (text === '') return true;
  const pattern = decimals === 0 ? /^\d+$/ : new RegExp(`^\\d*\\.?\\d{0,${String(decimals)}}$`);
  return pattern.test(text);
}

/** Numeric text input: blocks non-numeric typing, keeps the decimal string, shows a numeric keypad. */
export function NumberInput({ value, onValueChange, decimals = 3, ...props }: NumberInputProps) {
  return (
    <TextInput
      {...props}
      dir="ltr"
      inputMode={decimals === 0 ? 'numeric' : 'decimal'}
      autoComplete="off"
      value={value}
      onChange={(event) => {
        const next = event.target.value.replace(',', '.');
        if (acceptsNumber(next, decimals)) onValueChange(next);
      }}
    />
  );
}

/** Money with two decimals and the currency symbol shown inside the field. */
export function MoneyInput({
  currency,
  ...props
}: Omit<NumberInputProps, 'decimals' | 'leading'> & { currency: string }) {
  return <NumberInput {...props} decimals={2} leading={<span dir="ltr">{currency}</span>} />;
}
