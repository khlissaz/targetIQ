'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DetailsDrawer } from '@/components/tiq/DetailsDrawer';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqInput } from '@/components/tiq/TiqInput';
import { TiqSelect } from '@/components/tiq/TiqSelect';
import { isRealStripeId, CURRENCY_OPTIONS, INTERVAL_OPTIONS } from './billingUtils';
import type { AdminBillingPriceDto } from '@/lib/api';
import { adminBillingCreatePrice, adminBillingUpdatePrice } from '@/lib/api';
import { toast } from 'sonner';

// ─── Form state ───────────────────────────────────────────────────────────────

interface PriceForm {
  planCode: string;
  currency: string;
  billingInterval: string;
  amount: string;
  compareAtAmountMinor: string;
  checkoutEnabled: boolean;
  stripePriceId: string;
  internalPriceKey: string;
  isDefault: boolean;
}

function emptyForm(): PriceForm {
  return {
    planCode: '',
    currency: 'USD',
    billingInterval: 'MONTHLY',
    amount: '0.00',
    compareAtAmountMinor: '',
    checkoutEnabled: true,
    stripePriceId: '',
    internalPriceKey: '',
    isDefault: false,
  };
}

function priceToForm(p: AdminBillingPriceDto): PriceForm {
  return {
    planCode: p.planCode ?? '',
    currency: p.currency,
    billingInterval: p.billingInterval,
    amount: p.amount != null ? String(p.amount) : '0.00',
    compareAtAmountMinor: p.compareAtAmountMinor != null ? String(p.compareAtAmountMinor) : '',
    checkoutEnabled: p.checkoutEnabled !== false,
    stripePriceId: p.stripePriceId ?? '',
    internalPriceKey: p.internalPriceKey ?? '',
    isDefault: p.isDefault ?? false,
  };
}

