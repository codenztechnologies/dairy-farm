import { cookies } from 'next/headers';
import { DashboardView } from '@/components/dashboard-view';
import { LOCALE_COOKIE, parseLocale } from '@/lib/preferences';

export default async function DashboardPage() {
  const store = await cookies();
  // Hour is computed on the server per request so server and client markup always agree.
  const hour = new Date().getHours();
  return <DashboardView locale={parseLocale(store.get(LOCALE_COOKIE)?.value)} hour={hour} />;
}
