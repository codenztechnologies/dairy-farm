import { Droplet, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  Banner,
  Button,
  Field,
  KpiCard,
  StatusChip,
  TextInput,
  Textarea,
  type AnimalStatus,
} from '..';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = { title: 'Core/Basics' } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Buttons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">
        <Plus className="size-4" aria-hidden />
        Add animal
      </Button>
      <Button>Export</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="primary" loading loadingLabel="Saving">
        Saving
      </Button>
      <Button disabled>Disabled</Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Fields: Story = {
  render: () => {
    const [note, setNote] = useState('');
    return (
      <div className="grid max-w-3xl gap-5 md:grid-cols-2">
        <Field label="Tag number" helper="Printed on the ear tag." required>
          <TextInput placeholder="e.g. PK-1042" dir="ltr" />
        </Field>
        <Field label="Tag number" error="Use letters, numbers and hyphens only." required>
          <TextInput defaultValue="PK 1042!" dir="ltr" />
        </Field>
        <Field label="Milk yield">
          <TextInput inputMode="decimal" trailing="L" defaultValue="18.5" dir="ltr" />
        </Field>
        <Field label="Notes">
          <Textarea
            value={note}
            maxLength={500}
            onChange={(event) => {
              setNote(event.target.value);
            }}
          />
        </Field>
      </div>
    );
  },
};

const STATUSES: AnimalStatus[] = ['lactating', 'dry', 'pregnant', 'calf', 'sick', 'inactive'];
export const StatusChips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {STATUSES.map((status) => (
        <StatusChip key={status} status={status} />
      ))}
    </div>
  ),
};

export const KpiCards: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <KpiCard
        label="Today's milk"
        value="1,284.5 L"
        icon={Droplet}
        tint="blue"
        delta={{ percent: 5.2, direction: 'up', formatted: '5.2%' }}
        comparison="vs yesterday"
        trend={[3, 4, 3.5, 5, 4.5, 6, 6.4]}
      />
      <KpiCard
        label="Health alerts"
        value="3"
        icon={Droplet}
        tint="rose"
        delta={{ percent: 20, direction: 'up', upIsGood: false, formatted: '20%' }}
        comparison="vs last week"
      />
    </div>
  ),
};

export const Banners: Story = {
  render: () => (
    <div className="max-w-xl space-y-3">
      <Banner tone="info">Milk from 2 animals is being kept separate until Sunday.</Banner>
      <Banner tone="success">Recorded 184.5 L from 22 animals.</Banner>
      <Banner tone="warning">3 animals are due for vaccination this week.</Banner>
      <Banner tone="danger" onDismiss={() => undefined}>
        Sync failed for 2 records. They are saved on this phone.
      </Banner>
    </div>
  ),
};
