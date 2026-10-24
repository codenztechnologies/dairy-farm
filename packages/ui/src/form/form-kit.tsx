import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/button';
import { Field, TextInput, Textarea } from '../components/field';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

/** Values the schema messages may reference, e.g. { min: 10, max: 128 }. */
export type ErrorParams = Readonly<Record<string, string | number>>;

/**
 * Turns whatever a validator produced into one human sentence.
 * - Schema issues carry an i18n key as their message (`validation.required`): translated here.
 * - Server messages arrive already localised: shown as they are.
 */
export function useErrorText(): (error: unknown, params?: ErrorParams) => string | undefined {
  const { t, i18n } = useTranslation();
  return (error, params) => {
    const message =
      typeof error === 'string'
        ? error
        : typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string'
          ? error.message
          : undefined;
    if (!message) return undefined;
    const key = /^[a-z][A-Za-z]*(\.[A-Za-z0-9]+)+$/;
    // i18n keys look like "validation.required"; real sentences contain spaces and are returned unchanged.
    return key.test(message) && i18n.exists(message)
      ? t(message as 'validation.required', { ...params })
      : message;
  };
}

interface BaseFieldProps {
  label: string;
  helper?: string;
  required?: boolean;
  /** Values for ICU placeholders in validation messages. */
  errorParams?: ErrorParams;
}

type InputPassthrough = Pick<
  ComponentProps<'input'>,
  | 'autoComplete'
  | 'inputMode'
  | 'placeholder'
  | 'maxLength'
  | 'autoFocus'
  | 'spellCheck'
  | 'autoCapitalize'
>;

function useFieldError(errorParams: ErrorParams | undefined): string | undefined {
  const field = useFieldContext<unknown>();
  const text = useErrorText();
  // Form-level validators fill every field; only show what the person has reached (blur or submit).
  if (!field.state.meta.isTouched) return undefined;
  const first = field.state.meta.errors[0] as unknown;
  return first === undefined ? undefined : text(first, errorParams);
}

export interface TextFieldProps extends BaseFieldProps, InputPassthrough {
  type?: 'text' | 'email' | 'tel' | 'url';
  /** Left-to-right content such as tags, emails and phone numbers should not flip in RTL. */
  ltr?: boolean;
  trailing?: ReactNode;
}

export function TextField({
  label,
  helper,
  required,
  errorParams,
  type = 'text',
  ltr,
  trailing,
  ...input
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const error = useFieldError(errorParams);
  return (
    <Field label={label} required={required ?? false} {...(helper ? { helper } : {})} error={error}>
      <TextInput
        {...input}
        type={type}
        name={field.name}
        data-field-name={field.name}
        {...(ltr ? { dir: 'ltr' } : {})}
        {...(trailing ? { trailing } : {})}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => {
          field.handleChange(event.target.value);
        }}
      />
    </Field>
  );
}

export interface PasswordFieldProps extends BaseFieldProps {
  /** "current-password" when signing in, "new-password" when choosing one, so password managers help. */
  autoComplete: 'current-password' | 'new-password';
}

/** Password with a show/hide toggle. Paste and password managers are never blocked (WCAG accessible authentication). */
export function PasswordField({
  label,
  helper,
  required,
  errorParams,
  autoComplete,
}: PasswordFieldProps) {
  const { t } = useTranslation();
  const field = useFieldContext<string>();
  const error = useFieldError(errorParams);
  const [visible, setVisible] = useState(false);
  const toggleId = useId();
  return (
    <Field label={label} required={required ?? false} {...(helper ? { helper } : {})} error={error}>
      <div className="relative">
        <TextInput
          type={visible ? 'text' : 'password'}
          name={field.name}
          data-field-name={field.name}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          dir="ltr"
          className="pe-12"
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => {
            field.handleChange(event.target.value);
          }}
        />
        <button
          id={toggleId}
          type="button"
          aria-pressed={visible}
          aria-label={visible ? t('form.hidePassword') : t('form.showPassword')}
          onClick={() => {
            setVisible((v) => !v);
          }}
          className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-text-muted hover:bg-bg-sunken"
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden />
          ) : (
            <Eye className="size-5" aria-hidden />
          )}
        </button>
      </div>
    </Field>
  );
}

export interface TextAreaFieldProps extends BaseFieldProps {
  maxLength: number;
}

export function TextAreaField({
  label,
  helper,
  required,
  errorParams,
  maxLength,
}: TextAreaFieldProps) {
  const field = useFieldContext<string>();
  const error = useFieldError(errorParams);
  return (
    <Field label={label} required={required ?? false} {...(helper ? { helper } : {})} error={error}>
      <Textarea
        name={field.name}
        data-field-name={field.name}
        maxLength={maxLength}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => {
          field.handleChange(event.target.value);
        }}
      />
    </Field>
  );
}

export function SubmitButton({
  children,
  loadingLabel,
  fullWidth,
}: {
  children: ReactNode;
  loadingLabel: string;
  fullWidth?: boolean;
}) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          loadingLabel={loadingLabel}
          fullWidth={fullWidth ?? false}
        >
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, PasswordField, TextAreaField },
  formComponents: { SubmitButton },
});

/** Spread onto <form>: stops the browser's own validation bubbles and submits through the form kit. */
export function formProps(form: { handleSubmit: () => Promise<unknown> }): {
  noValidate: true;
  onSubmit: (event: { preventDefault: () => void; stopPropagation: () => void }) => void;
} {
  return {
    noValidate: true,
    onSubmit: (event) => {
      event.preventDefault();
      event.stopPropagation();
      void form.handleSubmit();
    },
  };
}

/** Moves focus to the first field that has an error. Call after a failed submit, once errors are rendered. */
export function focusFirstInvalid(root: ParentNode = document): void {
  window.setTimeout(() => {
    root.querySelector<HTMLElement>('[data-field-name][aria-invalid="true"]')?.focus();
  }, 0);
}

export interface FormErrors {
  /** Message for the whole form (e.g. wrong credentials). */
  form?: string;
  /** Field name to message. */
  fields: Record<string, string>;
}

interface ProblemLike {
  detail?: string | undefined;
  title: string;
  errors?: readonly { field: string; message: string }[] | undefined;
}

/** Maps an API problem+json to what TanStack Form's `onSubmitAsync` expects: `{ form, fields }`. */
export function problemToFormErrors(problem: ProblemLike): FormErrors {
  const fields: Record<string, string> = {};
  for (const error of problem.errors ?? []) fields[error.field] ??= error.message;
  return { form: problem.detail ?? problem.title, fields };
}

/**
 * Field listeners that fix stale errors: a field that is showing an error re-checks itself on every change,
 * so the message disappears the moment the value is fixed, and nothing is said while someone is still typing
 * in a field that has no error. Use with blur + submit validators (submit always re-checks every field with
 * the latest values, which keeps Enter-to-submit working without leaving the last field).
 *
 *   <form.AppField name="email" listeners={revalidateWhileInvalid}>
 */
export const revalidateWhileInvalid = {
  onChange: ({
    fieldApi,
  }: {
    fieldApi: {
      state: { meta: { errors: readonly unknown[] } };
      validate: (cause: 'blur') => unknown;
    };
  }) => {
    if (fieldApi.state.meta.errors.length > 0) void fieldApi.validate('blur');
  },
};
