'use client';

import {
  Banner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Field,
  FilteredEmptyState,
  KpiCard,
  NoPermissionState,
  NotFoundState,
  OfflineState,
  PageHeader,
  SkeletonChart,
  SkeletonForm,
  SkeletonKpiCard,
  SkeletonList,
  SkeletonRegion,
  SkeletonTable,
  StatusChip,
  TextInput,
  Textarea,
  type AnimalStatus,
} from '@dairy/ui';
import { Droplets, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DesignSystemExtras } from './design-system-extras';

const STATUSES: AnimalStatus[] = ['lactating', 'dry', 'pregnant', 'calf', 'sick', 'inactive'];

const SWATCHES = [
  'bg',
  'surface',
  'primary',
  'accent',
  'success',
  'warning',
  'danger',
  'info',
  'text',
  'text-muted',
  'border',
  'border-input',
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DesignSystemView() {
  const { t } = useTranslation();
  const [note, setNote] = useState('');

  return (
    <div className="space-y-6">
      <PageHeader title={t('ds.title')} subtitle={t('ds.subtitle')} />

      <Section title={t('ds.sectionButtons')}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">
            <Plus className="size-4" aria-hidden />
            {t('ds.buttonPrimary')}
          </Button>
          <Button>{t('ds.buttonSecondary')}</Button>
          <Button variant="ghost">{t('ds.buttonGhost')}</Button>
          <Button variant="danger">{t('ds.buttonDanger')}</Button>
          <Button variant="primary" loading loadingLabel={t('ds.buttonLoading')}>
            {t('ds.buttonLoading')}
          </Button>
          <Button disabled>{t('ds.buttonDisabled')}</Button>
        </div>
      </Section>

      <Section title={t('ds.sectionStatus')}>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <StatusChip key={status} status={status} />
          ))}
        </div>
      </Section>

      <Section title={t('ds.sectionKpi')}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label={t('dashboard.kpiMilk')}
            value="1,284.5"
            icon={Droplets}
            tint="blue"
            delta={{ percent: 5.2, direction: 'up', formatted: '5.2%' }}
            comparison={t('delta.comparison', { period: t('dashboard.comparisonYesterday') })}
            trend={[3, 4, 3.5, 5, 4.5, 6, 6.4]}
          />
          <KpiCard
            label={t('dashboard.kpiAlerts')}
            value="3"
            icon={Droplets}
            tint="rose"
            delta={{ percent: 20, direction: 'up', upIsGood: false, formatted: '20%' }}
            comparison={t('delta.comparison', { period: t('dashboard.comparisonLastWeek') })}
          />
          <SkeletonRegion>
            <SkeletonKpiCard />
          </SkeletonRegion>
        </div>
      </Section>

      <Section title={t('ds.sectionBanners')}>
        <div className="space-y-3">
          <Banner tone="info">{t('ds.bannerInfo')}</Banner>
          <Banner tone="success">{t('ds.bannerSuccess')}</Banner>
          <Banner tone="warning">{t('ds.bannerWarning')}</Banner>
          <Banner tone="danger" onDismiss={() => undefined}>
            {t('ds.bannerDanger')}
          </Banner>
        </div>
      </Section>

      <Section title={t('ds.sectionForm')}>
        <div className="grid max-w-3xl gap-5 md:grid-cols-2">
          <Field label={t('ds.fieldTagLabel')} helper={t('ds.fieldTagHelp')} required>
            <TextInput placeholder={t('ds.fieldTagPlaceholder')} dir="ltr" />
          </Field>
          <Field label={t('ds.fieldTagLabel')} error={t('ds.fieldTagError')} required>
            <TextInput defaultValue="PK 1042!" dir="ltr" />
          </Field>
          <Field label={t('ds.fieldLitresLabel')}>
            <TextInput
              inputMode="decimal"
              trailing={t('ds.fieldLitresUnit')}
              defaultValue="18.5"
              dir="ltr"
            />
          </Field>
          <Field
            label={t('ds.fieldNoteLabel')}
            helper={t('ds.fieldNoteHelp')}
            className="md:col-span-2"
          >
            <Textarea
              value={note}
              maxLength={500}
              onChange={(event) => {
                setNote(event.target.value);
              }}
            />
          </Field>
        </div>
      </Section>

      <DesignSystemExtras />

      <Section title={t('ds.sectionStates')}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <EmptyState
              compact
              title={t('ds.emptyTitle')}
              body={t('ds.emptyBody')}
              action={<Button variant="primary">{t('ds.emptyAction')}</Button>}
            />
          </Card>
          <Card>
            <FilteredEmptyState compact onClear={() => undefined} />
          </Card>
          <Card>
            <ErrorState compact requestId="7F3A-92" onRetry={() => undefined} />
          </Card>
          <Card>
            <OfflineState compact />
          </Card>
          <Card>
            <NoPermissionState compact />
          </Card>
          <Card>
            <NotFoundState compact />
          </Card>
        </div>
      </Section>

      <Section title={t('ds.skeleton')}>
        <SkeletonRegion className="grid gap-6 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonList />
          <SkeletonForm />
          <SkeletonTable rows={3} columns={4} />
        </SkeletonRegion>
      </Section>

      <Section title={t('ds.sectionColour')}>
        <p className="mb-4 text-sm text-text-muted">{t('ds.colourCaption')}</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SWATCHES.map((name) => (
            <li key={name} className="space-y-1.5">
              <span
                className="block h-12 rounded-md border border-border"
                style={{ backgroundColor: `var(--color-${name})` }}
              />
              <span className="block font-mono text-xs text-text-muted" dir="ltr">
                {`--color-${name}`}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