function validate(form: PriceForm, isEdit: boolean): string | null {
  if (!isEdit && !form.planCode.trim()) return 'Plan code is required.';
  if (Number(form.amount) < 0) return 'Amount cannot be negative.';
  const sid = form.stripePriceId.trim();
  if (sid && !sid.startsWith('price_')) return 'Stripe Price ID must start with "price_".';
  if (sid && !isRealStripeId(sid)) return 'This looks like a placeholder ID. Paste the real ID from Stripe Dashboard (price_1...).';
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface BillingPriceFormDrawerProps {
  open: boolean;
  target: AdminBillingPriceDto | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BillingPriceFormDrawer({ open, target, onClose, onSaved }: BillingPriceFormDrawerProps) {
  const [form, setForm] = useState<PriceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm(target ? priceToForm(target) : emptyForm());
      setError(null);
    }
  }, [open, target]);

  function set<K extends keyof PriceForm>(k: K, v: PriceForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    const err = validate(form, !!target);
    if (err) { setError(err); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<AdminBillingPriceDto> = {
        currency: form.currency as 'USD' | 'SAR',
        billingInterval: form.billingInterval,
        amount: form.amount,
        compareAtAmountMinor: form.compareAtAmountMinor.trim() ? form.compareAtAmountMinor.trim() : null,
        checkoutEnabled: form.checkoutEnabled,
        stripePriceId: form.stripePriceId.trim() || null,
        internalPriceKey: form.internalPriceKey.trim() || null,
        isDefault: form.isDefault,
      };
      if (!target) {
        payload.planCode = form.planCode.trim().toUpperCase();
      }
      if (target) {
        await adminBillingUpdatePrice(target.id, payload);
        toast.success(`Price updated: ${target.planCode}/${target.currency}/${target.billingInterval}`);
      } else {
        await adminBillingCreatePrice(payload);
        toast.success(`Price created for ${payload.planCode}.`);
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
  const stripeIdFilled = form.stripePriceId.trim().length > 0;

  return (
    <DetailsDrawer
      open={open}
      onClose={onClose}
      title={target ? `Edit Price: ${target.planCode}/${target.currency}/${target.billingInterval}` : 'Create Plan Price'}
      description="Configure a pricing row for checkout."
      size="md"
      footer={
        <>
          <TiqButton variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</TiqButton>
          <TiqButton variant="primary" size="sm" loading={saving} onClick={handleSave}>
            {target ? 'Save Changes' : 'Create Price'}
          </TiqButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {/* Core dimensions */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">Price Dimensions</legend>
          <TiqInput
            label="Plan Code *"
            placeholder="e.g. STARTER"
            value={form.planCode}
            disabled={!!target}
            onChange={(e) => set('planCode', e.target.value.toUpperCase())}
            hint={target ? 'Plan / Currency / Interval cannot be changed.' : 'Must match an existing plan code.'}
          />
          <div className="grid grid-cols-2 gap-3">
            <TiqSelect
              label="Currency"
              value={form.currency}
              disabled={!!target}
              onChange={(e) => set('currency', e.target.value)}
            >
              {CURRENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </TiqSelect>
            <TiqSelect
              label="Billing Interval"
              value={form.billingInterval}
              disabled={!!target}
              onChange={(e) => set('billingInterval', e.target.value)}
            >
              {INTERVAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </TiqSelect>
          </div>
          <TiqInput
            label="Amount (e.g. 29.00)"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
          />
          <TiqInput
            label="Compare-at / Strikethrough Price (optional)"
            type="number"
            min="0"
            step="0.01"
            value={form.compareAtAmountMinor}
            placeholder="e.g. 39.00"
            onChange={(e) => set('compareAtAmountMinor', e.target.value)}
            hint="Shown as crossed-out price on the public pricing page. Must be higher than Amount."
          />
        </fieldset>

        {/* Stripe mapping */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">Provider Mapping</legend>

          {/* Stripe ID with live validation */}
          <div className="space-y-1">
            <TiqInput
              label="Stripe Price ID"
              placeholder="price_1AbcXyz..."
              value={form.stripePriceId}
              onChange={(e) => set('stripePriceId', e.target.value)}
            />
            {stripeIdFilled && (
              <div className={`flex items-center gap-1.5 text-xs ${stripeIdOk ? 'text-green-700' : 'text-amber-700'}`}>
                <AlertTriangle size={11} className={stripeIdOk ? 'hidden' : ''} />
                {stripeIdOk
                  ? '✓ Looks like a real Stripe ID.'
                  : 'This looks like a placeholder. Use a real price_1... ID from Stripe Dashboard.'}
              </div>
            )}
            {!stripeIdFilled && (
              <p className="text-xs text-tiq-muted">
                Leave blank to configure later. Required for checkout to work. Copy from{' '}
                <span className="font-mono">Stripe Dashboard → Products → Prices</span>.
              </p>
            )}
          </div>

          <TiqInput
            label="Internal Price Key"
            placeholder="STARTER_USD_MONTHLY"
            value={form.internalPriceKey}
            onChange={(e) => set('internalPriceKey', e.target.value.toUpperCase())}
            hint="Auto-generated from plan/currency/interval. Unique."
          />
        </fieldset>

        {/* Flags */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">Flags</legend>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefaultPrice"
              checked={form.isDefault}
              onChange={(e) => set('isDefault', e.target.checked)}
              className="h-4 w-4 accent-tiq-primary"
            />
            <label htmlFor="isDefaultPrice" className="text-sm text-tiq-text">
              Default price for this plan (shown first at checkout)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="checkoutEnabled"
              checked={form.checkoutEnabled}
              onChange={(e) => set('checkoutEnabled', e.target.checked)}
              className="h-4 w-4 accent-tiq-primary"
            />
            <label htmlFor="checkoutEnabled" className="text-sm text-tiq-text">
              Checkout enabled (uncheck to hide this plan from checkout)
            </label>
          </div>
        </fieldset>
      </div>
    </DetailsDrawer>
  );
}
