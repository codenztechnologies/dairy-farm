'use client';

import { Banner } from '@dairy/ui';
import { useTranslation } from 'react-i18next';
import { AuthShell } from './auth-shell';
import { LoginForm } from './login-form';
import type { ThemeName } from '@/lib/preferences';
import type { Locale } from '@dairy/i18n';
import { previewSignIn } from '@/lib/preview-auth';

export function LoginView({
  locale,
  initialTheme,
}: {
  locale: Locale;
  initialTheme: ThemeName | undefined;
}) {
  const { t } = useTranslation();
  return (
    <AuthShell
      locale={locale}
      initialTheme={initialTheme}
      title={t('login.title')}
      subtitle={t('login.subtitle')}
    >
      <Banner tone="info">{t('login.previewNote')}</Banner>
      <LoginForm onSignIn={previewSignIn} />
    </AuthShell>
  );
}
