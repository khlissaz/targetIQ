'use client';

import React, { useState } from 'react';
import { DetailsDrawer } from '@/components/tiq/DetailsDrawer';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqInput } from '@/components/tiq/TiqInput';
import { TiqSelect } from '@/components/tiq/TiqSelect';
import { BILLING_MODEL_OPTIONS } from './billingUtils';
import type { AdminBillingPlanDto } from '@/lib/api';
import {
  adminBillingCreatePlan,
  adminBillingUpdatePlan,
} from '@/lib/api';
import { toast } from 'sonner';

// ─── Form state ───────────────────────────────────────────────────────────────

interface PlanForm {
  code: string;
  nameEn: string;
  nameAr: string;
  subtitleEn: string;
  subtitleAr: string;
  descEn: string;
  descAr: string;
  badgeLabelEn: string;
  badgeLabelAr: string;
  billingModelType: string;
  creditsMonthly: string;
  teamEnabled: boolean;
  teamLimit: string;
  displayOrder: string;
  isFeatured: boolean;
  isVisible: boolean;
}

function emptyForm(): PlanForm {
  return {
    code: '',
    nameEn: '',
    nameAr: '',
    subtitleEn: '',
    subtitleAr: '',
    descEn: '',
    descAr: '',
    badgeLabelEn: '',
    badgeLabelAr: '',
    billingModelType: 'subscription',
    creditsMonthly: '0',
    teamEnabled: false,
    teamLimit: '',
    displayOrder: '0',
    isFeatured: false,
    isVisible: true,
  };
}

function planToForm(p: AdminBillingPlanDto): PlanForm {
  return {
    code: p.code,
    nameEn: p.nameI18n?.en ?? '',
    nameAr: p.nameI18n?.ar ?? '',
    subtitleEn: p.subtitleI18n?.en ?? '',
    subtitleAr: p.subtitleI18n?.ar ?? '',
    descEn: p.descriptionI18n?.en ?? '',
    descAr: p.descriptionI18n?.ar ?? '',
    badgeLabelEn: p.badgeLabelI18n?.en ?? '',
    badgeLabelAr: p.badgeLabelI18n?.ar ?? '',
    billingModelType: p.billingModelType ?? 'subscription',
    creditsMonthly: String(p.creditsMonthly ?? 0),
    teamEnabled: p.teamEnabled ?? false,
    teamLimit: p.teamLimit != null ? String(p.teamLimit) : '',
    displayOrder: String(p.displayOrder ?? 0),
    isFeatured: p.isFeatured ?? false,
    isVisible: p.isVisible !== false,
  };
}

