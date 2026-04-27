'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Slot for top-right action buttons */
  actions?: React.ReactNode;
  /** Optional meta row (badges, breadcrumbs, etc.) */
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, meta, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {meta && <div className="mb-2 flex flex-wrap items-center gap-2">{meta}</div>}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-tiq-navy">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-tiq-muted">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
