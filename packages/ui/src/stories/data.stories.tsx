import { Baby, HeartPulse } from 'lucide-react';
import {
  DataTable,
  DonutCard,
  EmptyState,
  HealthScoreRing,
  ListCard,
  MiniTable,
  SessionsChart,
  StatusChip,
  Timeline,
  dataTableColumns,
  type AnimalStatus,
} from '..';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = { title: 'Data/Tables and charts' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

interface Row {
  id: string;
  tag: string;
  name: string;
  status: AnimalStatus;
  yield: number;
}
const STATUSES: AnimalStatus[] = ['lactating', 'dry', 'pregnant', 'calf', 'sick', 'inactive'];
const ROWS: Row[] = Array.from({ length: 23 }, (_, i) => ({
  id: `a${String(i)}`,
  tag: `PK-${String(1000 + i * 7)}`,
  name: ['Rani', 'Lali', 'Noori', 'Chandni'][i % 4] ?? 'Rani',
  status: STATUSES[i % STATUSES.length] ?? 'lactating',
  yield: 8 + ((i * 37) % 14),
}));
const col = dataTableColumns<Row>();
const columns = col.columns([
  col.accessor('tag', { header: 'Tag' }),
  col.accessor('name', { header: 'Name' }),
  col.accessor('status', {
    header: 'Status',
    enableSorting: false,
    cell: (info) => <StatusChip status={info.getValue()} />,
  }),
  col.accessor('yield', { header: 'Yield (L)' }),
]);

export const Table: Story = {
  render: () => (
    <DataTable
      label="Animals"
      data={ROWS}
      columns={columns}
      getRowId={(r) => r.id}
      numericColumns={['yield']}
      selectable
    />
  ),
};

export const TableLoading: Story = {
  render: () => (
    <DataTable label="Animals" data={[]} columns={columns} getRowId={(r) => r.id} loading />
  ),
};

export const TableError: Story = {
  render: () => (
    <DataTable
      label="Animals"
      data={[]}
      columns={columns}
      getRowId={(r) => r.id}
      error={{ requestId: '7F3A-92', onRetry: () => undefined }}
    />
  ),
};

export const TableEmpty: Story = {
  render: () => (
    <DataTable
      label="Animals"
      data={[]}
      columns={columns}
      getRowId={(r) => r.id}
      empty={<EmptyState title="No animals yet" body="Add your first animal." />}
    />
  ),
};

export const Charts: Story = {
  render: () => (
    <div className="grid gap-6 xl:grid-cols-2">
      <SessionsChart
        categories={['1', '2', '3', '4', '5', '6', '7']}
        morning={[120, 132, 128, 140, 135, 142, 150]}
        noon={[60, 64, 66, 70, 68, 72, 75]}
        evening={[110, 118, 115, 125, 122, 130, 134]}
        labels={{ morning: 'Morning', noon: 'Noon', evening: 'Evening', total: 'Total' }}
        chartLabel="Milk by session"
      />
      <DonutCard
        title="Herd composition"
        chartLabel="Herd composition"
        total={{ value: '186', label: 'animals' }}
        slices={[
          { id: 'l', label: 'Lactating', value: 98, formatted: '98', percent: '52.7%' },
          { id: 'd', label: 'Dry', value: 34, formatted: '34', percent: '18.3%' },
          { id: 'p', label: 'Pregnant', value: 28, formatted: '28', percent: '15.1%' },
          { id: 'c', label: 'Calf', value: 18, formatted: '18', percent: '9.7%' },
        ]}
      />
    </div>
  ),
};

export const Cards: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-3">
      <ListCard
        title="Upcoming events"
        items={[
          {
            id: '1',
            title: 'Expected calving: PK-1042',
            subtitle: 'Dry group',
            date: { month: 'Oct', day: '28' },
          },
          {
            id: '2',
            title: 'Vaccination campaign',
            subtitle: 'Lactating herd',
            date: { month: 'Nov', day: '02' },
          },
        ]}
      />
      <MiniTable
        title="Top animals"
        rows={[
          { id: '1', tag: 'PK-1042', avg: '24.5' },
          { id: '2', tag: 'PK-1056', avg: '22.1' },
        ]}
        getRowId={(r) => r.id}
        columns={[
          { key: 'tag', label: 'Animal', render: (r) => r.tag },
          { key: 'avg', label: 'Avg. litres', numeric: true, render: (r) => r.avg },
        ]}
      />
      <div className="flex justify-center gap-4">
        <HealthScoreRing score={86} label="Farm health score" />
        <HealthScoreRing score={34} label="Farm health score" />
      </div>
      <div className="lg:col-span-3">
        <Timeline
          events={[
            { id: 'a', title: 'Calved a heifer calf', time: '24 Oct, 06:10', icon: Baby },
            { id: 'b', title: 'Heat observed', time: '2 Oct', icon: HeartPulse },
          ]}
        />
      </div>
    </div>
  ),
};
