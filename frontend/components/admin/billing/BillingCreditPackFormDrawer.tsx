'use client';

import React, { useState } from 'react';
import { DetailsDrawer } from '@/components/tiq/DetailsDrawer';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqInput } from '@/components/tiq/TiqInput';
import { TiqSelect } from '@/components/tiq/TiqSelect';
import { isRealStripeId, CURRENCY_OPTIONS } from './billingUtils';
import type { AdminCreditPackDto } from '@/lib/api';
import { adminBillingCreatePack, adminBillingUpdatePack } from '@/lib/api';
import { toast } from 'sonner';

// ─── Form state ───────────────────────────────────────────────────────────────

interface PackForm {
  code: string;
  name: string;
  creditsAmount: string;
  currency: string;
  amountMinor: string;
  stripePriceId: string;
  internalPriceKey: string;
  displayOrder: string;
  isVisible: boolean;
}

function emptyForm(): PackForm {
  return {
    code: '',
    name: '',
    creditsAmount: '100',
    currency: 'USD',
    amountMinor: '10.00',
    stripePriceId: '',
    internalPriceKey: '',
    displayOrder: '0',
    isVisible: true,
  };
}

function packToForm(p: AdminCreditPackDto): PackForm {
  return {
    code: p.code,
    name: p.name ?? '',
    creditsAmount: String(p.creditsAmount),
    currency: p.currency,
    amountMinor: p.amountMinor != null ? String(p.amountMinor) : '0.00',
    stripePriceId: p.stripePriceId ?? '',
    internalPriceKey: p.internalPriceKey ?? '',
    displayOrder: String(p.displayOrder ?? 0),
    isVisible: p.isVisible !== false,
  };
}

function validate(form: PackForm, isEdit: boolean): string | null {
  if (!isEdit && !form.code.trim()) return 'Pack code is required.';
  if (Number(form.creditsAmount) <= 0) return 'Credits amount must be positive.';
  if (Number(form.amountMinor) < 0) return 'Price cannot be negative.';
  const sid = form.stripePriceId.trim();
  if (sid && !sid.startsWith('price_')) return 'Stripe Price ID must start with "price_".';
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface BillingCreditPackFormDrawerProps {
  open: boolean;
  target: AdminCreditPackDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BillingCreditPackFormDrawer({ open, target, onClose, onSaved }: BillingCreditPackFormDrawerProps) {
  const [form, setForm] = useState<PackForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(target ? packToForm(target) : emptyForm());
      setError(null);
    }
  }, [open, target]);

  function set<K extends keyof PackForm>(k: K, v: PackForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    const err = validate(form, !!target);
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<AdminCreditPackDto> = {
        name: form.name.trim() || null,
        creditsAmount: Number(form.creditsAmount),
        amountMinor: form.amountMinor,
        stripePriceId: form.stripePriceId.trim() || null,
        internalPriceKey: form.internalPriceKey.trim() || null,
        displayOrder: Number(form.displayOrder),
        isVisible: form.isVisible,
      };
      if (!target) {
        payload.code = form.code.trim().toUpperCase();
        payload.currency = form.currency as 'USD' | 'SAR';
      }
      if (target) {
        await adminBillingUpdatePack(target.id, payload);
        toast.success(`Pack ${target.code} updated.`);
      } else {
        await adminBillingCreatePack(payload);
        toast.success(`Pack ${(payload as AdminCreditPackDto).code} created.`);
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

  const stripeIdOk = isRealStripeId(form.stripePriceId);

  return (
    <DetailsDrawer
      open={open}
      onClose={onClose}
      title={target ? `Edit Pack: ${target.code}` : 'Create Credit Pack'}
      description="Add-on credits available for one-time purchase."
      size="md"
      footer={
        <>
          <TiqButton variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</TiqButton>
          <TiqButton variant="primary" size="sm" loading={saving} onClick={handleSave}>
            {target ? 'Save Changes' : 'Create Pack'}
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
            label="Pack Code *"
            placeholder="e.g. PACK_100_USD"
            value={form.code}
            disabled={!!target}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            hint={target ? 'Code cannot be changed.' : 'Convention: PACK_{credits}_{currency}'}
          />
          <TiqInput
            label="Display Name"
            placeholder="e.g. +100 Credits"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </fieldset>

        {/* Credits & pricing */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">Credits & Pricing</legend>
          <div className="grid grid-cols-2 gap-3">
            <TiqInput
              label="Credits Amount"
              type="number"
              min="1"
              value={form.creditsAmount}
              onChange={(e) => set('creditsAmount', e.target.value)}
            />
            <TiqSelect
              label="Currency"
              value={form.currency}
              disabled={!!target}
              onChange={(e) => set('currency', e.target.value)}
            >
              {CURRENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </TiqSelect>
          </div>
          <TiqInput
            label="Price (e.g. 10.00)"
            type="number"
            min="0"
            step="0.01"
            value={form.amountMinor}
            onChange={(e) => set('amountMinor', e.target.value)}
          />
        </fieldset>

        {/* Provider mapping */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">Provider Mapping</legend>
          <div className="space-y-1">
            <TiqInput
              label="Stripe Price ID"
              placeholder="price_1AbcXyz..."
              value={form.stripePriceId}
              onChange={(e) => set('stripePriceId', e.target.value)}
            />
            {form.stripePriceId.trim() && (
              <p className={`text-xs ${stripeIdOk ? 'text-green-700' : 'text-amber-700'}`}>
                {stripeIdOk ? '✓ Real Stripe ID.' : '⚠ Looks like a placeholder — use price_1... from Stripe Dashboard.'}
              </p>
            )}
          </div>
          <TiqInput
            label="Internal Price Key"
            placeholder="PACK_100_USD"
            value={form.internalPriceKey}
            onChange={(e) => set('internalPriceKey', e.target.value.toUpperCase())}
          />
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
            hint="Lower number = shown first."
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="packIsVisible"
              checked={form.isVisible}
              onChange={(e) => set('isVisible', e.target.checked)}
              className="h-4 w-4 accent-tiq-primary"
            />
            <label htmlFor="packIsVisible" className="text-sm text-tiq-text">
              Visible on public add-ons / pricing page
            </label>
          </div>
        </fieldset>
      </div>
    </DetailsDrawer>
  );
}
