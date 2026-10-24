'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableToolbar,
  EmptyState,
  FilteredEmptyState,
  Select,
  StatusChip,
  dataTableColumns,
  downloadCsv,
  toCsv,
  type AnimalStatus,
  type ServerTableState,
} from '@dairy/ui';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Animal {
  id: string;
  tag: string;
  name: string;
  status: AnimalStatus;
  yield: number;
}

const STATUSES: AnimalStatus[] = ['lactating', 'dry', 'pregnant', 'calf', 'sick', 'inactive'];
const NAMES = ['Rani', 'Lali', 'Noori', 'Chandni', 'Gulabo', 'Mehek'];
const ALL: Animal[] = Array.from({ length: 95 }, (_, i) => ({
  id: `x${String(i)}`,
  tag: `PK-${String(2000 + i)}`,
  name: NAMES[i % NAMES.length] ?? 'Rani',
  status: STATUSES[i % STATUSES.length] ?? 'lactating',
  yield: Math.round((6 + ((i * 53) % 190) / 10) * 10) / 10,
}));

const col = dataTableColumns<Animal>();

/** Stand-in for GET /v1/animals: filters, sorts and slices on "the server", after a delay. */
function fakeServer(state: ServerTableState): Promise<{ rows: Animal[]; total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const [sort] = state.sorting;
      const sorted = sort
        ? [...ALL].sort((a, b) => {
            const left = a[sort.id as keyof Animal];
            const right = b[sort.id as keyof Animal];
            const order = left < right ? -1 : left > right ? 1 : 0;
            return sort.desc ? -order : order;
          })
        : ALL;
      const start = state.pageIndex * state.pageSize;
      resolve({ rows: sorted.slice(start, start + state.pageSize), total: ALL.length });
    }, 600);
  });
}

export function DesignSystemTable() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [server, setServer] = useState<ServerTableState>({
    pageIndex: 0,
    pageSize: 10,
    sorting: [],
  });
  // The last answer, tagged with the table state it answers. "Refreshing" is derived from it,
  // so no state is set inside the effect body.
  const [page, setPage] = useState<{ rows: Animal[]; total: number; answered: ServerTableState }>();
  const refreshing = page !== undefined && page.answered !== server;

  useEffect(() => {
    let cancelled = false;
    void fakeServer(server).then((result) => {
      if (!cancelled) setPage({ ...result, answered: server });
    });
    return () => {
      cancelled = true;
    };
  }, [server]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL.filter(
      (a) =>
        (status === 'all' || a.status === status) &&
        (q === '' || `${a.tag} ${a.name}`.toLowerCase().includes(q)),
    );
  }, [search, status]);

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

  function clear() {
    setSearch('');
    setStatus('all');
  }

  function exportCsv() {
    downloadCsv(
      'animals',
      toCsv(
        [
          { header: t('ds.colTag'), value: (a: Animal) => a.tag },
          { header: t('ds.colName'), value: (a: Animal) => a.name },
          { header: t('ds.colStatus'), value: (a: Animal) => t(`status.${a.status}`) },
          { header: t('ds.colYield'), value: (a: Animal) => a.yield },
        ],
        filtered,
      ),
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('ds.sectionTableExtras')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTableToolbar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: t('ds.searchAnimals'),
            }}
            activeCount={(search ? 1 : 0) + (status === 'all' ? 0 : 1)}
            onClear={clear}
            actions={
              <Button onClick={exportCsv} disabled={filtered.length === 0}>
                <Download className="size-4" aria-hidden />
                {t('table.exportCsv')}
              </Button>
            }
          >
            <div className="w-48">
              <Select
                value={status}
                onValueChange={setStatus}
                placeholder={t('ds.filterStatus')}
                ariaLabel={t('ds.filterStatus')}
                standalone
                options={[
                  { value: 'all', label: t('ds.allStatuses') },
                  ...STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
                ]}
              />
            </div>
          </DataTableToolbar>
          <DataTable
            label={t('ds.sectionTableExtras')}
            data={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            numericColumns={['yield']}
            filtered={search !== '' || status !== 'all'}
            empty={<EmptyState title={t('ds.emptyTitle')} body={t('ds.emptyBody')} />}
            filteredEmpty={<FilteredEmptyState onClear={clear} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('ds.serverTableTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            label={t('ds.serverTableTitle')}
            data={page?.rows ?? []}
            columns={columns}
            getRowId={(row) => row.id}
            numericColumns={['yield']}
            loading={page === undefined}
            refreshing={refreshing}
            server={{ rowCount: page?.total ?? 0, state: server, onStateChange: setServer }}
          />
        </CardContent>
      </Card>
    </>
  );
}
