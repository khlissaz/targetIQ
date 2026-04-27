'use client';

import { apiFetch } from '@/lib/api';

export type PricingPlan = {
  planCode: string;
  name: string;
  /** Short tagline shown beneath the plan name */
  subtitle: string | null;
  description: string | null;
  /** Admin-set badge text (e.g. "Most popular"). Use this over hardcoded strings. */
  badgeLabel: string | null;
  features: string[];
  amount: number;
  /** Original / compare-at price for strikethrough display (same unit as amount) */
  compareAtAmountMinor: number | null;
  /** When false, this price cannot be selected at checkout */
  checkoutEnabled: boolean;
  /** Whether this plan supports self-serve (checkout / free signup). False = contact sales (enterprise). */
  selfServeEnabled: boolean;
  /** Billing model: 'free' | 'subscription' | 'enterprise-custom' */
  billingModelType: 'free' | 'subscription' | 'enterprise-custom';
  currency: string;
  billingInterval: 'MONTHLY' | 'YEARLY';
  displayOrder: number;
  isFeatured: boolean;
  monthlyCapture: number | null;
  dailyCapture: number | null;
  monthlyEnrich: number | null;
  dailyEnrich: number | null;
  teamEnabled: boolean;
  teamLimit: number | null;
};

export type PricingResponse = {
  currency: string;
  billingInterval: 'MONTHLY' | 'YEARLY';
  plans: PricingPlan[];
};

function normalizePricingResponse(raw: any): PricingResponse {
  const currency = typeof raw?.currency === 'string' ? raw.currency : 'USD';
  const billingInterval =
    typeof raw?.billingInterval === 'string' && raw.billingInterval.toUpperCase() === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
  const plansRaw = Array.isArray(raw?.plans) ? raw.plans : [];

  const plans: PricingPlan[] = plansRaw
    .map((p: any) => {
      const planCode = typeof p?.planCode === 'string' ? p.planCode : '';
      const name = typeof p?.name === 'string' ? p.name : '';
      const amount = Number(p?.amount ?? 0);
      const planCurrency = typeof p?.currency === 'string' ? p.currency : currency;
      const description = typeof p?.description === 'string' ? p.description : null;
      const features = Array.isArray(p?.features) ? p.features.filter((x: any) => typeof x === 'string') : [];

      if (!planCode || !name || !Number.isFinite(amount)) return null;

      return {
        planCode,
        name,
        subtitle: typeof p?.subtitle === 'string' ? p.subtitle : null,
        description,
        badgeLabel: typeof p?.badgeLabel === 'string' ? p.badgeLabel : null,
        features,
        amount,
        compareAtAmountMinor: p?.compareAtAmountMinor != null ? Number(p.compareAtAmountMinor) : null,
        checkoutEnabled: p?.checkoutEnabled === true,
        selfServeEnabled: p?.selfServeEnabled !== false,
        billingModelType:
          p?.billingModelType === 'free' || p?.billingModelType === 'enterprise-custom'
            ? p.billingModelType
            : 'subscription',
        currency: planCurrency,
        billingInterval,
        displayOrder: typeof p?.displayOrder === 'number' ? p.displayOrder : 0,
        isFeatured: p?.isFeatured === true,
        monthlyCapture: p?.monthlyCapture == null ? null : Number(p.monthlyCapture),
        dailyCapture: p?.dailyCapture == null ? null : Number(p.dailyCapture),
        monthlyEnrich: p?.monthlyEnrich == null ? null : Number(p.monthlyEnrich),
        dailyEnrich: p?.dailyEnrich == null ? null : Number(p.dailyEnrich),
        teamEnabled: Boolean(p?.teamEnabled),
        teamLimit: p?.teamLimit == null ? null : Number(p.teamLimit),
      } satisfies PricingPlan;
    })
    .filter(Boolean) as PricingPlan[];

  return { currency, billingInterval, plans };
}

