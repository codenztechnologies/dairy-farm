'use client';

import {
  Banner,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  KpiCard,
  PageHeader,
} from '@dairy/ui';
import { AlertTriangle, Beef, CalendarDays, CheckSquare, Droplets, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Locale } from '@dairy/i18n';

// Sample data only: real figures come from the milk, herd and finance modules (Phase 1).
const SAMPLE = {
  farm: 'Green Valley Dairy',
  user: 'Ali',
  milkLitres: 1284.5,
  milkDeltaPercent: 5.2,
  milkTrend: [980, 1010, 1100, 1060, 1150, 1220, 1284.5],
  cash: 412300,
  cashDeltaPercent: 2.1,
  animals: 186,
  tasks: 12,
  alerts: 3,
  events: 7,
} as const;

function greetingKey(hour: number) {
  if (hour < 12) return 'dashboard.greetingMorning';
  if (hour < 18) return 'dashboard.greetingAfternoon';
  return 'dashboard.greetingEvening';
}

export function DashboardView({ locale, hour }: { locale: Locale; hour: number }) {
  const { t } = useTranslation();
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
  const money = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(greetingKey(hour), { name: SAMPLE.user })}
        subtitle={t('dashboard.subtitle', { farm: SAMPLE.farm })}
        badge={
          <span className="rounded-full bg-tint-amber-bg px-2.5 py-1 text-sm font-medium text-tint-amber-fg">
            {t('dashboard.sampleBadge')}
          </span>
        }
      />

      <Banner tone="info">{t('dashboard.sampleNote')}</Banner>

      <section
        aria-label={t('dashboard.todayTitle')}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <KpiCard
          label={t('dashboard.kpiMilk')}
          value={`${number.format(SAMPLE.milkLitres)} ${t('dashboard.unitLitres')}`}
          icon={Droplets}
          tint="blue"
          delta={{
            percent: SAMPLE.milkDeltaPercent,
            direction: 'up',
            formatted: percent.format(SAMPLE.milkDeltaPercent / 100),
          }}
          comparison={t('delta.comparison', { period: t('dashboard.comparisonYesterday') })}
          trend={SAMPLE.milkTrend}
        />
        <KpiCard
          label={t('dashboard.kpiCash')}
          value={money.format(SAMPLE.cash)}
          icon={Wallet}
          tint="green"
          delta={{
            percent: SAMPLE.cashDeltaPercent,
            direction: 'up',
            formatted: percent.format(SAMPLE.cashDeltaPercent / 100),
          }}
          comparison={t('delta.comparison', { period: t('dashboard.comparisonLastWeek') })}
        />
        <KpiCard
          label={t('dashboard.kpiAnimals')}
          value={number.format(SAMPLE.animals)}
          icon={Beef}
          tint="amber"
        />
        <KpiCard
          label={t('dashboard.kpiTasks')}
          value={number.format(SAMPLE.tasks)}
          icon={CheckSquare}
          tint="violet"
        />
        <KpiCard
          label={t('dashboard.kpiAlerts')}
          value={number.format(SAMPLE.alerts)}
          icon={AlertTriangle}
          tint="rose"
        />
        <KpiCard
          label={t('dashboard.kpiEvents')}
          value={number.format(SAMPLE.events)}
          icon={CalendarDays}
          tint="blue"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.alertsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            compact
            title={t('dashboard.alertsEmptyTitle')}
            body={t('dashboard.alertsEmptyBody')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
