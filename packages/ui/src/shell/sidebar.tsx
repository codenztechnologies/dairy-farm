import { ChevronsLeft, ChevronsRight, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import type { ElementType, ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  brand: ReactNode;
  items: readonly NavItem[];
  /** Pinned to the bottom (Settings, Help & Support). */
  footerItems?: readonly NavItem[];
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Router link component (e.g. next/link). Defaults to a plain anchor. */
  linkComponent?: ElementType;
  className?: string;
}

function NavLink({
  item,
  collapsed,
  Link,
}: {
  item: NavItem;
  collapsed: boolean;
  Link: ElementType;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={item.active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex h-(--control-height-md) items-center gap-3 rounded-sm px-3 text-base font-medium',
        'transition-colors duration-(--duration-fast) ease-standard',
        item.active
          ? 'bg-nav-active-bg text-nav-active-text'
          : 'text-text-muted hover:bg-bg-sunken hover:text-text',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className={cn(collapsed && 'sr-only')}>{item.label}</span>
    </Link>
  );
}

export function Sidebar({
  brand,
  items,
  footerItems = [],
  collapsed = false,
  onToggleCollapsed,
  linkComponent: Link = 'a',
  className,
}: SidebarProps) {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t('nav.primary')}
      className={cn(
        'flex h-full flex-col gap-2 border-e border-border bg-surface p-3',
        collapsed ? 'w-(--sidebar-width-collapsed)' : 'w-(--sidebar-width)',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-(--control-height-lg) items-center px-2',
          collapsed && 'justify-center px-0',
        )}
      >
        {brand}
      </div>
      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id}>
            <NavLink item={item} collapsed={collapsed} Link={Link} />
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-1 border-t border-divider pt-2">
        {footerItems.map((item) => (
          <li key={item.id}>
            <NavLink item={item} collapsed={collapsed} Link={Link} />
          </li>
        ))}
        {onToggleCollapsed ? (
          <li>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
              className={cn(
                'flex h-(--control-height-md) w-full items-center gap-3 whitespace-nowrap rounded-sm px-3 text-sm font-medium',
                'text-text-muted hover:bg-bg-sunken hover:text-text',
                collapsed && 'justify-center px-0',
              )}
            >
              {collapsed ? (
                <ChevronsRight className="size-5 rtl:rotate-180" aria-hidden />
              ) : (
                <ChevronsLeft className="size-5 rtl:rotate-180" aria-hidden />
              )}
              <span className={cn(collapsed && 'sr-only')}>{t('nav.collapse')}</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
