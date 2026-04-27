// api.ts
// Helper for making API requests to the NestJS backend

import { setApiBlock, setLastActionState, setLastApiError, setLastCredits } from './runtimeStatus';
import { clearActiveBusinessId, ensureActiveBusiness } from './business';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type CreditsBucket = {
  monthlyUsed: number;
  monthlyCap: number | null;
  monthlyRemaining: number | null;
  dailyUsed: number;
  dailyCap: number;
  dailyRemaining: number;
  resetAt: string | null;
};

export type CreditsInfo = {
  capture: CreditsBucket;
  enrich: CreditsBucket;
  addonBalance?: number;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function isBusinessScopedPath(path: string): boolean {
  const p = String(path || '');
  if (!p.startsWith('/')) return false;
  if (p.startsWith('/auth')) return false;
  if (p.startsWith('/billing/pricing')) return false;

  const prefixes = [
    '/credits',
    '/billing/usage',
    '/billing/checkout-session',
    '/billing/credit-pack-checkout',
    '/billing/subscription-summary',
    '/scraping',
    '/leads',
    '/lead',
    '/collections',
    '/collection',
    '/outreach',
    '/campaign',
    '/memberships',
    '/message-template',
    '/message-templates',
    '/outreach-list',
    '/outreach-prospect',
    '/outreach-sequence',
    '/outreach-sequences',
    '/lead-enrichment-tasks',
  ];

  return prefixes.some((prefix) => p === prefix || p.startsWith(`${prefix}/`) || p.startsWith(`${prefix}?`));
}

function readHeader(options: RequestInit | undefined, key: string): string | null {
  const headers = (options?.headers ?? {}) as any;
  if (!headers) return null;
  const direct = headers?.[key];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const lower = headers?.[key.toLowerCase()];
  if (typeof lower === 'string' && lower.trim()) return lower.trim();
  return null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  setLastActionState('loading');
  const token =  localStorage.getItem('access-token');

  const needsBusiness = isBusinessScopedPath(path);
  const explicitBusinessId = readHeader(options, 'X-Business-Id');
  let businessId = explicitBusinessId ?? localStorage.getItem('active-business-id');
  if (needsBusiness && !businessId) {
    try {
      const ensured = await ensureActiveBusiness();
      businessId = ensured ?? localStorage.getItem('active-business-id');
    } catch {
      // fall through; server will respond BUSINESS_REQUIRED
    }
  }

  const providedHeaders = (options.headers || {}) as any;
  const existingAuth = readHeader(options, 'Authorization');
  const existingBusiness = readHeader(options, 'X-Business-Id');
  const headers = {
    ...providedHeaders,
    'Content-Type': 'application/json',
    ...(token && !existingAuth ? { Authorization: `Bearer ${token}` } : {}),
    ...(businessId && !existingBusiness ? { 'X-Business-Id': businessId } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  const raw = await res.text();
  let data: any = undefined;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!res.ok) {
    const message =
      (typeof data === 'object' && data && (data.message || data.error))
        ? (data.message || data.error)
        : (typeof data === 'string' && data)
          ? data
          : res.statusText || 'Request failed';

    const code = typeof data === 'object' && data && typeof (data as any).code === 'string' ? String((data as any).code) : undefined;

    // Self-heal missing business header once.
    if (res.status === 400 && code === 'BUSINESS_REQUIRED' && !(options as any)?._businessRequiredRetry) {
      try {
        clearActiveBusinessId();
        await ensureActiveBusiness();

        const retryOptions: RequestInit = { ...(options as any), _businessRequiredRetry: true } as any;
        return await apiFetch<T>(path, retryOptions);
      } catch {
        // fall through to normal error handling
      }
    }

    // Self-heal stale/invalid business id once.
    if (res.status === 403 && code === 'NOT_MEMBER' && !(options as any)?._notMemberRetry) {
      try {
        clearActiveBusinessId();
        await ensureActiveBusiness();

        const retryOptions: RequestInit = { ...(options as any), _notMemberRetry: true } as any;
        return await apiFetch<T>(path, retryOptions);
      } catch {
        // fall through to normal error handling
      }
    }

    setLastActionState('error');
    setLastApiError({ status: res.status, code, message: String(message), path });

    if (res.status === 401) {
      localStorage.removeItem('access-token');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('targetiq:api-status', { detail: { kind: 'login' } }));

        try {
          const path = window.location.pathname || '/';
          const query = window.location.search || '';
          const hash = window.location.hash || '';
          const current = `${path}${query}${hash}`;
          const safeCurrent = current && current.startsWith('/') ? current : '/';
          const next = encodeURIComponent(safeCurrent);
          window.location.href = `/auth/login?next=${next}`;
        } catch {
          window.location.href = '/auth/login';
        }
      }
    }

    if (res.status === 402) {
      setApiBlock({ kind: 'upgrade' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('targetiq:api-status', { detail: { kind: 'upgrade' } }));
      }
    }

    if (res.status === 429) {
      const resetAt = typeof data === 'object' && data ? ((data as any).resetAt ?? (data as any).dailyResetDate ?? null) : null;
      setApiBlock({ kind: 'dailyCap', resetAt: resetAt ? String(resetAt) : null });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('targetiq:api-status', { detail: { kind: 'dailyCap', resetAt: resetAt ? String(resetAt) : null } }));
      }
    }

    if (res.status === 403 && code === 'NOT_MEMBER') {
      setApiBlock({ kind: 'workspaceRequired' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('targetiq:api-status', { detail: { kind: 'workspaceRequired' } }));
      }
    }

    if (res.status >= 500) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('targetiq:api-status', { detail: { kind: 'serverError' } }));
      }
    }

    throw new ApiError(res.status, String(message), data);
  }

  setLastActionState('success');

  if (path === '/credits') {
    try {
      setLastCredits(data as any);
    } catch {
      // ignore diagnostics failures
    }
  }

  return data as T;
}

