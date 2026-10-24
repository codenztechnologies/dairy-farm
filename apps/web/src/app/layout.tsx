import { direction } from '@dairy/i18n';
import { brand } from '@dairy/theme/brand';
import { cookies } from 'next/headers';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import { LOCALE_COOKIE, THEME_COOKIE, parseLocale, parseTheme } from '@/lib/preferences';
import './globals.css';

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: 'Dairy farm management',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const locale = parseLocale(store.get(LOCALE_COOKIE)?.value);
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);

  return (
    <html lang={locale} dir={direction(locale)} data-theme={theme}>
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
