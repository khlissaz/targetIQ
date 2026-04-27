'use client';

import React, { useState } from 'react';
import { DetailsDrawer } from '@/components/tiq/DetailsDrawer';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqInput } from '@/components/tiq/TiqInput';
import type { AdminBillingFeatureDto } from '@/lib/api';
import { adminBillingCreateFeature, adminBillingUpdateFeature } from '@/lib/api';
import { toast } from 'sonner';

interface FeatureForm {
  code: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  displayOrder: string;
}

function emptyForm(): FeatureForm {
  return { code: '', labelEn: '', labelAr: '', descEn: '', descAr: '', displayOrder: '0' };
}

function featureToForm(f: AdminBillingFeatureDto): FeatureForm {
  return {
    code: f.code,
    labelEn: f.labelI18n?.en ?? '',
    labelAr: (f.labelI18n as any)?.ar ?? '',
    descEn: f.descriptionI18n?.en ?? '',
    descAr: (f.descriptionI18n as any)?.ar ?? '',
    displayOrder: String(f.displayOrder ?? 0),
  };
}

function validate(form: FeatureForm, isEdit: boolean): string | null {
  if (!isEdit && !form.code.trim()) return 'Feature code is required.';
  if (!form.labelEn.trim()) return 'English label is required.';
  return null;
}

export interface BillingFeatureFormDrawerProps {
  open: boolean;
  planCode: string;
  target: AdminBillingFeatureDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BillingFeatureFormDrawer({ open, planCode, target, onClose, onSaved }: BillingFeatureFormDrawerProps) {
  const [form, setForm] = useState<FeatureForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(target ? featureToForm(target) : emptyForm());
      setError(null);
    }
  }, [open, target]);

  function set<K extends keyof FeatureForm>(k: K, v: FeatureForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    const err = validate(form, !!target);
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      const labelI18n = { en: form.labelEn.trim(), ar: form.labelAr.trim() || undefined };
      const descriptionI18n = (form.descEn.trim() || form.descAr.trim())
        ? { en: form.descEn.trim(), ar: form.descAr.trim() || undefined }
        : null;

      if (target) {
        await adminBillingUpdateFeature(target.id, { labelI18n, descriptionI18n, displayOrder: Number(form.displayOrder) });
        toast.success('Feature updated');
      } else {
        await adminBillingCreateFeature(planCode, { code: form.code.trim(), labelI18n, descriptionI18n, displayOrder: Number(form.displayOrder) });
        toast.success('Feature created');
      }
      onSaved();
      onClose();
    } catch (e: any) {
      const msg = e?.message ?? 'Failed to save feature';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!target;
  const title = isEdit ? `Edit Feature: ${target?.code}` : `Add Feature to ${planCode}`;

  return (
    <DetailsDrawer open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4 p-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!isEdit && (
          <TiqInput
            label="Feature Code"
            value={form.code}
            onChange={(e) => set('code', (e as React.ChangeEvent<HTMLInputElement>).target.value)}
            placeholder="e.g. api_access"
            disabled={saving}
          />
        )}

        <TiqInput
          label="Label (English)"
          value={form.labelEn}
          onChange={(e) => set('labelEn', (e as React.ChangeEvent<HTMLInputElement>).target.value)}
          placeholder="E.g. API Access"
          disabled={saving}
        />
        <TiqInput
          label="Label (Arabic)"
          value={form.labelAr}
          onChange={(e) => set('labelAr', (e as React.ChangeEvent<HTMLInputElement>).target.value)}
          placeholder="Arabic label (optional)"
          disabled={saving}
        />
        <TiqInput
          label="Description (English)"
          value={form.descEn}
          onChange={(e) => set('descEn', (e as React.ChangeEvent<HTMLInputElement>).target.value)}
          placeholder="Optional description"
          disabled={saving}
        />
        <TiqInput
          label="Description (Arabic)"
          value={form.descAr}
          onChange={(e) => set('descAr', (e as React.ChangeEvent<HTMLInputElement>).target.value)}
          placeholder="Arabic description (optional)"
          disabled={saving}
        />
        <TiqInput
          label="Display Order"
          type="number"
          value={form.displayOrder}
          onChange={(e) => set('displayOrder', (e as React.ChangeEvent<HTMLInputElement>).target.value)}
          disabled={saving}
        />

        <div className="flex gap-2 justify-end pt-2">
          <TiqButton variant="ghost" onClick={onClose} disabled={saving}>Cancel</TiqButton>
          <TiqButton variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Feature'}
          </TiqButton>
        </div>
      </div>
    </DetailsDrawer>
  );
}
