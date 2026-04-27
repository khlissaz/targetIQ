'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqIconButtonVariant = 'ghost' | 'outline';

export type TiqIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: TiqIconButtonVariant;
  tooltip?: string;
};

function styles(variant: TiqIconButtonVariant) {
  const base = cn(
    'inline-flex items-center justify-center gap-2 font-semibold',
    'h-11 w-11 rounded-tiq p-0',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tiq-primary/30 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50'
  );

  const variants: Record<TiqIconButtonVariant, string> = {
    ghost: cn('bg-transparent text-tiq-navy', 'hover:bg-tiq-primary/10'),
    outline: cn('border border-tiq-border bg-tiq-surface text-tiq-navy', 'hover:bg-tiq-primary/10'),
  };

  return cn(base, variants[variant]);
}

export function TiqIconButton({
  className,
  variant = 'ghost',
  tooltip,
  disabled,
  children,
  type,
  ...props
}: TiqIconButtonProps) {
  const button = (
    <button
      type={type ?? 'button'}
      className={cn(styles(variant), className)}
      disabled={disabled}
      {...props}
    >
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
