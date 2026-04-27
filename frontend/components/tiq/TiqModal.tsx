'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type TiqModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function TiqModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: TiqModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'border border-tiq-border bg-tiq-surface text-tiq-text shadow-tiq sm:rounded-tiqLg',
          className
        )}
      >
        {(title || description) && (
          <DialogHeader>
            {title ? <DialogTitle className="text-tiq-navy">{title}</DialogTitle> : null}
            {description ? (
              <DialogDescription className="text-tiq-muted">{description}</DialogDescription>
            ) : null}
          </DialogHeader>
        )}
        <div>{children}</div>
        {footer ? <div className="mt-2 flex items-center justify-end gap-2">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
