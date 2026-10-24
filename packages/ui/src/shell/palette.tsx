import { Command } from 'cmdk';
import { Dialog } from 'radix-ui';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

export interface PaletteItem {
  id: string;
  label: string;
  /** Secondary text, e.g. the module or animal group. */
  hint?: string;
  icon?: LucideIcon;
  /** Extra words that should match, e.g. a Roman Urdu spelling or the animal's old tag. */
  keywords?: readonly string[];
  onSelect: () => void;
}

export interface PaletteGroup {
  heading: string;
  items: readonly PaletteItem[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: readonly PaletteGroup[];
  placeholder: string;
}

/** Registers Ctrl+K / Cmd+K to toggle the palette. */
export function useCommandShortcut(onToggle: () => void): void {
  useEffect(() => {
    function handle(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onToggle();
      }
    }
    window.addEventListener('keydown', handle);
    return () => {
      window.removeEventListener('keydown', handle);
    };
  }, [onToggle]);
}

export function CommandPalette({ open, onOpenChange, groups, placeholder }: CommandPaletteProps) {
  const { t } = useTranslation();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed start-1/2 top-24 z-(--z-modal) w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg outline-none ltr:-translate-x-1/2 rtl:translate-x-1/2"
        >
          <Dialog.Title className="sr-only">{t('palette.title')}</Dialog.Title>
          <Command loop>
            <Command.Input
              placeholder={placeholder}
              className="h-14 w-full border-b border-border bg-transparent px-4 text-base text-text outline-none placeholder:text-text-subtle"
            />
            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-sm text-text-muted">
                {t('palette.noResults')}
              </Command.Empty>
              {groups.map((group) => (
                <Command.Group
                  key={group.heading}
                  heading={group.heading}
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-subtle"
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.hint ?? ''}`}
                        keywords={item.keywords ? [...item.keywords] : []}
                        onSelect={() => {
                          onOpenChange(false);
                          item.onSelect();
                        }}
                        className="flex min-h-(--control-height-md) cursor-pointer items-center gap-3 rounded-sm px-3 py-1.5 text-base text-text data-[selected=true]:bg-bg-sunken"
                      >
                        {Icon ? (
                          <Icon className="size-5 shrink-0 text-text-muted" aria-hidden />
                        ) : null}
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.hint ? (
                          <span className="shrink-0 text-sm text-text-muted">{item.hint}</span>
                        ) : null}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
