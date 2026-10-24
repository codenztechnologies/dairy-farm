'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  ConfirmDialog,
  DataTable,
  Dialog,
  DonutCard,
  Field,
  ListCard,
  MoneyInput,
  NumberInput,
  RadioPills,
  Select,
  SessionsChart,
  Sheet,
  StatusChip,
  Switch,
  Textarea,
  dataTableColumns,
  toast,
  type AnimalStatus,
} from '@dairy/ui';
import { CalendarDays, Syringe } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface SampleAnimal {
  id: string;
  tag: string;
  name: string;
  status: AnimalStatus;
  yield: number;
}

const STATUSES: AnimalStatus[] = ['lactating', 'dry', 'pregnant', 'calf', 'sick', 'inactive'];
const NAMES = ['Rani', 'Lali', 'Noori', 'Chandni', 'Gulabo', 'Mehek'];
const SAMPLE: SampleAnimal[] = Array.from({ length: 23 }, (_, i) => ({
  id: `a${String(i)}`,
  tag: `PK-${String(1000 + i * 7)}`,
  name: NAMES[i % NAMES.length] ?? 'Rani',
  status: STATUSES[i % STATUSES.length] ?? 'lactating',
  yield: Math.round((8 + ((i * 37) % 14) + (i % 3) * 0.5) * 10) / 10,
}));

const col = dataTableColumns<SampleAnimal>();
const DAYS = ['1', '2', '3', '4', '5', '6', '7'];
const MORNING = [120, 132, 128, 140, 135, 142, 150];
const NOON = [60, 64, 66, 70, 68, 72, 75];
const EVENING = [110, 118, 115, 125, 122, 130, 134];

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

