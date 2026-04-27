'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DrawerSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<DrawerSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

export interface DetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: DrawerSize;
  /** Slot rendered at the bottom of the drawer */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function DetailsDrawer({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
}: DetailsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className={cn('flex w-full flex-col p-0', sizeClass[size])}
      >
        {/* Header */}
        <SheetHeader className="flex-row items-start justify-between gap-3 border-b border-tiq-border px-5 py-4">
          <div className="min-w-0">
            <SheetTitle className="text-base font-semibold leading-5 text-tiq-navy">
              {title}
            </SheetTitle>
            {description && (
              <SheetDescription className="mt-0.5 text-sm text-tiq-muted">
                {description}
              </SheetDescription>
            )}
          </div>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </SheetClose>
        </SheetHeader>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-tiq-border px-5 py-4">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
