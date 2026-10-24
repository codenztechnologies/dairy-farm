import { X } from 'lucide-react';
import {
  AlertDialog as RadixAlertDialog,
  Dialog as RadixDialog,
  Tabs as RadixTabs,
  Tooltip as RadixTooltip,
} from 'radix-ui';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Button } from './button';
import type { ReactNode } from 'react';

const overlay = 'fixed inset-0 z-(--z-overlay) bg-overlay';

function CloseButton() {
  const { t } = useTranslation();
  return (
    <RadixDialog.Close
      aria-label={t('actions.close')}
      className="absolute end-3 top-3 grid size-9 place-items-center rounded-sm text-text-muted hover:bg-bg-sunken hover:text-text"
    >
      <X className="size-5" aria-hidden />
    </RadixDialog.Close>
  );
}

// Dialog ---------------------------------------------------------------------------------------

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Buttons row. Primary action last (it appears at the end side). */
  footer?: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlay} />
        <RadixDialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed start-1/2 top-1/2 z-(--z-modal) w-[calc(100%-2rem)] max-w-lg -translate-y-1/2 rounded-xl border border-border bg-surface-raised p-6 shadow-lg outline-none rtl:translate-x-1/2 ltr:-translate-x-1/2',
            className,
          )}
        >
          <RadixDialog.Title className="pe-10 text-xl font-semibold text-text">
            {title}
          </RadixDialog.Title>
          {description ? (
            <RadixDialog.Description className="mt-1 text-base text-text-muted">
              {description}
            </RadixDialog.Description>
          ) : null}
          {children ? <div className="mt-5">{children}</div> : null}
          {footer ? <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div> : null}
          <CloseButton />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

// AlertDialog: confirm a risky action. Focus starts on Cancel so Enter never deletes by accident.

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  tone?: 'danger' | 'primary';
  confirming?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  tone = 'danger',
  confirming = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay className={overlay} />
        <RadixAlertDialog.Content className="fixed start-1/2 top-1/2 z-(--z-modal) w-[calc(100%-2rem)] max-w-md -translate-y-1/2 rounded-xl border border-border bg-surface-raised p-6 shadow-lg outline-none rtl:translate-x-1/2 ltr:-translate-x-1/2">
          <RadixAlertDialog.Title className="text-xl font-semibold text-text">
            {title}
          </RadixAlertDialog.Title>
          <RadixAlertDialog.Description className="mt-2 text-base text-text-muted">
            {description}
          </RadixAlertDialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <RadixAlertDialog.Cancel asChild>
              <Button>{t('actions.cancel')}</Button>
            </RadixAlertDialog.Cancel>
            <Button variant={tone} loading={confirming} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  );
}

// Sheet: side panel for detail and create forms (docs/10 list + detail pattern) ------------------

interface SheetProps extends Omit<DialogProps, 'className'> {
  /** Which edge it slides from. "end" is the right edge in LTR and the left edge in RTL. */
  side?: 'start' | 'end';
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'end',
}: SheetProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlay} />
        <RadixDialog.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed inset-y-0 z-(--z-modal) flex w-full max-w-md flex-col bg-surface-raised shadow-lg outline-none',
            side === 'end' ? 'end-0 border-s border-border' : 'start-0 border-e border-border',
          )}
        >
          <header className="border-b border-border px-6 py-5">
            <RadixDialog.Title className="pe-10 text-xl font-semibold text-text">
              {title}
            </RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="mt-1 text-base text-text-muted">
                {description}
              </RadixDialog.Description>
            ) : null}
          </header>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer ? (
            <footer className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">
              {footer}
            </footer>
          ) : null}
          <CloseButton />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

// Tooltip: supplementary only. Anything essential must also be visible text. ---------------------

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RadixTooltip.Provider delayDuration={300}>{children}</RadixTooltip.Provider>;
}

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          sideOffset={6}
          className="z-(--z-toast) max-w-64 rounded-sm bg-surface-inverse px-3 py-2 text-sm text-text-inverse shadow-md"
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

// Tabs -----------------------------------------------------------------------------------------

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: readonly { value: string; label: string; content: ReactNode }[];
  className?: string;
}

export function Tabs({ value, onValueChange, tabs, className }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RadixTabs.List className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className="-mb-px h-(--control-height-md) shrink-0 border-b-2 border-transparent px-4 text-base font-medium text-text-muted hover:text-text data-[state=active]:border-primary data-[state=active]:text-nav-active-text"
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.value} value={tab.value} className="pt-5 outline-none">
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
