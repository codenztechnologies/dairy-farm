'use client';

import { createI18n, type Locale } from '@dairy/i18n';
import { Toaster, TooltipProvider } from '@dairy/ui';
import { useMemo, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  const i18n = useMemo(() => createI18n(locale), [locale]);
  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </I18nextProvider>
  );
}
