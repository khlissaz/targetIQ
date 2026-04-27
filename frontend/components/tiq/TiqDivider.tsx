'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqDividerProps = React.HTMLAttributes<HTMLDivElement>;

export function TiqDivider({ className, ...props }: TiqDividerProps) {
  return <div className={cn('h-px w-full bg-tiq-border', className)} role="separator" {...props} />;
}
