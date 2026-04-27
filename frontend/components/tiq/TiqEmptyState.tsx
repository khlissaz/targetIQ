'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqEmptyStateProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function TiqEmptyState({ title, description, action, className }: TiqEmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-tiqLg border border-dashed border-tiq-border bg-tiq-surface px-4 py-8 text-center text-tiq-text',
        className
      )}
    >
      <div className="text-sm font-semibold text-tiq-navy">{title}</div>
      {description ? <div className="mt-1 text-sm text-tiq-muted">{description}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
