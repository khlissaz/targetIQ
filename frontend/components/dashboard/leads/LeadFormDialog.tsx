'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { LeadFormValues } from '@/lib/mappers/lead.mapper';

export interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: 'add' | 'edit';
  values: LeadFormValues;
  onChange: (v: LeadFormValues) => void;
  onSubmit: () => Promise<void> | void;
  loading?: boolean;
}

export function LeadFormDialog({
  open,
  onOpenChange,
  mode,
  values,
  onChange,
  onSubmit,
  loading = false,
}: LeadFormDialogProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const set = (field: keyof LeadFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => onChange({ ...values, [field]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? t('addLead') : t('editLead')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="fullName">{t('lead.name')}</Label>
            <Input
              id="fullName"
              value={values.fullName}
              onChange={set('fullName')}
              placeholder={t('lead.name')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email">{t('lead.email')}</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={set('email')}
                placeholder={t('lead.email')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">{t('lead.phone')}</Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={set('phone')}
                placeholder={t('lead.phone')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="company">{t('lead.company')}</Label>
              <Input
                id="company"
                value={values.company}
                onChange={set('company')}
                placeholder={t('lead.company')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="jobTitle">{t('lead.jobTitle') ?? 'Job Title'}</Label>
              <Input
                id="jobTitle"
                value={values.jobTitle}
                onChange={set('jobTitle')}
                placeholder={t('lead.jobTitle') ?? 'Job title'}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="status">{t('lead.status')}</Label>
            <Select
              value={values.status}
              onValueChange={(v) => onChange({ ...values, status: v })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">{t('new')}</SelectItem>
                <SelectItem value="contacted">{t('contacted')}</SelectItem>
                <SelectItem value="qualified">{t('qualified')}</SelectItem>
                <SelectItem value="converted">{t('converted')}</SelectItem>
                <SelectItem value="lost">{t('lost')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">{t('lead.notes') ?? 'Notes'}</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={set('notes')}
              placeholder={t('lead.notes') ?? 'Notes'}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-tiq-primary hover:opacity-95"
              disabled={loading}
            >
              {loading ? t('loading') : mode === 'add' ? t('addLead') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
