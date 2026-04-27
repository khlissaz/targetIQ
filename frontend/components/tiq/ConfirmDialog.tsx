'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  /** Shows red confirm button and destructive framing */
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  destructive = false,
  confirmLabel,
  cancelLabel,
  loading = false,
}: ConfirmDialogProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            className={cn(destructive && 'text-tiq-danger')}
          >
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={onClose}>
            {cancelLabel ?? t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={onConfirm}
            className={cn(
              'gap-1.5',
              destructive
                ? 'bg-tiq-danger text-white hover:bg-tiq-danger/90 focus-visible:ring-tiq-danger'
                : 'bg-tiq-primary text-white hover:bg-tiq-primary/90 focus-visible:ring-tiq-primary',
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel ?? t('common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
