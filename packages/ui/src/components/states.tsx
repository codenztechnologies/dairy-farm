import {
  FileQuestion,
  Inbox,
  Lock,
  SearchX,
  ServerCrash,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Button } from './button';
import type { ReactNode } from 'react';

interface StateLayoutProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  /** Short machine reference shown to users so they can quote it to support. */
  footer?: ReactNode;
  actions?: ReactNode;
  tone?: 'neutral' | 'danger';
  /** Compact variant for use inside cards. */
  compact?: boolean;
  role?: 'alert' | 'status';
  className?: string;
}

function StateLayout({
  icon: Icon,
  title,
  body,
  footer,
  actions,
  tone = 'neutral',
  compact = false,
  role,
  className,
}: StateLayoutProps) {
  return (
    <div
      role={role}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-16',
        className,
      )}
    >
      <span
        className={cn(
          'grid size-14 place-items-center rounded-full',
          tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-bg-sunken text-text-muted',
        )}
      >
        <Icon className="size-7" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      {body ? <p className="max-w-md text-base text-text-muted">{body}</p> : null}
      {actions ? <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div> : null}
      {footer ? <p className="mt-2 font-mono text-sm text-text-subtle">{footer}</p> : null}
    </div>
  );
}

type CommonProps = Pick<StateLayoutProps, 'compact' | 'className'>;

export interface EmptyStateProps extends CommonProps {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}

/** First-use empty: explains what belongs here and offers the next step. */
export function EmptyState({ title, body, action, icon = Inbox, ...rest }: EmptyStateProps) {
  return (
    <StateLayout icon={icon} title={title} {...(body ? { body } : {})} actions={action} {...rest} />
  );
}

export interface FilteredEmptyStateProps extends CommonProps {
  onClear: () => void;
}

/** Filters/search returned nothing: offers to clear them. */
export function FilteredEmptyState({ onClear, ...rest }: FilteredEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <StateLayout
      icon={SearchX}
      title={t('state.filteredEmptyTitle')}
      body={t('state.filteredEmptyBody')}
      actions={<Button onClick={onClear}>{t('actions.clearFilters')}</Button>}
      {...rest}
    />
  );
}

export interface ErrorStateProps extends CommonProps {
  title?: string;
  message?: string;
  /** Server request id (from the problem+json response) so support can find the failure. */
  requestId?: string;
  onRetry?: () => void;
  retrying?: boolean;
}

/** Load failure: says what happened, how to recover, and quotes the request id. */
export function ErrorState({
  title,
  message,
  requestId,
  onRetry,
  retrying = false,
  ...rest
}: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <StateLayout
      role="alert"
      tone="danger"
      icon={ServerCrash}
      title={title ?? t('state.errorTitle')}
      body={message ?? t('state.errorBody')}
      actions={
        onRetry ? (
          <Button variant="primary" onClick={onRetry} loading={retrying}>
            {t('actions.retry')}
          </Button>
        ) : undefined
      }
      footer={requestId ? t('state.requestId', { id: requestId }) : undefined}
      {...rest}
    />
  );
}

export function OfflineState(props: CommonProps & { onRetry?: () => void }) {
  const { t } = useTranslation();
  const { onRetry, ...rest } = props;
  return (
    <StateLayout
      role="status"
      icon={WifiOff}
      title={t('state.offlineTitle')}
      body={t('state.offlineBody')}
      actions={onRetry ? <Button onClick={onRetry}>{t('actions.retry')}</Button> : undefined}
      {...rest}
    />
  );
}

export function NoPermissionState(props: CommonProps & { action?: ReactNode }) {
  const { t } = useTranslation();
  const { action, ...rest } = props;
  return (
    <StateLayout
      icon={Lock}
      title={t('state.noPermissionTitle')}
      body={t('state.noPermissionBody')}
      actions={action}
      {...rest}
    />
  );
}

export function NotFoundState(props: CommonProps & { action?: ReactNode }) {
  const { t } = useTranslation();
  const { action, ...rest } = props;
  return (
    <StateLayout
      icon={FileQuestion}
      title={t('state.notFoundTitle')}
      body={t('state.notFoundBody')}
      actions={action}
      {...rest}
    />
  );
}
