'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TiqBadge } from '@/components/tiq/TiqBadge';
import { isRealStripeId } from './billingUtils';

// ─── Status badge ─────────────────────────────────────────────────────────────

export function BillingStatusBadge({ active }: { active: boolean }) {
  return (
    <TiqBadge variant={active ? 'success' : 'neutral'}>
      {active ? 'Active' : 'Archived'}
    </TiqBadge>
  );
}

// ─── Stripe ID health badge ───────────────────────────────────────────────────

export function BillingStripeBadge({ id }: { id: string | null | undefined }) {
  if (!id) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertTriangle size={10} />
        Not set
      </span>
    );
  }
  if (isRealStripeId(id)) {
    return (
      <span
        className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-mono font-medium text-green-700"
        title={id}
      >
        <CheckCircle2 size={10} className="shrink-0" />
        {id}
      </span>
    );
  }
  return (
    <span
      className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-mono font-medium text-amber-700"
      title={id}
    >
      <AlertTriangle size={10} className="shrink-0" />
      {id}
    </span>
  );
}

// ─── Featured indicator ───────────────────────────────────────────────────────

export function FeaturedBadge({ featured }: { featured: boolean }) {
  if (!featured) return <span className="text-xs text-tiq-muted">—</span>;
  return (
    <TiqBadge variant="warn">★ Featured</TiqBadge>
  );
}

// ─── Interval badge ───────────────────────────────────────────────────────────

export function IntervalBadge({ interval }: { interval: string }) {
  const map: Record<string, { label: string; variant: 'primary' | 'info' | 'neutral' }> = {
    MONTHLY: { label: 'Monthly', variant: 'info' },
    YEARLY: { label: 'Yearly', variant: 'primary' },
    ONE_TIME: { label: 'One-Time', variant: 'neutral' },
  };
  const cfg = map[interval] ?? { label: interval, variant: 'neutral' as const };
  return <TiqBadge variant={cfg.variant}>{cfg.label}</TiqBadge>;
}

// ─── Default indicator ────────────────────────────────────────────────────────

export function DefaultBadge({ isDefault }: { isDefault: boolean }) {
  if (!isDefault) return <span className="text-xs text-tiq-muted">—</span>;
  return <TiqBadge variant="success">Default</TiqBadge>;
}
