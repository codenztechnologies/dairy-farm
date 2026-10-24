import {
  Bell,
  CheckCircle2,
  CloudOff,
  RefreshCw,
  TriangleAlert,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Banner } from '../components/banner';
import { Popover } from '../components/disclosure';
import { cn } from '../lib/cn';
import type { ReactNode } from 'react';

// Notification centre ----------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  /** Pre-formatted time, e.g. "10 min ago". */
  time: string;
  unread: boolean;
  tone?: 'info' | 'warning' | 'danger';
  onSelect?: () => void;
}

interface NotificationCenterProps {
  items: readonly NotificationItem[];
  onMarkAllRead: () => void;
  footer?: ReactNode;
}

const TONE_ICON: Record<
  NonNullable<NotificationItem['tone']>,
  { Icon: LucideIcon; className: string }
> = {
  info: { Icon: Bell, className: 'bg-tint-blue-bg text-tint-blue-fg' },
  warning: { Icon: TriangleAlert, className: 'bg-tint-amber-bg text-tint-amber-fg' },
  danger: { Icon: TriangleAlert, className: 'bg-tint-rose-bg text-tint-rose-fg' },
};

/** Bell with an unread badge that opens the list. The count is in the accessible name. */
export function NotificationCenter({ items, onMarkAllRead, footer }: NotificationCenterProps) {
  const { t } = useTranslation();
  const unread = items.filter((item) => item.unread).length;
  return (
    <Popover
      trigger={
        <button
          type="button"
          aria-label={`${t('topbar.notifications')}: ${t('topbar.notificationsCount', { count: unread })}`}
          className="relative grid size-(--control-height-md) place-items-center rounded-sm text-text-muted hover:bg-bg-sunken hover:text-text"
        >
          <Bell className="size-5" aria-hidden />
          {unread > 0 ? (
            <span
              aria-hidden
              className="absolute end-1 top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-xs font-semibold leading-5 text-text-inverse"
            >
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </button>
      }
      className="w-96 max-w-[calc(100vw-2rem)]"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-text">{t('topbar.notifications')}</h2>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unread === 0}
          className="rounded-xs text-sm font-medium text-text-link hover:underline disabled:text-text-disabled disabled:no-underline"
        >
          {t('notifications.markAllRead')}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-text-muted">{t('notifications.empty')}</p>
      ) : (
        <ul className="max-h-96 divide-y divide-divider overflow-y-auto">
          {items.map((item) => {
            const { Icon, className } = TONE_ICON[item.tone ?? 'info'];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={item.onSelect}
                  className="flex w-full items-start gap-3 px-4 py-3 text-start hover:bg-bg-sunken"
                >
                  <span
                    className={cn('grid size-9 shrink-0 place-items-center rounded-md', className)}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm text-text', item.unread && 'font-semibold')}>
                      {item.title}
                    </span>
                    {item.body ? (
                      <span className="block text-sm text-text-muted">{item.body}</span>
                    ) : null}
                    <span className="mt-0.5 block text-xs text-text-subtle">{item.time}</span>
                  </span>
                  {item.unread ? (
                    <>
                      <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
                      <span className="sr-only">{t('notifications.unread')}</span>
                    </>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
    </Popover>
  );
}

// Offline banner and sync pill ---------------------------------------------------------------------

/** Shown at the top of the page while offline. Entries made now are kept and sent later. */
export function OfflineBanner({ pendingCount = 0 }: { pendingCount?: number }) {
  const { t } = useTranslation();
  return (
    <Banner tone="warning" className="mb-4">
      <p className="flex items-center gap-2 font-semibold">
        <WifiOff className="size-4" aria-hidden />
        {t('state.offlineTitle')}
      </p>
      <p>{t('state.offlineBody')}</p>
      {pendingCount > 0 ? (
        <p className="mt-1 font-medium">{t('sync.pending', { count: pendingCount })}</p>
      ) : null}
    </Banner>
  );
}

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

const SYNC_STYLES: Record<SyncStatus, { Icon: LucideIcon; className: string; spin?: boolean }> = {
  synced: { Icon: CheckCircle2, className: 'bg-success-soft text-success' },
  syncing: { Icon: RefreshCw, className: 'bg-info-soft text-info', spin: true },
  pending: { Icon: RefreshCw, className: 'bg-warning-soft text-warning' },
  offline: { Icon: CloudOff, className: 'bg-bg-sunken text-text-muted' },
  error: { Icon: TriangleAlert, className: 'bg-danger-soft text-danger' },
};

/** Small status pill: icon plus words, so state never depends on colour. Clickable to open the sync inbox. */
export function SyncPill({
  status,
  pendingCount = 0,
  onClick,
}: {
  status: SyncStatus;
  pendingCount?: number;
  onClick?: () => void;
}) {
  const { t } = useTranslation();
  const { Icon, className, spin } = SYNC_STYLES[status];
  const content = (
    <>
      <Icon
        className={cn('size-4', spin && 'animate-spin motion-reduce:animate-none')}
        aria-hidden
      />
      {t(`sync.${status}`, { count: pendingCount })}
    </>
  );
  const styles = cn(
    'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium',
    className,
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={styles}>
      {content}
    </button>
  ) : (
    <span role="status" className={styles}>
      {content}
    </span>
  );
}
