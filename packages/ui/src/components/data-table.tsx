import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  functionalUpdate,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Checkbox } from './controls';
import { SkeletonRegion, SkeletonTable } from './skeleton';
import { ErrorState, type ErrorStateProps } from './states';
import type { ReactNode } from 'react';

/** Features every DataTable has. Server-side tables switch to manual mode through the `server` prop. */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

export type DataTableColumn<TData extends RowData> = ColumnDef<typeof dataTableFeatures, TData>;

/** Typed column builder: `const col = dataTableColumns<Animal>(); col.columns([col.accessor('tag', {...})])`. */
export function dataTableColumns<TData extends RowData>() {
  return createColumnHelper<typeof dataTableFeatures, TData>();
}

export type Density = 'comfortable' | 'compact';

/** What the server needs to return the right page: where we are and how it is sorted. */
export interface ServerTableState {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
}

/**
 * Server mode: the table shows exactly the rows it is given (one page, already sorted) and reports
 * changes through `onStateChange`, so the caller refetches. `rowCount` is the total across all pages.
 */
export interface ServerTable {
  rowCount: number;
  state: ServerTableState;
  onStateChange: (next: ServerTableState) => void;
}

interface DataTableProps<TData extends RowData> {
  data: readonly TData[];
  columns: DataTableColumn<TData>[];
  /** Stable id per row (database id), required for selection to survive sorting and paging. */
  getRowId: (row: TData) => string;
  /** Accessible table name, e.g. "Animals". */
  label: string;
  selectable?: boolean;
  pageSize?: number;
  pageSizes?: readonly number[];
  density?: Density;
  loading?: boolean;
  error?: Pick<ErrorStateProps, 'requestId' | 'message' | 'onRetry' | 'retrying'>;
  /** Shown when there is no data at all (first-use empty state). */
  empty?: ReactNode;
  /** Shown instead of rows when filters removed everything. */
  filteredEmpty?: ReactNode;
  onRowClick?: (row: TData) => void;
  /** Column ids that hold numbers: right-aligned (start-aligned in RTL is wrong for digits, so `end`). */
  numericColumns?: readonly string[];
  /** True when filters or search are active: an empty result then shows `filteredEmpty`, not `empty`. */
  filtered?: boolean;
  /** Data is being refreshed (new page, new filter): keep the old rows visible but dimmed and busy. */
  refreshing?: boolean;
  server?: ServerTable;
  className?: string;
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  label,
  selectable = false,
  pageSize = 10,
  pageSizes = [10, 25, 50],
  density = 'comfortable',
  loading = false,
  error,
  empty,
  filteredEmpty,
  onRowClick,
  numericColumns = [],
  filtered = false,
  refreshing = false,
  server,
  className,
}: DataTableProps<TData>) {
  const { t, i18n } = useTranslation();
  const number = new Intl.NumberFormat(i18n.language);

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
    enableRowSelection: selectable,
    initialState: { pagination: { pageIndex: 0, pageSize } },
    ...(server
      ? {
          manualPagination: true,
          manualSorting: true,
          rowCount: server.rowCount,
          state: {
            pagination: { pageIndex: server.state.pageIndex, pageSize: server.state.pageSize },
            sorting: server.state.sorting,
          },
          onPaginationChange: (updater) => {
            const next = functionalUpdate(updater, {
              pageIndex: server.state.pageIndex,
              pageSize: server.state.pageSize,
            });
            // A different page size or sort order starts again from the first page.
            server.onStateChange({
              ...server.state,
              ...next,
              pageIndex: next.pageSize === server.state.pageSize ? next.pageIndex : 0,
            });
          },
          onSortingChange: (updater) => {
            server.onStateChange({
              ...server.state,
              pageIndex: 0,
              sorting: functionalUpdate(updater, server.state.sorting),
            });
          },
        }
      : {}),
  });
  const numeric = new Set(numericColumns);

  if (loading) {
    return (
      <SkeletonRegion>
        <SkeletonTable rows={Math.min(pageSize, 6)} columns={Math.min(columns.length, 5)} />
      </SkeletonRegion>
    );
  }
  if (error)
    return <ErrorState {...error} className="rounded-lg border border-border bg-surface" />;

  const rowCount = server ? server.rowCount : data.length;
  if (data.length === 0 && !refreshing) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        {filtered ? (filteredEmpty ?? empty) : empty}
      </div>
    );
  }

  const { pageIndex, pageSize: size } = table.state.pagination;
  const from = pageIndex * size + 1;
  const to = Math.min(rowCount, (pageIndex + 1) * size);
  const selectedCount = Object.keys(table.state.rowSelection).length;
  const rows = table.getRowModel().rows;
  const cellPadding = density === 'compact' ? 'py-2' : 'py-4';

  return (
    <div
      aria-busy={refreshing || undefined}
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface transition-opacity duration-(--duration-fast)',
        refreshing && 'opacity-60',
        className,
      )}
    >
      {selectable && selectedCount > 0 ? (
        <div
          className="border-b border-border bg-primary-softer px-4 py-2 text-sm font-medium text-nav-active-text"
          role="status"
        >
          {t('table.selected', { count: selectedCount })}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-start text-sm" aria-label={label}>
          <thead className="bg-bg-sunken">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {selectable ? (
                  <th scope="col" className="w-12 px-4 py-3">
                    <Checkbox
                      label={<span className="sr-only">{t('table.selectAll')}</span>}
                      checked={
                        table.getIsAllPageRowsSelected()
                          ? true
                          : table.getIsSomePageRowsSelected()
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={(checked) => {
                        table.toggleAllPageRowsSelected(checked);
                      }}
                      className="min-h-0"
                    />
                  </th>
                ) : null}
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : undefined
                      }
                      className={cn(
                        'px-4 py-3 font-semibold text-text-muted',
                        numeric.has(header.column.id) ? 'text-end' : 'text-start',
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="-mx-1 inline-flex items-center gap-1.5 rounded-xs px-1 hover:text-text"
                        >
                          <table.FlexRender header={header} />
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-4" aria-hidden />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-4" aria-hidden />
                          ) : (
                            <ChevronsUpDown className="size-4 opacity-60" aria-hidden />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>{filteredEmpty}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  data-selected={row.getIsSelected() || undefined}
                  onClick={
                    onRowClick
                      ? () => {
                          onRowClick(row.original);
                        }
                      : undefined
                  }
                  className={cn(
                    'border-t border-border data-[selected]:bg-primary-softer',
                    onRowClick && 'cursor-pointer hover:bg-bg-sunken',
                  )}
                >
                  {selectable ? (
                    <td className={cn('w-12 px-4', cellPadding)}>
                      <Checkbox
                        label={<span className="sr-only">{t('table.selectRow')}</span>}
                        checked={row.getIsSelected()}
                        onCheckedChange={(checked) => {
                          row.toggleSelected(checked);
                        }}
                        className="min-h-0"
                      />
                    </td>
                  ) : null}
                  {row.getAllCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-4 text-text',
                        cellPadding,
                        numeric.has(cell.column.id) && 'text-end tabular-nums',
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-text-muted">
        <p>
          {t('table.showing', {
            from: number.format(from),
            to: number.format(to),
            total: number.format(rowCount),
          })}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            {t('table.rowsPerPage')}
            <select
              value={size}
              onChange={(event) => {
                table.setPageSize(Number(event.target.value));
              }}
              className="h-9 rounded-sm border border-border-input bg-surface px-2 text-text"
            >
              {pageSizes.map((option) => (
                <option key={option} value={option}>
                  {number.format(option)}
                </option>
              ))}
            </select>
          </label>
          <nav
            aria-label={`${label}: ${t('table.pagination')}`}
            className="flex items-center gap-1"
          >
            <button
              type="button"
              onClick={() => {
                table.previousPage();
              }}
              disabled={!table.getCanPreviousPage()}
              aria-label={t('table.previous')}
              className="grid size-9 place-items-center rounded-sm border border-border-input text-text hover:bg-bg-sunken disabled:opacity-50"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
            </button>
            <span className="min-w-20 text-center text-text" aria-live="polite">
              {t('table.pageOf', {
                page: number.format(pageIndex + 1),
                pages: number.format(table.getPageCount()),
              })}
            </span>
            <button
              type="button"
              onClick={() => {
                table.nextPage();
              }}
              disabled={!table.getCanNextPage()}
              aria-label={t('table.next')}
              className="grid size-9 place-items-center rounded-sm border border-border-input text-text hover:bg-bg-sunken disabled:opacity-50"
            >
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}
