import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Card, CardContent } from './card';
import type { ComponentProps } from 'react';

/** A single placeholder block. Pulse stops under reduced motion. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse rounded-sm bg-skeleton-base motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}

/** Wraps skeletons so assistive tech hears one "Loading" instead of many empty blocks. */
export function SkeletonRegion({ className, children, ...props }: ComponentProps<'div'>) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('state.loading')}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonKpiCard() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <Skeleton className="size-12 shrink-0 rounded-md" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SkeletonTable({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex gap-4 border-b border-border bg-bg-sunken px-4 py-3">
        {Array.from({ length: columns }, (_, c) => (
          <Skeleton key={c} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-4 border-b border-border px-4 py-4 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-56 items-end gap-2', className)}>
      {[40, 65, 50, 80, 60, 90, 70].map((height, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-(--control-height-md) w-full" />
        </div>
      ))}
    </div>
  );
}