function validate(form: PlanForm): string | null {
  if (!form.code.trim()) return 'Plan code is required.';
  if (!/^[A-Z0-9_-]+$/.test(form.code.trim().toUpperCase())) return 'Code must be uppercase letters, numbers, hyphens, or underscores.';
  if (!form.nameEn.trim()) return 'English name is required.';
  if (Number(form.creditsMonthly) < 0) return 'Credits/month cannot be negative.';
  if (Number(form.displayOrder) < 0) return 'Display order cannot be negative.';
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface BillingPlanFormDrawerProps {
  open: boolean;
  target: AdminBillingPlanDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BillingPlanFormDrawer({ open, target, onClose, onSaved }: BillingPlanFormDrawerProps) {
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form when drawer opens
  React.useEffect(() => {
    if (open) {
      setForm(target ? planToForm(target) : emptyForm());
      setError(null);
    }
  }, [open, target]);

  function set<K extends keyof PlanForm>(k: K, v: PlanForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    const err = validate(form);
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        nameI18n: { en: form.nameEn.trim(), ar: form.nameAr.trim() },
        subtitleI18n: form.subtitleEn.trim() ? { en: form.subtitleEn.trim(), ar: form.subtitleAr.trim() } : null,
        descriptionI18n: { en: form.descEn.trim(), ar: form.descAr.trim() },
        badgeLabelI18n: form.badgeLabelEn.trim() ? { en: form.badgeLabelEn.trim(), ar: form.badgeLabelAr.trim() } : null,
        billingModelType: form.billingModelType,
        creditsMonthly: Number(form.creditsMonthly),
        teamEnabled: form.teamEnabled,
        teamLimit: form.teamEnabled && form.teamLimit ? Number(form.teamLimit) : null,
        displayOrder: Number(form.displayOrder),
        isFeatured: form.isFeatured,
        isVisible: form.isVisible,
      };
      if (target) {
        await adminBillingUpdatePlan(target.id, payload);
        toast.success(`Plan ${payload.code} updated.`);
      } else {
        await adminBillingCreatePlan(payload);
        toast.success(`Plan ${payload.code} created.`);
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DetailsDrawer
      open={open}
      onClose={onClose}
      title={target ? `Edit Plan: ${target.code}` : 'Create Plan'}
      description={target ? 'Update billing plan configuration.' : 'Add a new billing plan.'}
      size="md"
      footer={
        <>
          <TiqButton variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</TiqButton>
          <TiqButton variant="primary" size="sm" loading={saving} onClick={handleSave}>
            {target ? 'Save Changes' : 'Create Plan'}
          </TiqButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {/* Identity */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">Identity</legend>
          <TiqInput
            label="Plan Code *"
            placeholder="e.g. STARTER"
            value={form.code}
            disabled={!!target}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            hint={target ? 'Code cannot be changed after creation.' : 'Uppercase letters, numbers, hyphens only.'}
          />
          <div className="grid grid-cols-2 gap-3">
            <TiqInput label="Name (English) *" value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
            <TiqInput label="Name (Arabic)" value={form.nameAr} dir="rtl" onChange={(e) => set('nameAr', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TiqInput label="Subtitle (EN)" value={form.subtitleEn} placeholder="Short tagline" onChange={(e) => set('subtitleEn', e.target.value)} />
            <TiqInput label="Subtitle (AR)" value={form.subtitleAr} dir="rtl" onChange={(e) => set('subtitleAr', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TiqInput label="Description (EN)" value={form.descEn} onChange={(e) => set('descEn', e.target.value)} />
            <TiqInput label="Description (AR)" value={form.descAr} dir="rtl" onChange={(e) => set('descAr', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TiqInput
              label="Badge Label (EN)"
              value={form.badgeLabelEn}
              placeholder='e.g. Most Popular'
              onChange={(e) => set('badgeLabelEn', e.target.value)}
              hint="Shown on the plan card when isFeatured."
            />
            <TiqInput label="Badge Label (AR)" value={form.badgeLabelAr} dir="rtl" onChange={(e) => set('badgeLabelAr', e.target.value)} />
          </div>
        </fieldset>

        {/* Billing */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">Billing</legend>
          <TiqSelect
            label="Billing Model"
            value={form.billingModelType}
            onChange={(e) => set('billingModelType', e.target.value)}
          >
            {BILLING_MODEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </TiqSelect>
          <TiqInput
            label="Credits / Month"
            type="number"
            min="0"
            value={form.creditsMonthly}
            onChange={(e) => set('creditsMonthly', e.target.value)}
          />
        </fieldset>

        {/* Team */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">Team</legend>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="teamEnabled"
              checked={form.teamEnabled}
              onChange={(e) => set('teamEnabled', e.target.checked)}
              className="h-4 w-4 accent-tiq-primary"
            />
            <label htmlFor="teamEnabled" className="text-sm text-tiq-text">Team accounts enabled</label>
          </div>
          {form.teamEnabled && (
            <TiqInput
              label="Max Team Members (blank = unlimited)"
              type="number"
              min="1"
              value={form.teamLimit}
              placeholder="e.g. 5"
              onChange={(e) => set('teamLimit', e.target.value)}
            />
          )}
        </fieldset>

        {/* Display */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">Display</legend>
          <TiqInput
            label="Display Order"
            type="number"
            min="0"
            value={form.displayOrder}
            onChange={(e) => set('displayOrder', e.target.value)}
            hint="Lower number = shown first on pricing page."
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={form.isFeatured}
              onChange={(e) => set('isFeatured', e.target.checked)}
              className="h-4 w-4 accent-tiq-primary"
            />
            <label htmlFor="isFeatured" className="text-sm text-tiq-text">
              ★ Featured / Most Popular — highlighted on pricing page
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isVisible"
              checked={form.isVisible}
              onChange={(e) => set('isVisible', e.target.checked)}
              className="h-4 w-4 accent-tiq-primary"
            />
            <label htmlFor="isVisible" className="text-sm text-tiq-text">
              Visible on public pricing page
            </label>
          </div>
        </fieldset>
      </div>
    </DetailsDrawer>
  );
}
