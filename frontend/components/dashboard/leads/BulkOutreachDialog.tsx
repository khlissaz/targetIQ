'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

interface OutreachPreview {
  total?: number;
  eligible?: number;
  ineligible?: number;
  alreadyConverted?: number;
  withEmail?: number;
  withPhone?: number;
}

function normalizePreview(raw: any): OutreachPreview | null {
  if (!raw) return null;
  return {
    total: raw.total ?? (raw.eligibleCount ?? 0) + (raw.ineligibleCount ?? 0),
    eligible: raw.eligible ?? raw.eligibleCount ?? 0,
    ineligible: raw.ineligible ?? raw.ineligibleCount ?? 0,
    alreadyConverted: raw.alreadyConverted ?? 0,
    withEmail: raw.withEmail ?? 0,
    withPhone: raw.withPhone ?? 0,
  };
}

interface BulkOutreachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: OutreachPreview | null;
  loading: boolean;
  onConfirm: () => Promise<void>;
}

export function BulkOutreachDialog({
  open,
  onOpenChange,
  preview,
  loading,
  onConfirm,
}: BulkOutreachDialogProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const normalizedPreview = normalizePreview(preview);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-tiqLg">
        <DialogHeader>
          <DialogTitle className="text-tiq-navy text-lg font-bold">
            {t('bulkOutreach.previewTitle') || 'Convert Leads to Outreach'}
          </DialogTitle>
          <DialogDescription>
            {t('bulkOutreach.previewDescription') || 'Review eligibility before converting'}
          </DialogDescription>
        </DialogHeader>

        {normalizedPreview && (
          <div className="grid grid-cols-2 gap-3 py-4">
            {[
              { label: t('bulkOutreach.total') || 'Total selected', value: normalizedPreview.total ?? 0 },
              {
                label: t('bulkOutreach.eligible') || 'Eligible',
                value: normalizedPreview.eligible ?? 0,
                accent: 'text-tiq-success',
              },
              {
                label: t('bulkOutreach.ineligible') || 'Ineligible',
                value: normalizedPreview.ineligible ?? 0,
                accent: 'text-tiq-danger',
              },
              {
                label: t('bulkOutreach.alreadyConverted') || 'Already converted',
                value: normalizedPreview.alreadyConverted ?? 0,
              },
              { label: t('bulkOutreach.withEmail') || 'Have email', value: normalizedPreview.withEmail ?? 0 },
              { label: t('bulkOutreach.withPhone') || 'Have phone', value: normalizedPreview.withPhone ?? 0 },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center rounded-xl border border-tiq-border bg-tiq-surface p-3"
              >
                <span className={`text-2xl font-bold ${accent ?? 'text-tiq-navy'}`}>{value}</span>
                <span className="mt-1 text-center text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || !normalizedPreview?.eligible}
            className="bg-tiq-primary text-white hover:bg-tiq-primary/90"
          >
            <Send className="me-2 h-4 w-4" />
            {loading
              ? t('converting') || 'Converting…'
              : t('bulkOutreach.confirm') || `Convert ${normalizedPreview?.eligible ?? 0} leads`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
