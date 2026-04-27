'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  containerClassName?: string;
};

export function TiqSelect({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  children,
  ...props
}: TiqSelectProps) {
  const autoId = React.useId();
  const selectId = id ?? autoId;

  return (
    <div className={cn('grid gap-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-tiq-navy">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'h-10 w-full appearance-none rounded-tiq border bg-tiq-surface px-3 pe-10 text-sm text-tiq-text',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tiq-primary/30 focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            error ? 'border-tiq-danger focus-visible:ring-tiq-danger/30' : 'border-tiq-border',
            className
          )}
          {...props}
        >
          {children}
        </select>

        <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-3 text-tiq-muted">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>

      {error ? (
        <div className="text-xs text-tiq-danger">{error}</div>
      ) : hint ? (
        <div className="text-xs text-tiq-muted">{hint}</div>
      ) : null}
    </div>
  );
}
