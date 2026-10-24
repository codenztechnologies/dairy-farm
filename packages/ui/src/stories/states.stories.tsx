import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FilteredEmptyState,
  NoPermissionState,
  NotFoundState,
  OfflineState,
  SkeletonChart,
  SkeletonForm,
  SkeletonKpiCard,
  SkeletonList,
  SkeletonRegion,
  SkeletonTable,
} from '..';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = { title: 'States/Page states' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => (
    <Card>
      <EmptyState
        title="No animals yet"
        body="Add your first animal or import your herd from a spreadsheet."
        action={<Button variant="primary">Add animal</Button>}
      />
    </Card>
  ),
};

export const FilteredEmpty: Story = {
  render: () => (
    <Card>
      <FilteredEmptyState onClear={() => undefined} />
    </Card>
  ),
};

export const Error: Story = {
  render: () => (
    <Card>
      <ErrorState requestId="7F3A-92" onRetry={() => undefined} />
    </Card>
  ),
};

export const Offline: Story = {
  render: () => (
    <Card>
      <OfflineState />
    </Card>
  ),
};

export const NoPermission: Story = {
  render: () => (
    <Card>
      <NoPermissionState />
    </Card>
  ),
};

export const NotFound: Story = {
  render: () => (
    <Card>
      <NotFoundState />
    </Card>
  ),
};

export const Skeletons: Story = {
  render: () => (
    <SkeletonRegion className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <SkeletonKpiCard />
      <SkeletonChart />
      <SkeletonList />
      <SkeletonForm />
      <div className="lg:col-span-2">
        <SkeletonTable rows={3} columns={4} />
      </div>
    </SkeletonRegion>
  ),
};
