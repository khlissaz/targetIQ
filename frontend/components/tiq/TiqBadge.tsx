'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqBadgeVariant =
  | 'default'
  | 'info'
  | 'success'
  | 'warn'
  | 'error'
  // Back-compat / existing usages
  | 'neutral'
  | 'primary'
  | 'warning'
  | 'danger';

const variantStyles: Record<TiqBadgeVariant, string> = {
  default: 'bg-tiq-bg text-tiq-muted border-tiq-border',
  info: 'bg-tiq-info/10 text-tiq-navy border-tiq-info/25',
  neutral: 'bg-tiq-bg text-tiq-muted border-tiq-border',
  primary: 'bg-tiq-primary/10 text-tiq-primary border-tiq-primary/20',
  success: 'bg-tiq-success/10 text-tiq-success border-tiq-success/20',
  warn: 'bg-tiq-warning/10 text-tiq-navy border-tiq-warning/25',
  warning: 'bg-tiq-warning/10 text-tiq-navy border-tiq-warning/25',
  error: 'bg-tiq-danger/10 text-tiq-danger border-tiq-danger/20',
  danger: 'bg-tiq-danger/10 text-tiq-danger border-tiq-danger/20',
};

export type TiqBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: TiqBadgeVariant;
};

export function TiqBadge({ className, variant = 'neutral', ...props }: TiqBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