export async function getCredits(): Promise<CreditsInfo> {
  return apiFetch('/credits');
}

export async function getScrapingLimit(): Promise<{ dailyLimit: number; dailyUsage: number }> {
  return apiFetch('/credits/scraping-limit');
}

export async function incrementScrapeCount(items: number): Promise<{ success: boolean; error?: string }> {
  return apiFetch('/credits/scraping-limit/increment', { method: 'POST', body: JSON.stringify({ items }) });
}

export type MembershipDto = {
  tenantId?: string;
  businessId?: string;
  businessName?: string;
  role: string;
};

export type AuthMeDto = {
  user: { id: string; email: string; role?: string };
  memberships: MembershipDto[];
  capabilities: string[];
  activeBusinessId: string | null;
};

export async function getAuthMe(): Promise<AuthMeDto> {
  return apiFetch('/auth/me');
}

export type MembershipListItemDto = {
  id: string;
  userId: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export type MembershipListResponseDto = {
  businessId: string;
  planCode: string;
  teamEnabled: boolean;
  teamLimit: number | null;
  items: MembershipListItemDto[];
};

export type MembershipInviteDto = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

export type MembershipInvitesResponseDto = {
  businessId: string;
  items: MembershipInviteDto[];
};

export async function getMembershipsForBusiness(): Promise<MembershipListResponseDto> {
  return apiFetch('/memberships');
}

export async function getMembershipInvites(): Promise<MembershipInvitesResponseDto> {
  return apiFetch('/memberships/invites');
}

export async function createMembershipInvite(body: { email: string; role?: string }): Promise<any> {
  return apiFetch('/memberships/invite', { method: 'POST', body: JSON.stringify(body) });
}

export async function revokeMembershipInvite(id: string): Promise<any> {
  return apiFetch(`/memberships/invite/revoke/${id}`, { method: 'POST' });
}

export async function removeMembership(id: string): Promise<any> {
  return apiFetch(`/memberships/${id}`, { method: 'DELETE' });
}

export type BillingUsageDto = {
  plan: string | null;
  currency: string | null;
  renewalDate: string | null;
  addonBalance?: number;
  capture: {
    monthlyUsed: number;
    monthlyCap: number | null;
    monthlyRemaining: number | null;
    dailyUsed: number;
    dailyCap: number;
    dailyRemaining: number;
    resetAt: string | null;
  };
  enrich: {
    monthlyUsed: number;
    monthlyCap: number | null;
    monthlyRemaining: number | null;
    dailyUsed: number;
    dailyCap: number;
    dailyRemaining: number;
    resetAt: string | null;
  };
};

export async function getBillingUsage(): Promise<BillingUsageDto> {
  return apiFetch('/billing/usage');
}

export type BillingPricingPlanDto = {
  planCode: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  badgeLabel: string | null;
  features: string[];
  amount: number;
  compareAtAmountMinor: number | null;
  checkoutEnabled: boolean;
  selfServeEnabled: boolean;
  billingModelType: string;
  currency: string;
  billingInterval: 'MONTHLY' | 'YEARLY';
  isFeatured: boolean;
  displayOrder: number;
  monthlyCapture: number | null;
  dailyCapture: number | null;
  monthlyEnrich: number | null;
  dailyEnrich: number | null;
  teamEnabled: boolean;
  teamLimit: number | null;
};

export type BillingPricingDto = {
  currency: string;
  lang?: string;
  billingInterval: 'MONTHLY' | 'YEARLY';
  plans: BillingPricingPlanDto[];
};

export async function getBillingPricing(
  currency: string,
  lang?: string,
  billingInterval: 'MONTHLY' | 'YEARLY' = 'MONTHLY',
): Promise<BillingPricingDto> {
  const params = new URLSearchParams({ currency, billingInterval });
  if (lang) params.set('lang', lang);
  const raw = await apiFetch<any>(`/billing/pricing?${params.toString()}`);
  const outCurrency = typeof raw?.currency === 'string' ? raw.currency : currency;
  const interval =
    typeof raw?.billingInterval === 'string' && raw.billingInterval.toUpperCase() === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
  const plansRaw: any[] = Array.isArray(raw?.plans) ? raw.plans : [];

  const plans: BillingPricingPlanDto[] = plansRaw
    .map((p) => {
      const planCode = typeof p?.planCode === 'string' ? p.planCode : '';
      const name = typeof p?.name === 'string' ? p.name : '';
      const amount = Number(p?.amount ?? 0);
      const planCurrency = typeof p?.currency === 'string' ? p.currency : outCurrency;
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
        compareAtAmountMinor: p?.compareAtAmountMinor == null ? null : Number(p.compareAtAmountMinor),
        checkoutEnabled: p?.checkoutEnabled === true,
        selfServeEnabled: p?.selfServeEnabled === true,
        billingModelType: typeof p?.billingModelType === 'string' ? p.billingModelType : 'subscription',
        currency: planCurrency,
        billingInterval: interval,
        isFeatured: Boolean(p?.isFeatured),
        displayOrder: p?.displayOrder == null ? 0 : Number(p.displayOrder),
        monthlyCapture: p?.monthlyCapture == null ? null : Number(p.monthlyCapture),
        dailyCapture: p?.dailyCapture == null ? null : Number(p.dailyCapture),
        monthlyEnrich: p?.monthlyEnrich == null ? null : Number(p.monthlyEnrich),
        dailyEnrich: p?.dailyEnrich == null ? null : Number(p.dailyEnrich),
        teamEnabled: Boolean(p?.teamEnabled),
        teamLimit: p?.teamLimit == null ? null : Number(p.teamLimit),
      };
    })
    .filter(Boolean) as BillingPricingPlanDto[];

  return { currency: outCurrency, lang: typeof raw?.lang === 'string' ? raw.lang : lang, billingInterval: interval, plans };
}

