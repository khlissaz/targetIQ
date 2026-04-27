'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqShellProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
};

export function TiqShell({
  className,
  title,
  subtitle,
  headerActions,
  footer,
  children,
  ...props
}: TiqShellProps) {
  return (
    <div
      className={cn(
        'rounded-tiqLg border border-tiq-border bg-tiq-bg shadow-tiqLg',
        'text-tiq-text',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerActions) && (
        <div className="border-b border-tiq-border bg-tiq-surface px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {title ? <div className="text-sm font-semibold leading-5 text-tiq-navy">{title}</div> : null}
              {subtitle ? <div className="mt-0.5 text-xs text-tiq-muted">{subtitle}</div> : null}
            </div>
            {headerActions ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
          </div>
        </div>
      )}

      <div className="p-3">{children}</div>

      {footer ? <div className="border-t border-tiq-border bg-tiq-surface px-3 py-2">{footer}</div> : null}
    </div>
  );
}
