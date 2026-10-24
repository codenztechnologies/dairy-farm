'use client';

import {
  Accordion,
  Banner,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  DatePicker,
  Field,
  FileUpload,
  FormSummary,
  HealthScoreRing,
  MiniTable,
  MultiSelect,
  OfflineBanner,
  PhoneInput,
  Popover,
  SectionHeader,
  Stepper,
  SyncPill,
  TimePicker,
  Timeline,
  StatusChip,
  type ComboOption,
  type SyncStatus,
} from '@dairy/ui';
import { Baby, HeartPulse, Syringe } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const ANIMALS: readonly ComboOption[] = [
  { value: 'a1', label: 'PK-1042 Rani', hint: 'Lactating herd' },
  { value: 'a2', label: 'PK-1049 Lali', hint: 'Dry cows' },
  { value: 'a3', label: 'PK-1056 Noori', hint: 'Lactating herd' },
  { value: 'a4', label: 'PK-1063 Chandni', hint: 'Calves' },
];

const GROUPS: readonly ComboOption[] = [
  { value: 'g1', label: 'Lactating herd' },
  { value: 'g2', label: 'Dry cows' },
  { value: 'g3', label: 'Calves' },
  { value: 'g4', label: 'Sick pen' },
];

const TOP = [
  { id: 't1', tag: 'PK-1042', average: '24.5' },
  { id: 't2', tag: 'PK-1056', average: '22.1' },
  { id: 't3', tag: 'PK-1070', average: '21.8' },
];

const SYNC: readonly SyncStatus[] = ['synced', 'syncing', 'pending', 'offline', 'error'];

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

export function DesignSystemSlice3({ onOpenPalette }: { onOpenPalette: () => void }) {
  const { t } = useTranslation();
  const [date, setDate] = useState<string | undefined>();
  const [time, setTime] = useState('06:30');
  const [phone, setPhone] = useState('');
  const [animal, setAnimal] = useState<string | undefined>();
  const [groups, setGroups] = useState<string[]>(['g1']);
  const [files, setFiles] = useState<File[]>([]);

  // Stand-in for a server search: resolves after a short delay, like the real animal picker will.
  const search = useCallback(async (query: string): Promise<readonly ComboOption[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const q = query.trim().toLowerCase();
    return ANIMALS.filter((a) => `${a.label} ${a.hint ?? ''}`.toLowerCase().includes(q));
  }, []);

  return (
    <>
      <Section title={t('ds.sectionPickers')}>
        <div className="grid max-w-3xl gap-5 md:grid-cols-2">
          <Field label={t('ds.dateLabel')}>
            <DatePicker
              value={date}
              onValueChange={setDate}
              placeholder={t('ds.datePlaceholder')}
              max="2030-12-31"
            />
          </Field>
          <Field label={t('ds.timeLabel')}>
            <TimePicker value={time} onValueChange={setTime} />
          </Field>
          <Field label={t('ds.phoneLabel')}>
            <PhoneInput value={phone} onValueChange={setPhone} />
          </Field>
          <Field label={t('ds.comboLabel')}>
            <Combobox
              value={animal}
              onValueChange={setAnimal}
              placeholder={t('ds.comboPlaceholder')}
              searchPlaceholder={t('ds.comboSearch')}
              loadOptions={search}
            />
          </Field>
          <Field label={t('ds.multiLabel')} className="md:col-span-2">
            <MultiSelect
              value={groups}
              onValueChange={setGroups}
              placeholder={t('ds.multiPlaceholder')}
              searchPlaceholder={t('ds.comboSearch')}
              options={GROUPS}
            />
          </Field>
          <Field label={t('ds.uploadLabel')} className="md:col-span-2">
            <FileUpload files={files} onFilesChange={setFiles} accept="image/*" maxFiles={4} />
          </Field>
        </div>
        <p className="mt-4 font-mono text-sm text-text-muted" dir="ltr">
          {date ?? '-'} · {time} · {phone || '-'}
        </p>
      </Section>

      <Section title={t('ds.sectionNavigation')}>
        <div className="space-y-6">
          <Stepper
            current={1}
            steps={[
              { id: 's1', label: t('ds.stepBasics') },
              { id: 's2', label: t('ds.stepStatus') },
              { id: 's3', label: t('ds.stepParents') },
            ]}
          />
          <div className="space-y-3">
            <SectionHeader number={1} title={t('ds.sectionBasic')} />
            <SectionHeader number={2} title={t('ds.sectionParentage')} optional />
          </div>
          <FormSummary
            issues={[
              { fieldId: 'tag', label: t('ds.summaryOne'), message: t('ds.summaryOneMsg') },
              { fieldId: 'yield', label: t('ds.summaryTwo'), message: t('ds.summaryTwoMsg') },
            ]}
          />
          <Accordion
            items={[
              { value: 'one', title: t('ds.faqOne'), content: t('ds.faqOneBody') },
              { value: 'two', title: t('ds.faqTwo'), content: t('ds.faqTwoBody') },
            ]}
          />
          <Popover
            trigger={<Button>{t('ds.openPopover')}</Button>}
            className="w-72 p-4"
            align="start"
          >
            <p className="text-sm text-text-muted">{t('ds.popoverBody')}</p>
          </Popover>
        </div>
      </Section>

      <Section title={t('ds.sectionInsights')}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-base font-semibold text-text">{t('ds.healthTitle')}</h3>
            <div className="flex gap-4">
              <HealthScoreRing score={86} label={t('ds.healthTitle')} />
              <HealthScoreRing score={61} label={t('ds.healthTitle')} />
              <HealthScoreRing score={34} label={t('ds.healthTitle')} />
            </div>
          </div>
          <MiniTable
            title={t('ds.topTitle')}
            rows={TOP}
            getRowId={(row) => row.id}
            columns={[
              {
                key: 'animal',
                label: t('ds.colAnimal'),
                render: (row) => <span dir="ltr">{row.tag}</span>,
              },
              {
                key: 'avg',
                label: t('ds.colAverage'),
                numeric: true,
                render: (row) => <span dir="ltr">{row.average}</span>,
              },
            ]}
          />
          <div>
            <h3 className="mb-3 text-base font-semibold text-text">{t('ds.timelineTitle')}</h3>
            <Timeline
              events={[
                { id: 'v1', title: t('ds.timelineCalving'), time: '24 Oct, 06:10', icon: Baby },
                { id: 'v2', title: t('ds.timelineVaccine'), time: '12 Oct', icon: Syringe },
                { id: 'v3', title: t('ds.timelineHeat'), time: '2 Oct', icon: HeartPulse },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title={t('ds.sectionSync')}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {SYNC.map((status) => (
              <SyncPill key={status} status={status} pendingCount={3} />
            ))}
          </div>
          <OfflineBanner pendingCount={3} />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={onOpenPalette}>{t('ds.openPalette')}</Button>
            <StatusChip status="sick" />
          </div>
          <Banner tone="info">{t('palette.noResults')}</Banner>
        </div>
      </Section>
    </>
  );
}
