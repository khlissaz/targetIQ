'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  containerClassName?: string;
};

export function TiqInput({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  ...props
}: TiqInputProps) {
  const autoId = React.useId();
  const inputId = id ?? autoId;

  return (
    <div className={cn('grid gap-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-tiq-navy">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={cn(
          'h-10 w-full rounded-tiq border bg-tiq-surface px-3 text-sm text-tiq-text',
          'placeholder:text-tiq-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tiq-primary/30 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          error ? 'border-tiq-danger focus-visible:ring-tiq-danger/30' : 'border-tiq-border',
          className
        )}
        {...props}
      />

      {error ? (
        <div className="text-xs text-tiq-danger">{error}</div>
      ) : hint ? (
        <div className="text-xs text-tiq-muted">{hint}</div>
      ) : null}
    </div>
  );
}
