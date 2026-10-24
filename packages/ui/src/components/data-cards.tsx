import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Chart } from '../charts/chart';
import { cn } from '../lib/cn';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { IconTile, type Tint } from './kpi-card';
import { Skeleton, SkeletonList, SkeletonRegion } from './skeleton';
import type { LucideIcon } from 'lucide-react';

// DonutCard -------------------------------------------------------------------------------------

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  /** Pre-formatted value, e.g. "128 L". */
  formatted: string;
  /** Pre-formatted share, e.g. "68.8%". */
  percent: string;
}

interface DonutCardProps {
  title: string;
  slices: readonly DonutSlice[];
  /** Centre text: the total and what it counts. */
  total: { value: string; label: string };
  /** Accessible chart description. */
  chartLabel: string;
  action?: ReactNode;
  loading?: boolean;
  className?: string;
}

/** Donut with centre total and a legend list (the list is also the text alternative for the chart). */
export function DonutCard({
  title,
  slices,
  total,
  chartLabel,
  action,
  loading,
  className,
}: DonutCardProps) {
  const { t } = useTranslation();
  // Pie/donut is only readable up to five categories (docs/04 section 4); extra data belongs in "Others".
  const shown = slices.slice(0, 5);
  const option = useMemo(
    () => ({
      tooltip: { trigger: 'item' as const, formatter: '{b}: {c} ({d}%)' },
      series: [
        {
          type: 'pie' as const,
          radius: ['62%', '88%'],
          avoidLabelOverlap: true,
          label: { show: false },
          itemStyle: { borderWidth: 3, borderColor: 'transparent' },
          data: shown.map((slice) => ({ name: slice.label, value: slice.value })),
        },
      ],
    }),
    [shown],
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? (
          <SkeletonRegion className="flex items-center gap-6">
            <Skeleton className="size-40 shrink-0 rounded-full" />
            <SkeletonList rows={4} />
          </SkeletonRegion>
        ) : shown.length === 0 ? (
          <p className="py-10 text-center text-text-muted">{t('chart.empty')}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative size-44 shrink-0">
              <Chart option={option} label={chartLabel} height={176} />
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-2xl font-semibold leading-tight text-text" dir="auto">
                    {total.value}
                  </p>
                  <p className="text-sm text-text-muted">{total.label}</p>
                </div>
              </div>
            </div>
            <ul className="min-w-48 flex-1 space-y-3">
              {shown.map((slice, index) => (
                <li key={slice.id} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-xs"
                    style={{ backgroundColor: `var(--chart-${String(index + 1)})` }}
                  />
                  <span className="flex-1 text-text">{slice.label}</span>
                  <span className="font-medium text-text" dir="auto">
                    {slice.formatted}
                  </span>
                  <span className="w-14 text-end text-text-muted" dir="auto">
                    {slice.percent}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ListCard + DateTile ---------------------------------------------------------------------------

export interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tint?: Tint;
  /** Date tile instead of an icon (events). */
  date?: { month: string; day: string };
  /** Right side: time, status chip, amount. */
  trailing?: ReactNode;
}

/** Month over day, as on the dashboard "Upcoming events" list. */
export function DateTile({
  month,
  day,
  className,
}: {
  month: string;
  day: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'grid size-12 shrink-0 place-items-center rounded-md bg-tint-blue-bg text-center leading-tight text-tint-blue-fg',
        className,
      )}
    >
      <span>
        <span className="block text-xs font-semibold uppercase">{month}</span>
        <span className="block text-lg font-bold">{day}</span>
      </span>
    </span>
  );
}

interface ListCardProps {
  title: string;
  items: readonly ListItem[];
  action?: ReactNode;
  loading?: boolean;
  /** Shown when there are no items (use EmptyState compact). */
  empty?: ReactNode;
  className?: string;
}

export function ListCard({ title, items, action, loading, empty, className }: ListCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? (
          <SkeletonRegion>
            <SkeletonList rows={3} />
          </SkeletonRegion>
        ) : items.length === 0 ? (
          empty
        ) : (
          <ul className="divide-y divide-divider">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {item.date ? (
                  <DateTile month={item.date.month} day={item.date.day} />
                ) : item.icon ? (
                  <IconTile icon={item.icon} tint={item.tint ?? 'slate'} />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-text">{item.title}</p>
                  {item.subtitle ? (
                    <p className="truncate text-sm text-text-muted">{item.subtitle}</p>
                  ) : null}
                </div>
                {item.trailing ? (
                  <div className="shrink-0 text-sm text-text-muted">{item.trailing}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
