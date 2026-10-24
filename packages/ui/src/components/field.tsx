import { createContext, use, useId, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

function useFieldContext(): FieldContextValue | null {
  return use(FieldContext);
}

interface FieldProps {
  label: string;
  /** Required fields get an asterisk; optional ones say "(optional)" (docs/01 section 10). */
  required?: boolean;
  helper?: string;
  /** Error text shown under the field. Setting it marks the control invalid. */
  error?: string | undefined;
  children: ReactNode;
  className?: string;
}

export function Field({ label, required = false, helper, error, children, className }: FieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext value={{ id, describedBy, invalid: Boolean(error), required }}>
      <div className={cn('flex flex-col gap-1.5', className)}>
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {required ? (
            <>
              <span aria-hidden className="ms-0.5 text-danger">
                *
              </span>
              <span className="sr-only"> {t('state.required')}</span>
            </>
          ) : (
            <span className="ms-1 font-normal text-text-subtle">{t('state.optional')}</span>
          )}
        </label>
        {children}
        {helper ? (
          <p id={helperId} className="text-sm text-text-subtle">
            {helper}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext>
  );
}

const controlBase = [
  'w-full rounded-md border bg-surface text-base text-text',
  'placeholder:text-text-subtle',
  'transition-colors duration-(--duration-fast) ease-standard',
  'disabled:cursor-not-allowed disabled:bg-bg-sunken disabled:text-text-disabled',
  'read-only:bg-bg-sunken',
];

function controlTone(invalid: boolean): string {
  return invalid
    ? 'border-danger'
    : 'border-border-input hover:border-border-strong focus-visible:border-primary';
}

export interface TextInputProps extends ComponentProps<'input'> {
  /** Unit or symbol shown inside the field after the value, e.g. "L" or "kg". */
  trailing?: ReactNode;
  leading?: ReactNode;
}

export function TextInput({ className, trailing, leading, ...props }: TextInputProps) {
  const field = useFieldContext();
  const invalid = field?.invalid ?? false;
  return (
    <div className="relative flex items-center">
      {leading ? (
        <span className="pointer-events-none absolute start-3 text-text-muted">{leading}</span>
      ) : null}
      <input
        id={field?.id}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid || undefined}
        required={field?.required}
        className={cn(
          controlBase,
          controlTone(invalid),
          'h-(--control-height-md) px-3',
          leading ? 'ps-10' : undefined,
          trailing ? 'pe-12' : undefined,
          className,
        )}
        {...props}
      />
      {trailing ? (
        <span className="pointer-events-none absolute end-3 text-sm font-medium text-text-muted">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export interface TextareaProps extends ComponentProps<'textarea'> {
  /** Shows a live "n/max" counter when maxLength is set and the value is controlled. */
  value?: string;
}

export function Textarea({ className, maxLength, value, ...props }: TextareaProps) {
  const field = useFieldContext();
  const invalid = field?.invalid ?? false;
  return (
    <div className="flex flex-col gap-1">
      <textarea
        id={field?.id}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid || undefined}
        required={field?.required}
        maxLength={maxLength}
        value={value}
        className={cn(controlBase, controlTone(invalid), 'min-h-24 resize-y px-3 py-2', className)}
        {...props}
      />
      {maxLength !== undefined && value !== undefined ? (
        <span className="self-end text-sm text-text-subtle" dir="ltr">
          {value.length}/{maxLength}
        </span>
      ) : null}
    </div>
  );
}
