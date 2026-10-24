import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithI18n } from '../testing/render';
import { Button } from './button';
import { DataTable, dataTableColumns, type ServerTableState } from './data-table';
import { DataTableToolbar } from './data-table-toolbar';
import { EmptyState, FilteredEmptyState } from './states';

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
const page = (start: number): Row[] =>
  Array.from({ length: 10 }, (_, i) => ({
    id: String(start + i),
    tag: `PK-${String(start + i)}`,
    yield: 20,
  }));

describe('DataTable numeric columns', () => {
  it('aligns numbers to the end with tabular figures', () => {
    renderWithI18n(
      <DataTable
        label="Animals"
        data={page(0)}
        columns={columns}
        getRowId={(r) => r.id}
        numericColumns={['yield']}
      />,
    );
    expect(screen.getByRole('columnheader', { name: /Yield/ })).toHaveClass('text-end');
    expect(screen.getAllByText('20')[0]?.closest('td')).toHaveClass('text-end', 'tabular-nums');
    expect(screen.getByRole('columnheader', { name: /Tag/ })).toHaveClass('text-start');
  });
});

describe('DataTable empty states', () => {
  it('shows the first-use empty state when nothing is filtered', () => {
    renderWithI18n(
      <DataTable
        label="Animals"
        data={[]}
        columns={columns}
        getRowId={(r) => r.id}
        empty={<EmptyState title="No animals yet" />}
        filteredEmpty={<FilteredEmptyState onClear={() => undefined} />}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No animals yet' })).toBeInTheDocument();
  });

  it('shows the filtered empty state when filters removed everything', async () => {
    const onClear = vi.fn();
    renderWithI18n(
      <DataTable
        label="Animals"
        data={[]}
        columns={columns}
        getRowId={(r) => r.id}
        filtered
        empty={<EmptyState title="No animals yet" />}
        filteredEmpty={<FilteredEmptyState onClear={onClear} />}
      />,
    );
    expect(screen.queryByText('No animals yet')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('keeps old rows, dimmed and busy, while refreshing', () => {
    const { container } = renderWithI18n(
      <DataTable
        label="Animals"
        data={page(0)}
        columns={columns}
        getRowId={(r) => r.id}
        refreshing
      />,
    );
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('table', { name: 'Animals' })).toBeInTheDocument();
  });
});

describe('DataTable server mode', () => {
  function Server({ onChange }: { onChange: (state: ServerTableState) => void }) {
    const [state, setState] = useState<ServerTableState>({
      pageIndex: 0,
      pageSize: 10,
      sorting: [],
    });
    return (
      <DataTable
        label="Animals"
        data={page(state.pageIndex * 10)}
        columns={columns}
        getRowId={(r) => r.id}
        server={{
          rowCount: 95,
          state,
          onStateChange: (next) => {
            onChange(next);
            setState(next);
          },
        }}
      />
    );
  }

  it('shows the server total and exactly the rows it was given', () => {
    renderWithI18n(<Server onChange={() => undefined} />);
    expect(screen.getByText('Showing 1 to 10 of 95')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 10')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(11);
  });

  it('reports the next page instead of slicing locally', async () => {
    const onChange = vi.fn();
    renderWithI18n(<Server onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onChange).toHaveBeenCalledWith({ pageIndex: 1, pageSize: 10, sorting: [] });
    expect(screen.getByText('Showing 11 to 20 of 95')).toBeInTheDocument();
    expect(screen.getByText('PK-10')).toBeInTheDocument();
  });

  it('returns to the first page when the sort order changes', async () => {
    const onChange = vi.fn();
    renderWithI18n(<Server onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(
      within(screen.getByRole('columnheader', { name: /Yield/ })).getByRole('button'),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      pageIndex: 0,
      pageSize: 10,
      sorting: [{ id: 'yield', desc: true }],
    });
  });

  it('returns to the first page when the page size changes', async () => {
    const onChange = vi.fn();
    renderWithI18n(<Server onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.selectOptions(screen.getByLabelText('Rows per page'), '25');
    expect(onChange).toHaveBeenLastCalledWith({ pageIndex: 0, pageSize: 25, sorting: [] });
  });
});

describe('DataTableToolbar', () => {
  function Toolbar({ onClear = () => undefined }: { onClear?: () => void }) {
    const [value, setValue] = useState('');
    return (
      <DataTableToolbar
        search={{ value, onChange: setValue, placeholder: 'Search by tag' }}
        activeCount={value ? 1 : 0}
        onClear={onClear}
        actions={<Button>Export</Button>}
      />
    );
  }

  it('shows Clear all only when something is active', async () => {
    renderWithI18n(<Toolbar />);
    expect(screen.queryByRole('button', { name: /Clear all filters/ })).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search by tag' }), 'pk');
    expect(screen.getByRole('button', { name: /Clear all filters/ })).toBeInTheDocument();
  });

  it('clears the search box from its own button', async () => {
    renderWithI18n(<Toolbar />);
    const box = screen.getByRole('searchbox');
    await userEvent.type(box, 'pk');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(box).toHaveValue('');
  });

  it('is a labelled search region with its actions', () => {
    renderWithI18n(<Toolbar />);
    expect(screen.getByRole('search', { name: 'Search by tag' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });
});