export async function getPricing(
  currency: string = 'USD',
  lang?: string,
  billingInterval: 'MONTHLY' | 'YEARLY' = 'MONTHLY',
): Promise<PricingResponse> {
  const params = new URLSearchParams({ currency, billingInterval });
  if (lang) params.set('lang', lang);
  const raw = await apiFetch<any>(`/billing/pricing?${params.toString()}`);
  return normalizePricingResponse(raw);
}

export type CreateCheckoutSessionPayload = {
  planId?: string;
  planCode?: string;
  currency?: string;
  billingInterval?: 'MONTHLY' | 'YEARLY';
};

export async function createCheckoutSession(payload: CreateCheckoutSessionPayload): Promise<{ checkoutUrl: string }> {
  const res = await apiFetch<any>('/billing/checkout-session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const url = typeof res?.checkoutUrl === 'string' ? res.checkoutUrl : typeof res?.url === 'string' ? res.url : null;
  if (!url) throw new Error('Missing checkoutUrl');
  return { checkoutUrl: url };
}

export  type SubscriptionSummary = {
  planCode: string;
  plan: string;
  status: string;
  workspaceType: string;
  recommendedUpgrade: string;
  capture: {
    monthlyUsed: number;
    monthlyCap: number;
    monthlyRemaining: number;
  };
  enrich: {
    monthlyUsed: number;
    monthlyCap: number;
    monthlyRemaining: number;
  };
  renewalDate: string;
  addonBalance: number;
  currency: string;
};

export async function getSubscriptionSummary(): Promise<SubscriptionSummary> {
  const res = await apiFetch<any>('/billing/subscription-summary');
  return {
    planCode: typeof res?.planCode === 'string' ? res.planCode : '',
    plan: typeof res?.plan === 'string' ? res.plan : '',
    renewalDate: typeof res?.renewalDate === 'string' ? res.renewalDate : '',
    addonBalance: Number(res?.addonBalance ?? 0),
    currency: typeof res?.currency === 'string' ? res.currency : 'USD',
    capture: {
      monthlyUsed: Number(res?.capture?.monthlyUsed ?? 0),
      monthlyCap: Number(res?.capture?.monthlyCap ?? 0),
      monthlyRemaining: Number(res?.capture?.monthlyRemaining ?? 0),
    },
    enrich: {
      monthlyUsed: Number(res?.enrich?.monthlyUsed ?? 0),
      monthlyCap: Number(res?.enrich?.monthlyCap ?? 0),
      monthlyRemaining: Number(res?.enrich?.monthlyRemaining ?? 0),
    },
    status: typeof res?.status === 'string' ? res.status : '',
    workspaceType: typeof res?.workspaceType === 'string' ? res.workspaceType : '',
    recommendedUpgrade: typeof res?.recommendedUpgrade === 'string' ? res.recommendedUpgrade : '',
  };
}

export type BillingUsageResponse = {
  renewalDate: string;
  addonBalance: number;
  currency: string;
  plan: string;
  capture: {
    monthlyUsed: number;
    monthlyCap: number;
    monthlyRemaining: number;
    dailyUsed: number;
    dailyCap: number;
    resetAt: string;
  };
  enrich: {
    monthlyUsed: number;
    monthlyCap: number;
    monthlyRemaining: number;
    dailyUsed: number;
    dailyCap: number;
    resetAt: string;
  };
};

export async function createCreditPackCheckout(payload: { packCode: 'PACK_100' | 'PACK_500' | 'PACK_1000'; currency: string }): Promise<{ checkoutUrl: string }> {
  const res = await apiFetch<any>('/billing/credit-pack-checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const url = typeof res?.checkoutUrl === 'string' ? res.checkoutUrl : typeof res?.url === 'string' ? res.url : null;
  if (!url) throw new Error('Missing checkoutUrl');
  return { checkoutUrl: url };
}

export async function getBillingUsage(): Promise<BillingUsageResponse> {
  return apiFetch('/billing/usage');
}
export async function getOnboardingSummary(): Promise<{ hasAccount: boolean; hasWorkspace: boolean; planCode: string }> {
  return apiFetch('/billing/onboarding-summary');
}