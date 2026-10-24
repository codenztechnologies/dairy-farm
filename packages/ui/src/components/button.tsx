import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Spinner } from './spinner';
import type { ComponentProps } from 'react';

export const buttonStyles = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-semibold',
    'transition-colors duration-(--duration-fast) ease-standard',
    'disabled:cursor-not-allowed disabled:opacity-60',
    'aria-busy:cursor-progress',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active',
        secondary:
          'border border-border-input bg-surface text-text hover:bg-bg-sunken active:bg-bg-sunken',
        ghost: 'text-text-muted hover:bg-bg-sunken hover:text-text',
        danger: 'bg-danger text-text-inverse hover:bg-danger-hover',
      },
      size: {
        sm: 'h-(--control-height-sm) px-3 text-sm',
        md: 'h-(--control-height-md) px-4 text-base',
        lg: 'h-(--control-height-lg) px-6 text-lg',
      },
      fullWidth: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'secondary', size: 'md', fullWidth: false },
  },
);

export interface ButtonProps
  extends Omit<ComponentProps<'button'>, 'disabled'>, VariantProps<typeof buttonStyles> {
  /** Shows a spinner, blocks clicks and sets aria-busy. Keep the label so the width does not jump. */
  loading?: boolean;
  disabled?: boolean;
  /** Visible only to assistive tech while loading, e.g. "Saving". */
  loadingLabel?: string;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  loadingLabel,
  disabled = false,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner decorative /> : null}
      {children}
      {loading && loadingLabel ? <span className="sr-only">{loadingLabel}</span> : null}
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'fullWidth'> {
  /** Required: icon-only controls need an accessible name. */
  label: string;
  icon: React.ReactNode;
}

export function IconButton({ label, icon, size = 'md', className, ...props }: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      title={label}
      size={size}
      className={cn(
        'shrink-0 px-0',
        size === 'sm' && 'w-(--control-height-sm)',
        size === 'md' && 'w-(--control-height-md)',
        size === 'lg' && 'w-(--control-height-lg)',
        className,
      )}
      {...props}
    >
      {icon}
    </Button>
  );
}
