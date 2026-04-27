'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'outline'
  | 'ghost';
export type TiqButtonSize = 'lg' | 'md' | 'sm' | 'xs' | 'icon';

export type TiqButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: TiqButtonVariant;
  size?: TiqButtonSize;
  tooltip?: string;
  loading?: boolean;
};

function styles(variant: TiqButtonVariant, size: TiqButtonSize) {
  const base = cn(
    'inline-flex items-center justify-center gap-2 font-semibold',
    'transition-all duration-150 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tiq-primary/30 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed'
  );

  const sizes: Record<TiqButtonSize, string> = {
    lg: 'h-12 rounded-tiq px-6 text-base',
    md: 'h-10 rounded-tiq px-4 text-sm',
    sm: 'h-9 rounded-tiq px-3 text-sm',
    xs: 'h-8 rounded-tiq px-2 text-xs',
    icon: 'h-10 w-10 rounded-tiq p-0',
  };

  const variants: Record<TiqButtonVariant, string> = {
    primary: cn(
      'bg-tiq-primary text-white shadow-md',
      'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
    ),
    secondary: cn(
      'bg-tiq-secondary text-white shadow-md',
      'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
    ),
    danger: cn(
      'bg-tiq-danger text-white shadow-md',
      'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
    ),
    success: cn(
      'bg-tiq-success text-white shadow-md',
      'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
    ),
    outline: cn(
      'border-2 border-tiq-border bg-tiq-surface text-tiq-navy',
      'hover:border-tiq-primary hover:bg-tiq-primary/5'
    ),
    ghost: cn(
      'bg-transparent text-tiq-navy',
      'hover:bg-tiq-primary/10'
    ),
  };

  return cn(base, sizes[size], variants[variant]);
}

export function TiqButton({
  className,
  variant = 'primary',
  size = 'md',
  tooltip,
  loading = false,
  disabled,
  children,
  type,
  ...props
}: TiqButtonProps) {
  const isDisabled = disabled || loading;

  const spinner = (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block rounded-full border-2 border-current border-b-transparent animate-spin',
        size === 'icon' ? 'h-4 w-4' : 'h-4 w-4'
      )}
    />
  );

  const button = (
    <button
      type={type ?? 'button'}
      className={cn(styles(variant, size), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? spinner : null}
      {children}
    </button>
  );

  if (tooltip) {
    return (
      <span className="inline-flex" title={tooltip}>
        {button}
      </span>
    );
  }

  return button;
}