export async function createCheckoutSession(planCode: string, billingInterval: 'MONTHLY' | 'YEARLY' = 'MONTHLY', currency?: string): Promise<{ url: string }> {
  const res = await apiFetch<any>('/billing/checkout-session', { method: 'POST', body: JSON.stringify({ planCode, billingInterval, ...(currency ? { currency } : {}) }) });
  const url = typeof res?.checkoutUrl === 'string' ? res.checkoutUrl : typeof res?.url === 'string' ? res.url : null;
  if (!url) throw new ApiError(502, 'Missing checkout URL', res);
  return { url };
}

export async function createCreditPackCheckoutSession(
  packCode: string,
  currency?: string,
): Promise<{ url: string }> {
  const res = await apiFetch<any>('/billing/credit-pack-checkout', {
    method: 'POST',
    body: JSON.stringify({ packCode, currency }),
  });
  const url = typeof res?.checkoutUrl === 'string' ? res.checkoutUrl : typeof res?.url === 'string' ? res.url : null;
  if (!url) throw new ApiError(502, 'Missing checkout URL', res);
  return { url };
}

export type BillingPackDto = {
  code: string;
  name: string;
  creditsAmount: number;
  currency: string;
  amountMinor: number;
  stripePriceConfigured: boolean;
  displayOrder: number;
};

