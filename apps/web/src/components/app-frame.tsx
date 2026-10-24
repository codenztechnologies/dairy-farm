'use client';

import { LOCALES, type Locale } from '@dairy/i18n';
import { brand } from '@dairy/theme/brand';
import {
  AppShell,
  FarmSwitcher,
  LanguageSwitcher,
  MenuItem,
  MenuLabel,
  CommandPalette,
  NotificationCenter,
  SearchTrigger,
  Sidebar,
  ThemeToggle,
  UserMenu,
  useCommandShortcut,
  type NavItem,
  type NotificationItem,
  type PaletteGroup,
} from '@dairy/ui';
import {
  BarChart3,
  Beef,
  Boxes,
  Droplets,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  Palette,
  Settings,
  Stethoscope,
  Users,
  Wallet,
  Wheat,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ThemeName } from '@/lib/preferences';
import { PREVIEW_ROUTES } from '@/lib/preview';
import { usePreferences } from '@/lib/use-preferences';

const PaletteContext = createContext<() => void>(() => undefined);

/** Lets any page open the Ctrl K palette (the search box in the top bar uses the same one). */
export function useOpenPalette(): () => void {
  return use(PaletteContext);
}

const SHOW_DESIGN_SYSTEM = PREVIEW_ROUTES;

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <span className="flex items-center gap-2 text-lg font-bold text-text">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-on-primary"
      >
        <Droplets className="size-5" />
      </span>
      <span className={collapsed ? 'sr-only' : undefined}>{brand.shortName}</span>
    </span>
  );
}

export function AppFrame({
  locale,
  initialTheme,
  children,
}: {
  locale: Locale;
  initialTheme: ThemeName | undefined;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [readIds, setReadIds] = useState<readonly string[]>([]);
  const openPalette = useCallback(() => {
    setPaletteOpen(true);
  }, []);
  const togglePalette = useCallback(() => {
    setPaletteOpen((open) => !open);
  }, []);
  useCommandShortcut(togglePalette);
  const { theme, toggleTheme, changeLocale } = usePreferences(initialTheme);

  const item = (id: string, icon: NavItem['icon'], href: string): NavItem => ({
    id,
    icon,
    href,
    label: t(`nav.${id}` as 'nav.dashboard'),
    active: href === '/' ? pathname === '/' : pathname.startsWith(href),
  });

  const items = [
    item('dashboard', LayoutDashboard, '/'),
    item('animals', Beef, '/animals'),
    item('milk', Droplets, '/milk'),
    item('breeding', HeartPulse, '/breeding'),
    item('health', Stethoscope, '/health'),
    item('feed', Wheat, '/feed'),
    item('money', Wallet, '/money'),
    item('people', Users, '/people'),
    item('stock', Boxes, '/stock'),
    item('reports', BarChart3, '/reports'),
  ];
  const footerItems = [
    ...(SHOW_DESIGN_SYSTEM ? [item('designSystem', Palette, '/design-system')] : []),
    item('settings', Settings, '/settings'),
    item('help', HelpCircle, '/help'),
  ];

  // Sample notifications until the alert engine exists (Phase 1B).
  const notifications: NotificationItem[] = useMemo(
    () =>
      [
        {
          id: 'n1',
          title: t('sample.notifVaccine'),
          body: t('sample.notifVaccineBody'),
          time: t('sample.minutesAgo', { count: 12 }),
          tone: 'warning' as const,
        },
        {
          id: 'n2',
          title: t('sample.notifHold'),
          body: t('sample.notifHoldBody'),
          time: t('sample.hoursAgo', { count: 3 }),
          tone: 'info' as const,
        },
        {
          id: 'n3',
          title: t('sample.notifStock'),
          body: t('sample.notifStockBody'),
          time: t('sample.hoursAgo', { count: 5 }),
          tone: 'danger' as const,
        },
      ].map((item) => ({ ...item, unread: !readIds.includes(item.id) })),
    [t, readIds],
  );

  const paletteGroups: PaletteGroup[] = [
    {
      heading: t('palette.pages'),
      items: [...items, ...footerItems].map((nav) => ({
        id: nav.id,
        label: nav.label,
        icon: nav.icon,
        onSelect: () => {
          router.push(nav.href);
        },
      })),
    },
  ];

  return (
    <AppShell
      sidebar={({ mobile }) => (
        <Sidebar
          brand={<Brand collapsed={!mobile && collapsed} />}
          items={items}
          footerItems={footerItems}
          collapsed={!mobile && collapsed}
          {...(mobile
            ? {}
            : {
                onToggleCollapsed: () => {
                  setCollapsed((c) => !c);
                },
              })}
          linkComponent={Link}
        />
      )}
      topBar={
        <>
          <FarmSwitcher name="Green Valley Dairy" />
          <div className="hidden min-w-0 flex-1 md:flex">
            <SearchTrigger
              placeholder={t('topbar.searchPlaceholder')}
              hint={t('topbar.searchHint')}
              onClick={openPalette}
            />
          </div>
          <div className="ms-auto flex items-center gap-1 sm:gap-2">
            <NotificationCenter
              items={notifications}
              onMarkAllRead={() => {
                setReadIds(notifications.map((n) => n.id));
              }}
            />
            <div className="hidden items-center gap-2 sm:flex">
              <LanguageSwitcher
                value={locale}
                options={LOCALES.map((value) => ({ value, label: t(`locale.${value}`) }))}
                onChange={changeLocale}
              />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
            <UserMenu name="Ali Raza" role={t('roles.manager')}>
              {/* Phones: language and theme live here instead of crowding the top bar. */}
              <div className="sm:hidden">
                <MenuLabel>{t('topbar.language')}</MenuLabel>
                {LOCALES.map((value) => (
                  <MenuItem
                    key={value}
                    checked={value === locale}
                    onSelect={() => {
                      changeLocale(value);
                    }}
                  >
                    {t(`locale.${value}`)}
                  </MenuItem>
                ))}
                <MenuLabel>{t('topbar.theme')}</MenuLabel>
                <MenuItem onSelect={toggleTheme}>
                  {theme === 'dark' ? t('topbar.themeLight') : t('topbar.themeDark')}
                </MenuItem>
              </div>
            </UserMenu>
          </div>
        </>
      }
    >
      <PaletteContext value={openPalette}>{children}</PaletteContext>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={paletteGroups}
        placeholder={t('topbar.searchPlaceholder')}
      />
    </AppShell>
  );
}
