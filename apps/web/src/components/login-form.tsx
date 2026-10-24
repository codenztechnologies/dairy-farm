'use client';

import { IDENTIFIER_MAX, PASSWORD_MAX, loginSchema, type Problem } from '@dairy/contracts';
import {
  Banner,
  focusFirstInvalid,
  revalidateWhileInvalid,
  formProps,
  toast,
  useAppForm,
} from '@dairy/ui';
import { useTranslation } from 'react-i18next';
import type { SignInResult } from '@/lib/preview-auth';

interface FormFailure {
  message: string;
  /** Quoted to support when the failure is on our side. */
  requestId?: string;
}

interface LoginFormProps {
  onSignIn: (values: { identifier: string; password: string }) => Promise<SignInResult>;
  onSuccess?: () => void;
}

const LIMITS = { max: PASSWORD_MAX, idMax: IDENTIFIER_MAX } as const;

export function LoginForm({ onSignIn, onSuccess }: LoginFormProps) {
  const { t } = useTranslation();

  function describe(problem: Problem): FormFailure {
    // The API already localises `detail`, but clients may re-localise from the stable `code`.
    switch (problem.code) {
      case 'AUTH_INVALID_CREDENTIALS':
        return { message: t('login.invalidCredentials') };
      case 'RATE_LIMITED':
        return { message: t('login.rateLimited') };
      default:
        return { message: t('login.serverError'), requestId: problem.requestId };
    }
  }

  const form = useAppForm({
    defaultValues: { identifier: '', password: '' },
    validators: {
      onBlur: loginSchema,
      // Submit re-checks every field with the latest values (Enter can be pressed without leaving a field).
      onSubmit: loginSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          // Same schema on the server; here it also trims the identifier before it is sent.
          const result = await onSignIn(loginSchema.parse(value));
          if (result.ok) return undefined;
          return { form: describe(result.problem), fields: {} };
        } catch {
          return { form: { message: t('login.networkError') } satisfies FormFailure, fields: {} };
        }
      },
    },
    onSubmit: () => {
      toast({ title: t('login.successTitle'), description: t('login.successBody') });
      onSuccess?.();
    },
    onSubmitInvalid: () => {
      focusFirstInvalid();
    },
  });

  return (
    <form {...formProps(form)} className="space-y-5" aria-describedby="login-failure">
      <form.AppForm>
        <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
          {(failure) => {
            const shown = asFailure(failure);
            return shown ? (
              <div id="login-failure">
                <Banner tone="danger">
                  <p className="font-medium">{shown.message}</p>
                  {shown.requestId ? (
                    <p className="mt-1 font-mono text-sm" dir="ltr">
                      {t('state.requestId', { id: shown.requestId })}
                    </p>
                  ) : null}
                </Banner>
              </div>
            ) : null;
          }}
        </form.Subscribe>

        <form.AppField name="identifier" listeners={revalidateWhileInvalid}>
          {(field) => (
            <field.TextField
              label={t('login.identifierLabel')}
              required
              type="text"
              ltr
              autoComplete="username"
              inputMode="email"
              placeholder={t('login.identifierPlaceholder')}
              spellCheck={false}
              autoCapitalize="none"
              errorParams={LIMITS}
            />
          )}
        </form.AppField>

        <form.AppField name="password" listeners={revalidateWhileInvalid}>
          {(field) => (
            <field.PasswordField
              label={t('login.passwordLabel')}
              required
              autoComplete="current-password"
              errorParams={LIMITS}
            />
          )}
        </form.AppField>

        <form.SubmitButton loadingLabel={t('login.submitting')} fullWidth>
          {t('login.submit')}
        </form.SubmitButton>
      </form.AppForm>
    </form>
  );
}

function asFailure(value: unknown): FormFailure | undefined {
  if (typeof value !== 'object' || value === null || !('message' in value)) return undefined;
  const { message } = value;
  if (typeof message !== 'string') return undefined;
  const requestId = (value as { requestId?: unknown }).requestId;
  return { message, ...(typeof requestId === 'string' ? { requestId } : {}) };
}