export async function getBillingPacks(currency: string): Promise<BillingPackDto[]> {
  const params = new URLSearchParams({ currency });
  const raw = await apiFetch<any>(`/billing/packs?${params.toString()}`);
  const items: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.packs) ? raw.packs : [];
  return items
    .filter((p) => typeof p?.code === 'string' && typeof p?.creditsAmount === 'number')
    .map((p) => ({
      code: String(p.code),
      name: typeof p.name === 'string' ? p.name : p.code,
      creditsAmount: Number(p.creditsAmount),
      currency: typeof p.currency === 'string' ? p.currency : currency,
      amountMinor: Number(p.amountMinor ?? 0),
      stripePriceConfigured: Boolean(p.stripePriceConfigured),
      displayOrder: p.displayOrder == null ? 0 : Number(p.displayOrder),
    }));
}

export type AdminBusinessDto = {
  id: string;
  name: string;
  planId: string | null;
  renewalDate: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminBusinesses(): Promise<AdminBusinessDto[]> {
  return apiFetch('/admin/businesses');
}

export type AdminUserDto = {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
  planId: string | null;
  renewalDate: string | null;
  currency?: string | null;
  stripeCustomerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminUsers(): Promise<AdminUserDto[]> {
  return apiFetch('/admin/users');
}

export type AdminSubscriptionsDto = {
  tenants: Array<{ id: string; name: string; planId: string | null; renewalDate: string | null }>;
  users: Array<{ id: string; email: string; planId: string | null; renewalDate: string | null; stripeCustomerId?: string | null }>;
};

export async function getAdminSubscriptions(): Promise<AdminSubscriptionsDto> {
  return apiFetch('/admin/subscriptions');
}

export type AdminPricingDto = {
  id: string;
  name: string;
  credits: number;
  priceUSD: number;
  priceSAR: number;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminPricing(): Promise<AdminPricingDto[]> {
  return apiFetch('/admin/pricing');
}

export type AdminUsageDto = {
  tenantId: string;
  tenantName: string;
  planId: string | null;
  renewalDate: string | null;
  meters: { monthly: { remaining: number; usedCapture: number; usedEnrich: number } };
};

export async function getAdminUsage(): Promise<AdminUsageDto[]> {
  return apiFetch('/admin/usage');
}

export type AdminAuditLogDto = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  payloadSummary: Record<string, any> | null;
  createdAt: string;
};

export async function getAdminAudit(): Promise<AdminAuditLogDto[]> {
  return apiFetch('/admin/audit');
}


export type DashboardSummaryDto = {
  total: number;
  converted: number;
  active: number;
  newThisMonth: number;
  recentLeads: any[];
};

export type DashboardAnalyticsDto = {
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byMonth: Array<{ month: string; count: number }>;
  byUser?: Record<string, number>;
  conversionRate: number;
};

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  return apiFetch('/leads/dashboard-summary');
}

export async function getDashboardAnalytics(): Promise<DashboardAnalyticsDto> {
  return apiFetch('/leads/analytics');
}

export type UserProfileDto = {
  id: string;
  email: string;
  fullName?: string;
  country?: string;
  language?: string;
  currency?: string;
  role?: string;
  tenantId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function getUserProfile(): Promise<UserProfileDto> {
  return apiFetch('/users/profile');
}

export async function updateUserProfile(body: Partial<UserProfileDto>): Promise<UserProfileDto> {
  return apiFetch('/users/profile', { method: 'PATCH', body: JSON.stringify(body) });
}

export type BulkEnrichmentStartResponseDto = {
  total: number;
  started: number;
  failed: number;
  items: any[];
};

export async function startBulkLeadEnrichment(body: { leadIds: string[]; fields: Array<'email' | 'phone'> }): Promise<BulkEnrichmentStartResponseDto> {
  return apiFetch('/lead-enrichment-tasks/bulkStart', { method: 'POST', body: JSON.stringify(body) });
}

export type AdminSummaryDto = {
  businesses: number;
  users: number;
  pricingPlans: number;
  ledgerEntries: number;
  leads: number;
  enrichmentTasks: number;
};

export async function getAdminSummary(): Promise<AdminSummaryDto> {
  return apiFetch('/admin/summary');
}

// ─── Admin Billing ──────────────────────────────────────────────────────────

export type AdminBillingPlanDto = {
  id: string;
  code: string;
  nameI18n: { en: string; ar: string } | null;
  subtitleI18n: { en: string; ar: string } | null;
  descriptionI18n: { en: string; ar: string } | null;
  badgeLabelI18n: { en: string; ar: string } | null;
  creditsMonthly: number;
  teamEnabled: boolean;
  teamLimit: number | null;
  isActive: boolean;
  isFeatured: boolean;
  isVisible: boolean;
  displayOrder: number;
  billingModelType: string;
  limitsJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminBillingPriceDto = {
  id: string;
  planCode: string | null;
  packCode: string | null;
  currency: string;
  billingInterval: string;
  amount: string;
  compareAtAmountMinor: string | null;
  checkoutEnabled: boolean;
  stripePriceId: string | null;
  internalPriceKey: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminCreditPackDto = {
  id: string;
  code: string;
  name: string | null;
  creditsAmount: number;
  currency: string;
  amountMinor: string;
  stripePriceId: string | null;
  internalPriceKey: string | null;
  isActive: boolean;
  isVisible: boolean;
  displayOrder: number;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminBillingDiagnosticsDto = {
  issues: {
    type: string;
    id: string;
    context: string;
    issue: string;
    envKey: string;
    currentValue: string | null;
  }[];
  inactivePlans: { id: string; code: string }[];
  summary: {
    totalPlans: number;
    activePlans: number;
    totalPrices: number;
    activePrices: number;
    totalPacks: number;
    activePacks: number;
    issueCount: number;
  };
};

export async function adminBillingListPlans(): Promise<AdminBillingPlanDto[]> {
  return apiFetch('/admin/billing/plans');
}
export async function adminBillingCreatePlan(body: Partial<AdminBillingPlanDto>): Promise<AdminBillingPlanDto> {
  return apiFetch('/admin/billing/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export async function adminBillingUpdatePlan(id: string, body: Partial<AdminBillingPlanDto>): Promise<AdminBillingPlanDto> {
  return apiFetch(`/admin/billing/plans/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export async function adminBillingArchivePlan(id: string): Promise<AdminBillingPlanDto> {
  return apiFetch(`/admin/billing/plans/${id}/archive`, { method: 'POST' });
}

export async function adminBillingListPrices(): Promise<AdminBillingPriceDto[]> {
  return apiFetch('/admin/billing/prices');
}
export async function adminBillingCreatePrice(body: Partial<AdminBillingPriceDto>): Promise<AdminBillingPriceDto> {
  return apiFetch('/admin/billing/prices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export async function adminBillingUpdatePrice(id: string, body: Partial<AdminBillingPriceDto>): Promise<AdminBillingPriceDto> {
  return apiFetch(`/admin/billing/prices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export async function adminBillingArchivePrice(id: string): Promise<AdminBillingPriceDto> {
  return apiFetch(`/admin/billing/prices/${id}/archive`, { method: 'POST' });
}

export async function adminBillingListPacks(): Promise<AdminCreditPackDto[]> {
  return apiFetch('/admin/billing/packs');
}
export async function adminBillingCreatePack(body: Partial<AdminCreditPackDto>): Promise<AdminCreditPackDto> {
  return apiFetch('/admin/billing/packs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export async function adminBillingUpdatePack(id: string, body: Partial<AdminCreditPackDto>): Promise<AdminCreditPackDto> {
  return apiFetch(`/admin/billing/packs/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
export async function adminBillingArchivePack(id: string): Promise<AdminCreditPackDto> {
  return apiFetch(`/admin/billing/packs/${id}/archive`, { method: 'POST' });
}

export async function adminBillingGetDiagnostics(): Promise<AdminBillingDiagnosticsDto> {
  return apiFetch('/admin/billing/diagnostics');
}

// ─────────────────────────────────────────────────────────────
// ADMIN: PLAN FEATURES
// ─────────────────────────────────────────────────────────────

export type AdminBillingFeatureDto = {
  id: string;
  planCode: string;
  code: string;
  labelI18n: { en: string; ar?: string } | null;
  descriptionI18n: { en: string; ar?: string } | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function adminBillingListFeatures(planCode: string): Promise<AdminBillingFeatureDto[]> {
  return apiFetch(`/admin/billing/plans/${planCode}/features`);
}

export async function adminBillingCreateFeature(planCode: string, body: Partial<AdminBillingFeatureDto>): Promise<AdminBillingFeatureDto> {
  return apiFetch(`/admin/billing/plans/${planCode}/features`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export async function adminBillingUpdateFeature(id: string, body: Partial<AdminBillingFeatureDto>): Promise<AdminBillingFeatureDto> {
  return apiFetch(`/admin/billing/features/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export async function adminBillingArchiveFeature(id: string): Promise<AdminBillingFeatureDto> {
  return apiFetch(`/admin/billing/features/${id}/archive`, { method: 'POST' });
}

// ─────────────────────────────────────────────────────────────
// ADMIN: PLAN CONFIG
// ─────────────────────────────────────────────────────────────

export type AdminBillingConfigDto = {
  id: string;
  planCode: string;
  captureCredits: number | null;
  enrichCredits: number | null;
  dailyCaptureCap: number | null;
  dailyEnrichCap: number | null;
  teamLimit: number | null;
  hasApiAccess: boolean;
  hasExtensionAccess: boolean;
  hasAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasOnboarding: boolean;
  hasCustomIntegrations: boolean;
  hasSla: boolean;
  hasOutreachEnabled: boolean;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export async function adminBillingGetConfig(planCode: string): Promise<AdminBillingConfigDto | null> {
  return apiFetch(`/admin/billing/plans/${planCode}/config`);
}

export async function adminBillingUpsertConfig(planCode: string, body: Partial<AdminBillingConfigDto>): Promise<AdminBillingConfigDto> {
  return apiFetch(`/admin/billing/plans/${planCode}/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
