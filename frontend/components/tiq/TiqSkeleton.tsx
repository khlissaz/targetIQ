'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TiqSkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function TiqSkeleton({ className, ...props }: TiqSkeletonProps) {
  return <div className={cn('animate-pulse rounded-tiq bg-tiq-border/50', className)} {...props} />;
}
