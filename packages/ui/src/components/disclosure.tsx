import { Check, ChevronDown } from 'lucide-react';
import { Accordion as RadixAccordion, Popover as RadixPopover } from 'radix-ui';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

// Popover ---------------------------------------------------------------------------------------

export function Popover({
  trigger,
  label,
  children,
  align = 'end',
  className,
}: {
  trigger: ReactNode;
  /** Accessible name of the popup (it is exposed as a dialog). */
  label: string;
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align={align}
          sideOffset={8}
          aria-label={label}
          className={cn(
            'z-(--z-dropdown) rounded-md border border-border bg-surface-raised shadow-md outline-none',
            className,
          )}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

// Accordion -------------------------------------------------------------------------------------

interface AccordionProps {
  items: readonly { value: string; title: string; content: ReactNode }[];
  defaultValue?: string;
  className?: string;
}

export function Accordion({ items, defaultValue, className }: AccordionProps) {
  return (
    <RadixAccordion.Root
      type="single"
      collapsible
      {...(defaultValue ? { defaultValue } : {})}
      className={cn('divide-y divide-border rounded-lg border border-border bg-surface', className)}
    >
      {items.map((item) => (
        <RadixAccordion.Item key={item.value} value={item.value}>
          <RadixAccordion.Header>
            <RadixAccordion.Trigger className="group flex min-h-(--touch-target-min) w-full items-center justify-between gap-3 px-4 text-start text-base font-medium text-text hover:bg-bg-sunken">
              {item.title}
              <ChevronDown
                className="size-4 shrink-0 text-text-muted transition-transform duration-(--duration-fast) group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                aria-hidden
              />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="px-4 pb-4 text-base text-text-muted">
            {item.content}
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}

// Stepper and numbered section header ------------------------------------------------------------

interface StepperProps {
  steps: readonly { id: string; label: string }[];
  /** Zero-based index of the current step. */
  current: number;
  className?: string;
}

/** Multi-step progress. Completed steps show a check; the current one is announced with aria-current. */
export function Stepper({ steps, current, className }: StepperProps) {
  const { t } = useTranslation();
  return (
    <ol className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.id}
            aria-current={active ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold',
                done && 'border-primary bg-primary text-on-primary',
                active && 'border-primary bg-primary-soft text-nav-active-text',
                !done && !active && 'border-border-input bg-surface text-text-muted',
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : index + 1}
              {done ? <span className="sr-only">{t('form.stepDone')}</span> : null}
            </span>
            <span className={cn('text-sm font-medium', active ? 'text-text' : 'text-text-muted')}>
              {step.label}
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden className="h-px w-6 bg-border-strong" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Card heading for long forms: "1 Basic information", with an optional marker. */
export function SectionHeader({
  number,
  title,
  optional,
}: {
  number: number;
  title: string;
  optional?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-nav-active-text"
      >
        {number}
      </span>
      <h2 className="text-lg font-semibold text-text">
        {title}
        {optional ? (
          <span className="ms-2 text-sm font-normal text-text-subtle">{t('state.optional')}</span>
        ) : null}
      </h2>
    </div>
  );
}

// FormSummary -----------------------------------------------------------------------------------

export interface FormIssue {
  /** DOM id of the field (from Field's id) so the link can focus it. */
  fieldId: string;
  label: string;
  message: string;
}

/** Error summary at the top of a long form. Takes focus when it appears so keyboard users land on it. */
export function FormSummary({ issues }: { issues: readonly FormIssue[] }) {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const count = issues.length;
  useEffect(() => {
    if (count > 0) box.current?.focus();
  }, [count]);
  if (count === 0) return null;
  return (
    <div
      ref={box}
      tabIndex={-1}
      role="alert"
      className="rounded-md border border-danger/30 bg-danger-soft p-4 outline-none focus-visible:outline-2"
    >
      <p className="text-base font-semibold text-text">{t('form.summaryTitle', { count })}</p>
      <ul className="mt-2 list-disc space-y-1 ps-5 text-sm text-text">
        {issues.map((issue) => (
          <li key={issue.fieldId}>
            <a
              href={`#${issue.fieldId}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(issue.fieldId)?.focus();
              }}
              className="font-medium underline"
            >
              {issue.label}
            </a>
            : {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
