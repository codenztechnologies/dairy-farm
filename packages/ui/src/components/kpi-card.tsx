import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Card } from './card';

export type Tint = 'green' | 'blue' | 'amber' | 'violet' | 'rose' | 'slate';

const TINTS: Record<Tint, string> = {
  green: 'bg-tint-green-bg text-tint-green-fg',
  blue: 'bg-tint-blue-bg text-tint-blue-fg',
  amber: 'bg-tint-amber-bg text-tint-amber-fg',
  violet: 'bg-tint-violet-bg text-tint-violet-fg',
  rose: 'bg-tint-rose-bg text-tint-rose-fg',
  slate: 'bg-tint-slate-bg text-tint-slate-fg',
};

/** Soft coloured square holding an icon: gives each metric its own identity. */
export function IconTile({
  icon: Icon,
  tint,
  className,
}: {
  icon: LucideIcon;
  tint: Tint;
  className?: string;
}) {
  return (
    <span
      className={cn('grid size-12 shrink-0 place-items-center rounded-md', TINTS[tint], className)}
    >
      <Icon className="size-6" aria-hidden />
    </span>
  );
}

export interface Delta {
  /** Absolute change in percent, e.g. 5.2. The sign comes from `direction`. */
  percent: number;
  direction: 'up' | 'down' | 'flat';
  /** Whether "up" is good news. Cost going up is bad, so pass false for costs. */
  upIsGood?: boolean;
  /** Pre-formatted number, e.g. "5.2%" (formatters come from @dairy/i18n). */
  formatted: string;
}

/** Arrow + number, never colour alone. */
export function DeltaBadge({ delta }: { delta: Delta }) {
  const { t } = useTranslation();
  const { direction, upIsGood = true, formatted, percent } = delta;
  const good = direction === 'flat' ? null : direction === 'up' ? upIsGood : !upIsGood;
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;
  const label =
    direction === 'flat'
      ? t('delta.flat')
      : t(direction === 'up' ? 'delta.up' : 'delta.down', { percent });
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-sm font-semibold',
        good === null ? 'text-text-muted' : good ? 'text-success' : 'text-danger',
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span aria-hidden>{formatted}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Tiny trend line. Decorative: the value and delta carry the information. */
export function Sparkline({
  values,
  className,
}: {
  values: readonly number[];
  className?: string;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`)
    .join(' ');
  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      aria-hidden
      className={cn('h-8 w-full', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export interface KpiCardProps {
  label: string;
  /** Pre-formatted value, e.g. "1,284.5 L". Numbers lead: it is the largest text on the card. */
  value: string;
  icon: LucideIcon;
  tint: Tint;
  delta?: Delta;
  /** Comparison wording, e.g. "vs yesterday". */
  comparison?: string;
  trend?: readonly number[];
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon,
  tint,
  delta,
  comparison,
  trend,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('flex flex-col gap-3 p-5', className)}>
      <div className="flex items-start gap-4">
        <IconTile icon={icon} tint={tint} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="mt-1 text-3xl font-semibold leading-tight text-text" dir="auto">
            {value}
          </p>
        </div>
      </div>
      {delta || comparison ? (
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-text-muted">
          {delta ? <DeltaBadge delta={delta} /> : null}
          {comparison ? <span>{comparison}</span> : null}
        </p>
      ) : null}
      {trend ? <Sparkline values={trend} className="text-accent" /> : null}
    </Card>
  );
}
