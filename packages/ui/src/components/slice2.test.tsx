import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '../testing/render';
import { Button } from './button';
import { Checkbox, MoneyInput, NumberInput, RadioPills, Switch } from './controls';
import { DataTable, dataTableColumns } from './data-table';
import { Field } from './field';
import { ConfirmDialog, Dialog, Tabs } from './overlays';
import { EmptyState } from './states';
import { Toaster, toast } from './toast';

function Controlled({ decimals, start = '' }: { decimals: number; start?: string }) {
  const [value, setValue] = useState(start);
  return (
    <Field label="Amount">
      <NumberInput value={value} onValueChange={setValue} decimals={decimals} />
    </Field>
  );
}

describe('NumberInput', () => {
  it('blocks letters and extra decimals', async () => {
    renderWithI18n(<Controlled decimals={2} />);
    const input = screen.getByLabelText(/Amount/);
    await userEvent.type(input, '12a.345');
    expect(input).toHaveValue('12.34');
  });

  it('accepts a comma as the decimal separator', async () => {
    renderWithI18n(<Controlled decimals={3} />);
    const input = screen.getByLabelText(/Amount/);
    await userEvent.type(input, '5,25');
    expect(input).toHaveValue('5.25');
  });

  it('allows only whole numbers when decimals is 0', async () => {
    renderWithI18n(<Controlled decimals={0} />);
    const input = screen.getByLabelText(/Amount/);
    await userEvent.type(input, '7.5');
    expect(input).toHaveValue('75');
  });

  it('shows a numeric keypad on phones', () => {
    renderWithI18n(<Controlled decimals={2} />);
    expect(screen.getByLabelText(/Amount/)).toHaveAttribute('inputmode', 'decimal');
  });
});

describe('MoneyInput', () => {
  it('shows the currency and keeps two decimals', async () => {
    function Wrapper() {
      const [value, setValue] = useState('');
      return (
        <Field label="Price">
          <MoneyInput currency="Rs" value={value} onValueChange={setValue} />
        </Field>
      );
    }
    renderWithI18n(<Wrapper />);
    await userEvent.type(screen.getByLabelText(/Price/), '120.999');
    expect(screen.getByLabelText(/Price/)).toHaveValue('120.99');
    expect(screen.getByText('Rs')).toBeInTheDocument();
  });
});

describe('Checkbox, Switch, RadioPills', () => {
  it('toggles a checkbox and a switch', async () => {
    const onCheck = vi.fn();
    const onSwitch = vi.fn();
    renderWithI18n(
      <>
        <Checkbox checked={false} onCheckedChange={onCheck} label="Include sold" />
        <Switch checked={false} onCheckedChange={onSwitch} label="Daily summary" />
      </>,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Include sold' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Daily summary' }));
    expect(onCheck).toHaveBeenCalledWith(true);
    expect(onSwitch).toHaveBeenCalledWith(true);
  });

  it('selects one option at a time', async () => {
    const onChange = vi.fn();
    renderWithI18n(
      <RadioPills
        label="Sex"
        value="female"
        onValueChange={onChange}
        options={[
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
        ]}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'Male' }));
    expect(onChange).toHaveBeenCalledWith('male');
  });
});

describe('Dialogs', () => {
  it('Dialog shows title, description and closes with Escape', async () => {
    const onOpenChange = vi.fn();
    renderWithI18n(
      <Dialog open onOpenChange={onOpenChange} title="Add a note" description="Visible to all">
        <p>Body</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Add a note' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('ConfirmDialog puts focus on Cancel and only confirms on request', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    renderWithI18n(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Delete animal?"
        description="Cannot be undone"
        confirmLabel="Delete"
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe('Tabs', () => {
  it('switches panels', async () => {
    function Wrapper() {
      const [value, setValue] = useState('a');
      return (
        <Tabs
          value={value}
          onValueChange={setValue}
          tabs={[
            { value: 'a', label: 'Overview', content: <p>First panel</p> },
            { value: 'b', label: 'Milk', content: <p>Second panel</p> },
          ]}
        />
      );
    }
    renderWithI18n(<Wrapper />);
    expect(screen.getByText('First panel')).toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Milk' }));
    expect(screen.getByText('Second panel')).toBeVisible();
  });
});

describe('Toast', () => {
  it('announces a toast with its title and description', () => {
    renderWithI18n(<Toaster />);
    act(() => {
      toast({ title: 'Animal PK-1042 saved', description: 'Added to Dry group' });
    });
    expect(screen.getByText('Animal PK-1042 saved')).toBeInTheDocument();
    expect(screen.getByText('Added to Dry group')).toBeInTheDocument();
  });
});

interface Row {
  id: string;
  tag: string;
  yield: number;
}
const col = dataTableColumns<Row>();
const columns = col.columns([
  col.accessor('tag', { header: 'Tag' }),
  col.accessor('yield', { header: 'Yield' }),
]);
const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({
  id: String(i),
  tag: `PK-${String(100 + i)}`,
  yield: 30 - i,
}));

describe('DataTable', () => {
  it('shows the first page and a range summary', () => {
    renderWithI18n(
      <DataTable label="Animals" data={rows} columns={columns} getRowId={(r) => r.id} />,
    );
    expect(screen.getByRole('table', { name: 'Animals' })).toBeInTheDocument();
    expect(screen.getByText('Showing 1 to 10 of 25')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(11);
  });

  it('pages forward and disables Previous on the first page', async () => {
    renderWithI18n(
      <DataTable label="Animals" data={rows} columns={columns} getRowId={(r) => r.id} />,
    );
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Showing 11 to 20 of 25')).toBeInTheDocument();
  });

  it('sorts by a column and exposes aria-sort', async () => {
    renderWithI18n(
      <DataTable label="Animals" data={rows} columns={columns} getRowId={(r) => r.id} />,
    );
    const header = screen.getByRole('columnheader', { name: /Yield/ });
    // Numbers sort largest-first on the first click, then flip.
    await userEvent.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'descending');
    await userEvent.click(within(header).getByRole('button'));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    const firstDataRow = screen.getAllByRole('row')[1];
    expect(firstDataRow).toBeDefined();
    // Smallest yield (30 - 24 = 6) belongs to PK-124.
    expect(within(firstDataRow!).getByText('PK-124')).toBeInTheDocument();
  });

  it('selects rows and reports the count', async () => {
    renderWithI18n(
      <DataTable label="Animals" data={rows} columns={columns} getRowId={(r) => r.id} selectable />,
    );
    const boxes = screen.getAllByRole('checkbox', { name: 'Select row' });
    await userEvent.click(boxes[0]!);
    await userEvent.click(boxes[1]!);
    expect(screen.getByText('2 rows selected')).toBeInTheDocument();
  });

  it('renders the loading, error and empty states instead of the table', () => {
    const { rerender } = renderWithI18n(
      <DataTable label="Animals" data={[]} columns={columns} getRowId={(r) => r.id} loading />,
    );
    expect(screen.queryByRole('table', { name: 'Animals' })).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    rerender(
      <DataTable
        label="Animals"
        data={[]}
        columns={columns}
        getRowId={(r) => r.id}
        error={{ requestId: 'AB-12' }}
      />,
    );
    expect(screen.getByText('Support code: AB-12')).toBeInTheDocument();
    rerender(
      <DataTable
        label="Animals"
        data={[]}
        columns={columns}
        getRowId={(r) => r.id}
        empty={<EmptyState title="No animals yet" action={<Button>Add</Button>} />}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No animals yet' })).toBeInTheDocument();
  });
});
