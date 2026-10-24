import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { AppFrame } from '@/components/app-frame';
import { LOCALE_COOKIE, THEME_COOKIE, parseLocale, parseTheme } from '@/lib/preferences';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  return (
    <AppFrame
      locale={parseLocale(store.get(LOCALE_COOKIE)?.value)}
      initialTheme={parseTheme(store.get(THEME_COOKIE)?.value)}
    >
      {children}
    </AppFrame>
  );
}
