'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqTableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  containerClassName?: string;
};

export function TiqTable({ containerClassName, className, ...props }: TiqTableProps) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-tiqLg border border-tiq-border bg-tiq-surface', containerClassName)}>
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  );
}

export function TiqTableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-tiq-bg text-tiq-muted', className)} {...props} />;
}

export function TiqTableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-tiq-border', className)} {...props} />;
}

export function TiqTableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('hover:bg-tiq-bg/60', className)} {...props} />;
}

export function TiqTableHeaderCell({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-tiq-muted',
        className
      )}
      {...props}
    />
  );
}

export function TiqTableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-tiq-text', className)} {...props} />;
}
