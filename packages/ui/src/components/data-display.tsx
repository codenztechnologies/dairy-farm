import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// MiniTable: compact top-N list inside a card --------------------------------------------------

interface MiniTableProps<T> {
  title: string;
  columns: readonly {
    key: string;
    label: string;
    numeric?: boolean;
    render: (row: T) => ReactNode;
  }[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  action?: ReactNode;
  empty?: ReactNode;
  className?: string;
}

export function MiniTable<T>({
  title,
  columns,
  rows,
  getRowId,
  action,
  empty,
  className,
}: MiniTableProps<T>) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="pt-3">
        {rows.length === 0 ? (
          empty
        ) : (
          <table className="w-full text-start text-sm" aria-label={title}>
            <thead>
              <tr className="text-text-muted">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn('pb-2 font-medium', column.numeric ? 'text-end' : 'text-start')}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={getRowId(row)} className="border-t border-divider">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('py-2.5 text-text', column.numeric ? 'text-end' : 'text-start')}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

// HealthScoreRing --------------------------------------------------------------------------------

type Band = 'good' | 'fair' | 'poor';

function bandOf(score: number): Band {
  if (score >= 75) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

const BAND_STYLES: Record<Band, { stroke: string; text: string }> = {
  good: { stroke: 'text-success', text: 'text-success' },
  fair: { stroke: 'text-warning', text: 'text-warning' },
  poor: { stroke: 'text-danger', text: 'text-danger' },
};

/** Ring gauge for the farm health score. The band is always written out, never colour alone. */
export function HealthScoreRing({
  score,
  label,
  className,
}: {
  /** 0 to 100. */
  score: number;
  /** Accessible name, e.g. "Farm health score". */
  label: string;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = bandOf(clamped);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const number = new Intl.NumberFormat(i18n.language);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-valuetext={`${number.format(clamped)}, ${t(`healthScore.${band}`)}`}
      className={cn('relative size-32', className)}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-bg-sunken"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${String((clamped / 100) * circumference)} ${String(circumference)}`}
          className={cn(
            'stroke-current transition-[stroke-dasharray] duration-(--duration-slow) motion-reduce:transition-none',
            BAND_STYLES[band].stroke,
          )}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-3xl font-bold leading-none text-text">{number.format(clamped)}</p>
          <p className={cn('mt-1 text-sm font-semibold', BAND_STYLES[band].text)}>
            {t(`healthScore.${band}`)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Timeline ---------------------------------------------------------------------------------------

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  /** Pre-formatted date/time. */
  time: string;
  icon: LucideIcon;
}

export function Timeline({
  events,
  className,
}: {
  events: readonly TimelineEvent[];
  className?: string;
}) {
  return (
    <ol className={cn('relative space-y-6', className)}>
      {events.map((event, index) => {
        const Icon = event.icon;
        return (
          <li key={event.id} className="relative flex gap-4">
            {index < events.length - 1 ? (
              <span aria-hidden className="absolute start-5 top-10 -bottom-6 w-px bg-border" />
            ) : null}
            <span className="relative grid size-10 shrink-0 place-items-center rounded-full border border-border bg-surface text-text-muted">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-base font-medium text-text">{event.title}</p>
              {event.description ? (
                <p className="text-sm text-text-muted">{event.description}</p>
              ) : null}
              <p className="mt-0.5 text-sm text-text-subtle">{event.time}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
