'use client';

import { LOCALES, type Locale } from '@dairy/i18n';
import { brand } from '@dairy/theme/brand';
import { Card, CardContent, LanguageSwitcher, ThemeToggle } from '@dairy/ui';
import { Droplets } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ThemeName } from '@/lib/preferences';
import type { ReactNode } from 'react';
import { usePreferences } from '@/lib/use-preferences';

/** Centred card for signed-out screens, with language and theme controls in the corner. */
export function AuthShell({
  locale,
  initialTheme,
  title,
  subtitle,
  children,
}: {
  locale: Locale;
  initialTheme: ThemeName | undefined;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { theme, toggleTheme, changeLocale } = usePreferences(initialTheme);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <span className="flex items-center gap-2 text-lg font-bold text-text">
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-md bg-primary text-on-primary"
          >
            <Droplets className="size-5" />
          </span>
          {brand.shortName}
        </span>
        <div className="flex items-center gap-2">
          <LanguageSwitcher
            value={locale}
            options={LOCALES.map((value) => ({ value, label: t(`locale.${value}`) }))}
            onChange={changeLocale}
          />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>
      <main id="main" className="grid flex-1 place-items-center px-4 pb-12">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold leading-tight text-text">{title}</h1>
              <p className="text-base text-text-muted">{subtitle}</p>
            </div>
            {children}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
