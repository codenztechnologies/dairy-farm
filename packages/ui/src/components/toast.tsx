import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from 'lucide-react';
import { Toast as RadixToast } from 'radix-ui';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

type ToastTone = 'success' | 'info' | 'warning' | 'danger';

export interface ToastInput {
  tone?: ToastTone;
  /** Name the object: "Animal PK-1042 saved", not just "Saved". */
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss. Errors stay longer (docs/01: 3-5 s for confirmations). */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastInput, 'title'>> {
  id: number;
  tone: ToastTone;
  description: string | undefined;
  duration: number;
}

let items: readonly ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => {
    listener();
  });
}

/** Imperative API so non-React code (mutation handlers) can confirm success or report failure. */
export function toast(input: ToastInput): number {
  const tone = input.tone ?? 'success';
  const item: ToastItem = {
    id: nextId++,
    tone,
    title: input.title,
    description: input.description,
    duration: input.duration ?? (tone === 'danger' ? 8000 : 4000),
  };
  items = [...items, item].slice(-4);
  emit();
  return item.id;
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const ICONS = {
  success: { Icon: CheckCircle2, className: 'text-success' },
  info: { Icon: Info, className: 'text-info' },
  warning: { Icon: AlertTriangle, className: 'text-warning' },
  danger: { Icon: OctagonAlert, className: 'text-danger' },
} as const;

/** Mount once near the app root. */
export function Toaster() {
  const { t } = useTranslation();
  const current = useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  );
  return (
    <RadixToast.Provider swipeDirection="right">
      {current.map((item) => {
        const { Icon, className } = ICONS[item.tone];
        return (
          <RadixToast.Root
            key={item.id}
            duration={item.duration}
            type={item.tone === 'danger' || item.tone === 'warning' ? 'foreground' : 'background'}
            onOpenChange={(open) => {
              if (!open) dismiss(item.id);
            }}
            className="flex items-start gap-3 rounded-md border border-border bg-surface-raised p-4 shadow-lg"
          >
            <Icon className={cn('mt-0.5 size-5 shrink-0', className)} aria-hidden />
            <div className="min-w-0 flex-1">
              <RadixToast.Title className="text-base font-semibold text-text">
                {item.title}
              </RadixToast.Title>
              {item.description ? (
                <RadixToast.Description className="mt-0.5 text-sm text-text-muted">
                  {item.description}
                </RadixToast.Description>
              ) : null}
            </div>
            <RadixToast.Close
              aria-label={t('actions.dismiss')}
              className="grid size-8 shrink-0 place-items-center rounded-sm text-text-muted hover:bg-bg-sunken"
            >
              <X className="size-4" aria-hidden />
            </RadixToast.Close>
          </RadixToast.Root>
        );
      })}
      <RadixToast.Viewport className="fixed inset-x-4 bottom-4 z-(--z-toast) flex flex-col gap-3 outline-none sm:inset-x-auto sm:end-4 sm:w-96" />
    </RadixToast.Provider>
  );
}
