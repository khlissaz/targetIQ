'use client';

import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { PricingPlan } from '@/services/billingServices';

function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/** Determine CTA state for a plan card relative to the current plan — handled inline in component */

export function PricingCards({
  plans,
  interval,
  loadingPlan,
  onCheckout,
  labels,
  currentPlanCode = null,
  isLoggedIn = false,
}: {
  plans: PricingPlan[];
  interval: 'MONTHLY' | 'YEARLY';
  loadingPlan: string | null;
  onCheckout: (plan: PricingPlan) => void | Promise<void>;
  labels: {
    monthly: string;
    yearly: string;
    mostPopular: string;
    free: string;
    getStarted: string;
    currentFlow: string;
    contactSales: string;
    capture: string;
    enrich: string;
    team: string;
    noTeam: string;
    unlimited: string;
    upTo: (count: number) => string;
    upgrade?: string;
    downgrade?: string;
    currentPlan?: string;
    selected?: string;
  };
  /** Currently active plan code for the logged-in user, or null */
  currentPlanCode?: string | null;
  /** Whether the user is authenticated */
  isLoggedIn?: boolean;
}) {
  // Sort by displayOrder (DB-driven), fall back to amount ascending
  const sorted = [...plans].sort((a, b) => {
    const od = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    if (od !== 0) return od;
    return Number(a.amount ?? 0) - Number(b.amount ?? 0);
  });

  // Build a displayOrder map for upgrade/downgrade detection
  const orderMap = new Map(sorted.map((p) => [p.planCode.toUpperCase(), p.displayOrder ?? 0]));
  const currentOrder = currentPlanCode ? (orderMap.get(currentPlanCode.toUpperCase()) ?? -1) : -1;

  function uniqueFeatures(features: string[] = []) {
    const seen = new Set<string>();
    return features.filter((feature) => {
      const key = String(feature || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function getCta(plan: PricingPlan): 'current' | 'upgrade' | 'downgrade' | 'get_started' | 'contact_sales' {
    const isPlanFree = plan.billingModelType === 'free' || Number(plan.amount ?? 0) === 0 || plan.planCode.toUpperCase() === 'FREE';
    if (isLoggedIn && currentPlanCode?.toUpperCase() === plan.planCode.toUpperCase()) return 'current';
    if (isPlanFree) return 'get_started';
    // Enterprise / custom plans always go to contact sales.
    if (!plan.selfServeEnabled) return 'contact_sales';
    if (!plan.checkoutEnabled) {
      // No Stripe price configured (or free plan with no checkout).
      // Show "Current" if user is already on this plan; free plans get "Get Started" (signup); paid → contact sales.
      if (plan.billingModelType === 'free' || Number(plan.amount ?? 0) === 0) return 'get_started';
      return 'contact_sales';
    }
    if (!isLoggedIn) return 'get_started';
    if (!currentPlanCode) return 'get_started';
    const planCode = plan.planCode.toUpperCase();
    const currCode = currentPlanCode.toUpperCase();
    if (planCode === currCode) return 'current';
    const thisOrder = plan.displayOrder ?? 0;
    if (thisOrder > currentOrder) return 'upgrade';
    return 'downgrade';
  }

  function getCtaLabel(cta: ReturnType<typeof getCta>): string {
    switch (cta) {
      case 'current': return labels.currentPlan ?? 'Current plan';
      case 'upgrade': return labels.upgrade ?? 'Upgrade';
      case 'downgrade': return labels.downgrade ?? 'Downgrade';
      case 'contact_sales': return labels.contactSales;
      default: return labels.getStarted;
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {sorted.map((plan) => {
        const cta = getCta(plan);
        const ctaLabel = getCtaLabel(cta);
        const isHighlighted = plan.isFeatured === true;
        const isFree = Number(plan.amount ?? 0) === 0 || plan.billingModelType === 'free' || plan.planCode.toUpperCase() === 'FREE';
        const rawBadge = plan.badgeLabel ?? (isHighlighted ? labels.mostPopular : null);
        const badgeText = isFree && String(rawBadge || '').toLowerCase().includes('contact') ? labels.free : rawBadge;
        const isLoading = loadingPlan === plan.planCode;
        // compareAtAmountMinor can come from DB as minor units (23988) or display units (239.88).
        const rawCompareAt = plan.compareAtAmountMinor != null ? Number(plan.compareAtAmountMinor) : null;
        const stripedAmount = rawCompareAt != null
          ? rawCompareAt > Number(plan.amount ?? 0) * 10
            ? rawCompareAt / 100
            : rawCompareAt
          : null;
        return (
          <Card
            key={plan.planCode}
            className={`relative flex h-full flex-col border ${
              isHighlighted ? 'border-tiq-primary shadow-lg' : 'border-tiq-border'
            } ${cta === 'current' ? 'ring-2 ring-tiq-primary/20' : ''}`}
          >
            {badgeText ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-tiq-primary px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
                {badgeText}
              </div>
            ) : null}
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xl text-tiq-navy">{plan.name}</CardTitle>
                {isFree ? (
                  <span className="rounded-full bg-tiq-primary/10 px-2 py-1 text-xs font-semibold text-tiq-primary">
                    {labels.free}
                  </span>
                ) : null}
              </div>
              {plan.subtitle ? (
                <p className="text-xs text-tiq-muted mt-0.5">{plan.subtitle}</p>
              ) : null}
              <CardDescription>{plan.description || labels.currentFlow}</CardDescription>
              <div className="pt-3">
                {cta === 'contact_sales' ? (
                  <div className="text-3xl font-bold text-tiq-navy">{labels.contactSales}</div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    {stripedAmount != null ? (
                      <span className="text-base text-tiq-muted line-through">
                        {formatPrice(stripedAmount, plan.currency)}
                      </span>
                    ) : null}
                    <span className="text-3xl font-bold text-tiq-navy">
                      {formatPrice(plan.amount, plan.currency)}
                    </span>
                  </div>
                )}
                <div className="text-sm text-tiq-muted">
                  /{interval === 'YEARLY' ? labels.yearly : labels.monthly}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <div className="grid gap-2 rounded-xl bg-tiq-bg p-4 text-sm text-tiq-muted">
                <div className="flex items-center justify-between gap-3">
                  <span>{labels.capture}</span>
                  <strong className="text-tiq-navy">{plan.monthlyCapture ?? '—'}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{labels.enrich}</span>
                  <strong className="text-tiq-navy">{plan.monthlyEnrich ?? '—'}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{labels.team}</span>
                  <strong className="text-tiq-navy">
                    {plan.teamEnabled
                      ? plan.teamLimit == null
                        ? labels.unlimited
                        : labels.upTo(plan.teamLimit)
                      : labels.noTeam}
                  </strong>
                </div>
              </div>
              <ul className="grid gap-2 text-sm text-tiq-muted">
                {uniqueFeatures(plan.features).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-tiq-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                {cta === 'current' ? (
                  <div className="w-full rounded-xl border border-tiq-primary/30 bg-tiq-primary/5 px-4 py-2 text-center text-sm font-medium text-tiq-primary">
                    {ctaLabel}
                  </div>
                ) : cta === 'contact_sales' ? (
                  <a
                    href="mailto:sales@targetiq.io"
                    className="block w-full rounded-xl border border-tiq-border bg-white px-4 py-2 text-center text-sm font-medium text-tiq-navy hover:bg-tiq-bg transition-colors"
                  >
                    {ctaLabel}
                  </a>
                ) : (
                  <Button
                    className={`w-full ${cta === 'downgrade' ? 'bg-tiq-muted/20 text-tiq-navy hover:bg-tiq-muted/30' : 'bg-tiq-primary hover:opacity-95'}`}
                    disabled={isLoading}
                    onClick={() => onCheckout(plan)}
                  >
                    {isLoading ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {ctaLabel}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


