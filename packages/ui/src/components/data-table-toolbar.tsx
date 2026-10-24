import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Button } from './button';
import type { ReactNode } from 'react';

interface DataTableToolbarProps {
  /** Free-text search box (tag, name, RFID ...). The caller debounces and filters. */
  search: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    /** Accessible name; defaults to the placeholder. */
    label?: string;
  };
  /** Filter controls (Select, MultiSelect ...), rendered next to the search box. */
  children?: ReactNode;
  /** How many filters and searches are active. Shows "Clear all filters" when above zero. */
  activeCount: number;
  onClear: () => void;
  /** Right-aligned actions such as Export. */
  actions?: ReactNode;
  className?: string;
}

/** Search + filters + clear + actions row that sits above a DataTable. */
export function DataTableToolbar({
  search,
  children,
  activeCount,
  onClear,
  actions,
  className,
}: DataTableToolbarProps) {
  const { t } = useTranslation();
  return (
    <div
      role="search"
      aria-label={search.label ?? search.placeholder}
      className={cn('flex flex-wrap items-center gap-3', className)}
    >
      <div className="relative min-w-56 flex-1 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={search.value}
          onChange={(event) => {
            search.onChange(event.target.value);
          }}
          placeholder={search.placeholder}
          aria-label={search.label ?? search.placeholder}
          className="h-(--control-height-md) w-full rounded-md border border-border-input bg-surface ps-10 pe-10 text-base text-text placeholder:text-text-subtle hover:border-border-strong"
        />
        {search.value ? (
          <button
            type="button"
            onClick={() => {
              search.onChange('');
            }}
            aria-label={t('table.clearSearch')}
            className="absolute end-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-text-muted hover:bg-bg-sunken"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {children}
      {activeCount > 0 ? (
        <Button variant="ghost" onClick={onClear}>
          {t('actions.clearFilters')}
          <span className="rounded-full bg-primary-soft px-2 text-sm text-nav-active-text">
            {activeCount}
          </span>
        </Button>
      ) : null}
      {actions ? <div className="ms-auto flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
