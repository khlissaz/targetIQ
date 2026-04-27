'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8',
        className,
      )}
    >
      {children}
    </div>
  );
}
