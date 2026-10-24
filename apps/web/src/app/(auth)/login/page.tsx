import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { LoginView } from '@/components/login-view';
import { LOCALE_COOKIE, THEME_COOKIE, parseLocale, parseTheme } from '@/lib/preferences';
import { PREVIEW_ROUTES } from '@/lib/preview';

export default async function LoginPage() {
  // Preview screen backed by a stub; the real route ships with the account system (E0.4).
  if (!PREVIEW_ROUTES) notFound();
  const store = await cookies();
  return (
    <LoginView
      locale={parseLocale(store.get(LOCALE_COOKIE)?.value)}
      initialTheme={parseTheme(store.get(THEME_COOKIE)?.value)}
    />
  );
}
