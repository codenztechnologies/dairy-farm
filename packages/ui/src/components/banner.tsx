import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import type { ReactNode } from 'react';

const bannerStyles = cva('flex items-start gap-3 rounded-md border px-4 py-3 text-sm', {
  variants: {
    tone: {
      info: 'border-info/30 bg-info-soft text-text',
      success: 'border-success/30 bg-success-soft text-text',
      warning: 'border-warning/30 bg-warning-soft text-text',
      danger: 'border-danger/30 bg-danger-soft text-text',
    },
  },
  defaultVariants: { tone: 'info' },
});

const ICONS = {
  info: { Icon: Info, className: 'text-info' },
  success: { Icon: CheckCircle2, className: 'text-success' },
  warning: { Icon: AlertTriangle, className: 'text-warning' },
  danger: { Icon: OctagonAlert, className: 'text-danger' },
} as const;

type Tone = NonNullable<VariantProps<typeof bannerStyles>['tone']>;

interface BannerProps {
  tone?: Tone;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

/** Inline message. Danger and warning are announced assertively; others politely. */
export function Banner({ tone = 'info', children, action, onDismiss, className }: BannerProps) {
  const { t } = useTranslation();
  const { Icon, className: iconTone } = ICONS[tone];
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn(bannerStyles({ tone }), className)}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', iconTone)} aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('actions.dismiss')}
          className="grid size-8 shrink-0 place-items-center rounded-sm text-text-muted hover:bg-bg-sunken hover:text-text"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
