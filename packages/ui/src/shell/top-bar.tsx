import { Bell, Check, ChevronDown, Globe, Moon, Search, Sun, Warehouse } from 'lucide-react';
import { DropdownMenu } from 'radix-ui';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/avatar';
import { cn } from '../lib/cn';
import type { ReactNode } from 'react';

const barButton = cn(
  'inline-flex h-(--control-height-md) items-center gap-2 rounded-sm border border-border-input bg-surface px-3',
  'text-base font-medium text-text hover:bg-bg-sunken',
  'transition-colors duration-(--duration-fast) ease-standard',
);

export function FarmSwitcher({ name, onClick }: { name: string; onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={barButton}
      onClick={onClick}
      aria-label={t('topbar.farmSwitcher')}
    >
      <Warehouse className="size-5 text-primary" aria-hidden />
      <span className="max-w-40 truncate">{name}</span>
      <ChevronDown className="size-4 text-text-muted" aria-hidden />
    </button>
  );
}

/** Looks like a search box; opens the command palette (Ctrl K) when activated. */
export function SearchTrigger({
  placeholder,
  hint,
  onClick,
}: {
  placeholder: string;
  hint: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-(--control-height-md) min-w-0 flex-1 items-center gap-3 rounded-md border border-border-input bg-surface px-3',
        'text-start text-base text-text-subtle hover:border-border-strong',
        'transition-colors duration-(--duration-fast) ease-standard',
      )}
    >
      <Search className="size-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{placeholder}</span>
      <kbd
        className="hidden rounded-xs border border-border bg-bg-sunken px-1.5 py-0.5 font-mono text-xs text-text-muted sm:inline"
        dir="ltr"
      >
        {hint}
      </kbd>
    </button>
  );
}

export function NotificationBell({ count, onClick }: { count: number; onClick?: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${t('topbar.notifications')}: ${t('topbar.notificationsCount', { count })}`}
      className="relative grid size-(--control-height-md) place-items-center rounded-sm text-text-muted hover:bg-bg-sunken hover:text-text"
    >
      <Bell className="size-5" aria-hidden />
      {count > 0 ? (
        <span
          aria-hidden
          className="absolute end-1 top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-xs font-semibold leading-5 text-text-inverse"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  );
}

interface LanguageOption<T extends string> {
  value: T;
  label: string;
}

export function LanguageSwitcher<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly LanguageOption<T>[];
  onChange: (value: T) => void;
}) {
  const { t } = useTranslation();
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className={barButton} aria-label={t('topbar.language')}>
        <Globe className="size-5 text-text-muted" aria-hidden />
        <span>{current?.label}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-(--z-dropdown) min-w-40 rounded-md border border-border bg-surface-raised p-1 shadow-md"
        >
          {options.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              onSelect={() => {
                onChange(option.value);
              }}
              className="flex h-(--control-height-md) cursor-pointer items-center justify-between gap-3 rounded-sm px-3 text-base text-text outline-none data-[highlighted]:bg-bg-sunken"
            >
              {option.label}
              {option.value === value ? (
                <Check className="size-4 text-primary" aria-hidden />
              ) : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: 'light' | 'dark';
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${t('topbar.theme')}: ${theme === 'dark' ? t('topbar.themeLight') : t('topbar.themeDark')}`}
      className="grid size-(--control-height-md) place-items-center rounded-sm text-text-muted hover:bg-bg-sunken hover:text-text"
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

export function UserMenu({
  name,
  role,
  children,
}: {
  name: string;
  role: string;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t('topbar.userMenu')}
        className="flex items-center gap-3 rounded-sm px-1 py-1 hover:bg-bg-sunken"
      >
        <Avatar name={name} />
        <span className="hidden text-start leading-tight md:block">
          <span className="block text-sm font-semibold text-text">{name}</span>
          <span className="block text-sm text-text-muted">{role}</span>
        </span>
        <ChevronDown className="hidden size-4 text-text-muted md:block" aria-hidden />
      </DropdownMenu.Trigger>
      {children ? (
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-(--z-dropdown) min-w-48 rounded-md border border-border bg-surface-raised p-1 shadow-md"
          >
            {children}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      ) : null}
    </DropdownMenu.Root>
  );
}

/** Row inside a UserMenu (or other dropdown): optional check mark for the current choice. */
export function MenuItem({
  children,
  onSelect,
  checked,
  className,
}: {
  children: ReactNode;
  onSelect: () => void;
  checked?: boolean;
  className?: string;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={cn(
        'flex h-(--control-height-md) cursor-pointer items-center justify-between gap-3 rounded-sm px-3 text-base text-text outline-none data-[highlighted]:bg-bg-sunken',
        className,
      )}
    >
      {children}
      {checked ? <Check className="size-4 text-primary" aria-hidden /> : null}
    </DropdownMenu.Item>
  );
}

export function MenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <DropdownMenu.Label
      className={cn('px-3 py-1.5 text-sm font-medium text-text-subtle', className)}
    >
      {children}
    </DropdownMenu.Label>
  );
}
