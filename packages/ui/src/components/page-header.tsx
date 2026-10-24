import { cn } from '../lib/cn';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: ReactNode;
  /** Right-aligned actions: one primary button, the rest secondary. */
  actions?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-1 text-sm text-text-muted">{breadcrumb}</div> : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold leading-tight text-text">{title}</h1>
          {badge}
        </div>
        {subtitle ? <p className="mt-1 text-base text-text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