export function DesignSystemExtras() {
  const { t } = useTranslation();
  const [group, setGroup] = useState<string | undefined>();
  const [sold, setSold] = useState(false);
  const [daily, setDaily] = useState(true);
  const [sex, setSex] = useState<string | undefined>('female');
  const [price, setPrice] = useState('120.50');
  const [weight, setWeight] = useState('412.5');
  const [note, setNote] = useState('');
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sheet, setSheet] = useState(false);

  const columns = col.columns([
    col.accessor('tag', {
      header: t('ds.colTag'),
      cell: (info) => <span dir="ltr">{info.getValue()}</span>,
    }),
    col.accessor('name', { header: t('ds.colName') }),
    col.accessor('status', {
      header: t('ds.colStatus'),
      enableSorting: false,
      cell: (info) => <StatusChip status={info.getValue()} />,
    }),
    col.accessor('yield', {
      header: t('ds.colYield'),
      cell: (info) => <span dir="ltr">{info.getValue().toFixed(1)}</span>,
    }),
  ]);

  return (
    <>
      <Section title={t('ds.sectionControls')}>
        <div className="grid max-w-3xl gap-5 md:grid-cols-2">
          <Field label={t('ds.selectLabel')} required>
            <Select
              value={group}
              onValueChange={setGroup}
              placeholder={t('ds.selectPlaceholder')}
              options={[
                { value: 'dry', label: t('ds.groupDry') },
                { value: 'lactating', label: t('ds.groupLactating') },
                { value: 'calves', label: t('ds.groupCalves') },
              ]}
            />
          </Field>
          <Field label={t('ds.sexLabel')}>
            <RadioPills
              label={t('ds.sexLabel')}
              value={sex}
              onValueChange={setSex}
              options={[
                { value: 'female', label: t('ds.sexFemale') },
                { value: 'male', label: t('ds.sexMale') },
                { value: 'unknown', label: t('ds.sexUnknown') },
              ]}
            />
          </Field>
          <Field label={t('ds.priceLabel')}>
            <MoneyInput currency="Rs" value={price} onValueChange={setPrice} />
          </Field>
          <Field label={t('ds.weightLabel')}>
            <NumberInput value={weight} onValueChange={setWeight} trailing="kg" />
          </Field>
          <Checkbox checked={sold} onCheckedChange={setSold} label={t('ds.checkboxLabel')} />
          <Switch checked={daily} onCheckedChange={setDaily} label={t('ds.switchLabel')} />
          <Field label={t('ds.fieldNoteLabel')} className="md:col-span-2">
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

      <Section title={t('ds.sectionOverlays')}>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setDialog(true);
            }}
          >
            {t('ds.openDialog')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirm(true);
            }}
          >
            {t('ds.openConfirm')}
          </Button>
          <Button
            onClick={() => {
              setSheet(true);
            }}
          >
            {t('ds.openSheet')}
          </Button>
          <Button
            onClick={() => {
              toast({ title: t('ds.toastSaved'), description: t('ds.toastSavedBody') });
            }}
          >
            {t('ds.showToast')}
          </Button>
          <Button
            onClick={() => {
              toast({
                tone: 'danger',
                title: t('ds.toastFailed'),
                description: t('ds.toastFailedBody'),
              });
            }}
          >
            {t('ds.showErrorToast')}
          </Button>
        </div>
        <Dialog
          open={dialog}
          onOpenChange={setDialog}
          title={t('ds.dialogTitle')}
          description={t('ds.dialogBody')}
          footer={
            <>
              <Button
                onClick={() => {
                  setDialog(false);
                }}
              >
                {t('actions.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setDialog(false);
                }}
              >
                {t('actions.save')}
              </Button>
            </>
          }
        >
          <Field label={t('ds.fieldNoteLabel')}>
            <Textarea />
          </Field>
        </Dialog>
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title={t('ds.confirmTitle')}
          description={t('ds.confirmBody')}
          confirmLabel={t('ds.confirmAction')}
          onConfirm={() => {
            setConfirm(false);
          }}
        />
        <Sheet
          open={sheet}
          onOpenChange={setSheet}
          title={t('ds.sheetTitle')}
          description={t('ds.sheetBody')}
          footer={
            <Button
              variant="primary"
              onClick={() => {
                setSheet(false);
              }}
            >
              {t('actions.save')}
            </Button>
          }
        >
          <StatusChip status="lactating" />
        </Sheet>
      </Section>

      <Section title={t('ds.sectionTable')}>
        <DataTable
          label={t('ds.tableLabel')}
          data={SAMPLE}
          columns={columns}
          getRowId={(row) => row.id}
          selectable
        />
      </Section>

      <Section title={t('ds.sectionCharts')}>
        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <h3 className="mb-2 text-base font-semibold text-text">{t('ds.chartMilkTitle')}</h3>
            <SessionsChart
              categories={DAYS}
              morning={MORNING}
              noon={NOON}
              evening={EVENING}
              labels={{
                morning: t('ds.sessionMorning'),
                noon: t('ds.sessionNoon'),
                evening: t('ds.sessionEvening'),
                total: t('chart.total'),
              }}
              chartLabel={t('ds.chartMilkTitle')}
            />
          </div>
          <DonutCard
            title={t('ds.herdTitle')}
            chartLabel={t('ds.herdTitle')}
            total={{ value: '186', label: t('ds.herdTotal') }}
            slices={[
              {
                id: 'lactating',
                label: t('status.lactating'),
                value: 98,
                formatted: '98',
                percent: '52.7%',
              },
              { id: 'dry', label: t('status.dry'), value: 34, formatted: '34', percent: '18.3%' },
              {
                id: 'pregnant',
                label: t('status.pregnant'),
                value: 28,
                formatted: '28',
                percent: '15.1%',
              },
              { id: 'calf', label: t('status.calf'), value: 18, formatted: '18', percent: '9.7%' },
              {
                id: 'other',
                label: t('status.inactive'),
                value: 8,
                formatted: '8',
                percent: '4.3%',
              },
            ]}
          />
          <ListCard
            title={t('ds.eventsTitle')}
            items={[
              {
                id: 'e1',
                title: t('ds.eventCalving'),
                subtitle: t('ds.eventSubtitle'),
                icon: CalendarDays,
                tint: 'violet',
                date: { month: 'Oct', day: '28' },
              },
              {
                id: 'e2',
                title: t('ds.eventVaccine'),
                subtitle: t('ds.eventSubtitle'),
                icon: Syringe,
                tint: 'green',
                date: { month: 'Nov', day: '02' },
              },
            ]}
          />
        </div>
      </Section>
    </>
  );
}
