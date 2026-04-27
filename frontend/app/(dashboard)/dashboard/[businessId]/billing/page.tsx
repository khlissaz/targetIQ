'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TiqCard } from '@/components/tiq/TiqCard';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqProgress } from '@/components/tiq/TiqProgress';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';
import { LoadingState } from '@/components/tiq/LoadingState';
import { BillingSummaryPanel } from '@/components/dashboard/billing/BillingSummaryPanel';
import {
  createCheckoutSession,
  createCreditPackCheckoutSession,
  getBillingPacks,
  getBillingPricing,
  getBillingUsage,
  type BillingPackDto,
  type BillingPricingDto,
  type BillingUsageDto,
} from '@/lib/api';
import { safeLog, sanitizeError } from '@/lib/safeLogging';
import { toast } from 'sonner';

type Currency = 'USD' | 'EUR' | 'SAR' | 'TND';

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function percent(used: number, limit: number | null) {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.max(0, (used / limit) * 100));
}

export default function BillingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user, loading: authLoading, capabilities } = useAuth();

  const [usage, setUsage] = useState<BillingUsageDto | null>(null);
  const [pricing, setPricing] = useState<BillingPricingDto | null>(null);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [packs, setPacks] = useState<BillingPackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirectingPlanCode, setRedirectingPlanCode] = useState<string | null>(null);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);

  const canViewBilling = capabilities.includes('VIEW_BILLING') || capabilities.includes('MANAGE_BILLING');
  const canManageBilling = capabilities.includes('MANAGE_BILLING');

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/landing');
      return;
    }
    if (!authLoading && user && !canViewBilling) {
      router.replace('/landing');
      return;
    }
  }, [authLoading, canViewBilling, router, user]);

  useEffect(() => {
    if (!authLoading && user && canViewBilling) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, canViewBilling]);

  useEffect(() => {
    const status = searchParams?.get('checkout');
    if (status === 'success') {
      router.replace(typeof window !== 'undefined' ? window.location.pathname : '/billing');
      toast.success(t('billing.checkout_success') || 'Payment successful! Your account has been updated.');
      if (!authLoading && user && canViewBilling) {
        void load();
      }
    } else if (status === 'cancel') {
      router.replace(typeof window !== 'undefined' ? window.location.pathname : '/billing');
      toast.info(t('billing.checkout_cancelled') || 'Checkout was cancelled.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && user && canViewBilling) {
      void loadPricing(currency, billingInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, billingInterval]);

  const load = async () => {
    try {
      setLoading(true);
      const [u, p, pk] = await Promise.all([
        getBillingUsage(),
        getBillingPricing(currency, language, billingInterval),
        getBillingPacks(currency),
      ]);
      setUsage(u);
      setPricing(p);
      setPacks(pk);
    } catch (e: any) {
      toast.error(e?.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const loadPricing = async (c: Currency, interval: 'MONTHLY' | 'YEARLY') => {
    try {
      const [p, pk] = await Promise.all([
        getBillingPricing(c, language, interval),
        getBillingPacks(c),
      ]);
      setPricing(p);
      setPacks(pk);
    } catch {
      // pricing is secondary; ignore
    }
  };

  const capture = usage?.capture;
  const enrich = usage?.enrich;
  const addonBalance = typeof usage?.addonBalance === 'number' ? usage.addonBalance : 0;
  const monthlyCapturePct = capture ? percent(capture.monthlyUsed, capture.monthlyCap ?? 0) : 0;
  const monthlyEnrichPct = enrich ? percent(enrich.monthlyUsed, enrich.monthlyCap ?? 0) : 0;
  const dailyCapturePct = capture ? percent(capture.dailyUsed, capture.dailyCap ?? 0) : 0;
  const dailyEnrichPct = enrich ? percent(enrich.dailyUsed, enrich.dailyCap ?? 0) : 0;

  const enrichPlanRemaining = enrich?.monthlyCap != null ? Math.max(0, enrich.monthlyCap - enrich.monthlyUsed) : 0;
  const enrichAvailable = Math.max(0, enrichPlanRemaining) + addonBalance;
  const enrichExhausted = enrichAvailable <= 0;

  const renewalLabel = useMemo(() => formatDate(usage?.renewalDate ?? null), [usage?.renewalDate]);
  const currentPlanCode = usage?.plan ?? null;

  const handleUpgrade = async (planCode: string) => {
    
    if (!canManageBilling) {
      toast.error(t('billing.no_manage_permission'));
      return;
    }
    try {
      setRedirectingPlanCode(planCode);
      const res = await createCheckoutSession(planCode, billingInterval, currency);
      if (!res?.url) throw new Error('Missing checkout URL');
      window.location.href = res.url;
    } catch (e: any) {
      const se = sanitizeError(e);
      safeLog('error', 'billing.upgrade.failed', { message: se.message, code: se.code });
      toast.error(se.message || t('error'));
    } finally {
      setRedirectingPlanCode(null);
    }
  };

  const normalizePackCurrency = (c: Currency): 'USD' | 'SAR' => {
    return c === 'SAR' ? 'SAR' : 'USD';
  };

  const handleBuyPack = async (packCode: string, packCurrency?: string) => {
    if (!canManageBilling) {
      toast.error(t('billing.no_manage_permission'));
      return;
    }
    try {
      setBuyingPack(packCode);
      const resolvedCurrency = packCurrency ?? normalizePackCurrency(currency);
      const res = await createCreditPackCheckoutSession(packCode, resolvedCurrency);
      if (!res?.url) throw new Error('Missing checkout URL');
      window.location.href = res.url;
    } catch (e: any) {
      const se = sanitizeError(e);
      safeLog('error', 'billing.buypack.failed', { message: se.message, code: se.code });
      toast.error(se.message || t('error'));
    } finally {
      setBuyingPack(null);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <PageShell className="space-y-6">
          <PageHeader title={t('billing.title')} subtitle={t('billing.subtitle')} />
          <LoadingState rows={4} />
        </PageShell>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageShell className="space-y-6">
        <PageHeader
          title={t('billing.title')}
          subtitle={renewalLabel ? `${t('billing.renews_on')}: ${renewalLabel}` : t('billing.subtitle')}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-9 rounded-xl border border-tiq-border bg-white px-3 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                aria-label={t('billing.currency')}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SAR">SAR</option>
                <option value="TND">TND</option>
              </select>
              <select
                className="h-9 rounded-xl border border-tiq-border bg-white px-3 text-sm"
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value as 'MONTHLY' | 'YEARLY')}
                aria-label={t('billing.interval')}
              >
                <option value="MONTHLY">{t('billing.monthly') || 'Monthly'}</option>
                <option value="YEARLY">{t('billing.yearly') || 'Yearly'}</option>
              </select>
              <TiqButton variant="secondary" onClick={load}>
                {t('billing.refresh')}
              </TiqButton>
            </div>
          }
        />

        <BillingSummaryPanel usage={usage} />

        {enrichExhausted ? (
          <TiqCard>
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-tiq-navy">
                {t('billing.enrich_exhausted_title') || 'No enrich credits left. Upgrade your plan or buy add-on credits.'}
              </div>
              <p className="text-tiq-muted">
                {t('billing.enrich_exhausted_body')
                  || 'You have used all your enrich credits. Upgrade your plan or buy add-on credits to continue enriching leads.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <TiqButton size="sm" variant="secondary" onClick={() => {
                  const el = document.getElementById('billing-pricing-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                  {t('billing.view_plans') || 'View plans'}
                </TiqButton>
                <TiqButton size="sm" variant="primary" onClick={() => {
                  const el = document.getElementById('billing-buy-credits-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}>
                  {t('billing.buy_credits_cta') || 'Buy credits'}
                </TiqButton>
              </div>
            </div>
          </TiqCard>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <TiqCard title={t('billing.monthly_usage')}>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-tiq-muted">{t('billing.capture') || 'Monthly Capture'}</span>
                <span className="font-medium">
                  {capture?.monthlyUsed ?? 0}
                  {capture?.monthlyCap != null ? ` / ${capture.monthlyCap}` : ''}
                </span>
              </div>
              <TiqProgress value={monthlyCapturePct} />

              <div className="flex items-center justify-between text-sm">
                <span className="text-tiq-muted">{t('billing.enrich') || 'Monthly Enrich'}</span>
                <span className="font-medium">
                  {enrich?.monthlyUsed ?? 0}
                  {enrich?.monthlyCap != null ? ` / ${enrich.monthlyCap}` : ''}
                </span>
              </div>
              <TiqProgress value={monthlyEnrichPct} />

              <div className="text-xs text-tiq-muted">
                {usage?.plan ? `${t('billing.plan')}: ${usage.plan}` : ''}
              </div>
            </div>
          </TiqCard>

          <TiqCard title={t('billing.daily_usage')}>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-tiq-muted">{t('billing.capture') || 'Daily Capture'}</span>
                <span className="font-medium">
                  {capture?.dailyUsed ?? 0}
                  {capture?.dailyCap != null ? ` / ${capture.dailyCap}` : ''}
                </span>
              </div>
              <TiqProgress value={dailyCapturePct} />
              <div className="text-xs text-tiq-muted">
                {capture?.resetAt ? `${t('billing.resets_at')}: ${formatDate(capture.resetAt)}` : ''}
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-tiq-border">
                <span className="text-tiq-muted">{t('billing.enrich') || 'Daily Enrich'}</span>
                <span className="font-medium">
                  {enrich?.dailyUsed ?? 0}
                  {enrich?.dailyCap != null ? ` / ${enrich.dailyCap}` : ''}
                </span>
              </div>
              <TiqProgress value={dailyEnrichPct} />
              <div className="text-xs text-tiq-muted">
                {enrich?.resetAt ? `${t('billing.resets_at')}: ${formatDate(enrich.resetAt)}` : ''}
              </div>
            </div>
          </TiqCard>
        </div>

        <TiqCard title={t('billing.addon_credits_title')}>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-tiq-muted">{t('billing.addon_credits_label') || 'Purchased addon credits'}</span>
              <span className="font-medium">{addonBalance}</span>
            </div>
            <p className="text-xs text-tiq-muted">
              {t('billing.addon_credits_help') || 'One-time credit packs add extra credits on top of your plan quotas.'}
            </p>
          </div>
        </TiqCard>

        <TiqCard id="billing-buy-credits-section" title={t('billing.buy_credits_title')}>
          {packs.length === 0 ? (
            <p className="text-sm text-tiq-muted">
              {t('billing.no_packs_for_currency') || 'No credit packs available for the selected currency.'}
            </p>
          ) : (
          <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-1">
            {packs.map((pack) => {
              const price = (pack.amountMinor / 100).toFixed(2);
              const creditsLabel = t('billing.buy_credits_pack_label')
                ? t('billing.buy_credits_pack_label').replace('{{credits}}', String(pack.creditsAmount))
                : `${pack.creditsAmount} credits`;

              return (
                <div key={pack.code} className="rounded-tiqLg border border-tiq-border bg-tiq-surface p-4 flex flex-col justify-between">
                  <div>
                    <div className="text-lg font-semibold text-tiq-navy">
                      {pack.name !== pack.code ? pack.name : creditsLabel}
                    </div>
                    <div className="mt-1 text-sm text-tiq-muted">
                      {price} {pack.currency}
                    </div>
                  </div>

                  <div className="mt-4">
                    <TiqButton
                      className="w-full"
                      onClick={() => handleBuyPack(pack.code, pack.currency)}
                      disabled={buyingPack === pack.code || !canManageBilling || !pack.stripePriceConfigured}
                      loading={buyingPack === pack.code}
                      tooltip={
                        !canManageBilling
                          ? t('billing.no_manage_permission')
                          : !pack.stripePriceConfigured
                          ? t('billing.pack_not_available') || 'Not available in this currency'
                          : undefined
                      }
                    >
                      {t('billing.buy_credits_cta')}
                    </TiqButton>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </TiqCard>

        <TiqCard id="billing-pricing-section" title={t('billing.pricing')}>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(pricing?.plans ?? []).map((plan) => {
              const isCurrentPlan = currentPlanCode === plan.planCode;
              const currentPlanOrder = pricing?.plans.find((p) => p.planCode === currentPlanCode)?.displayOrder ?? -1;
              const isDowngrade = !isCurrentPlan && plan.displayOrder < currentPlanOrder;
              const stripedPrice = plan.compareAtAmountMinor != null
                ? (plan.compareAtAmountMinor / 100).toFixed(2)
                : null;

              return (
                <div
                  key={plan.planCode}
                  className={`rounded-tiqLg border ${
                    isCurrentPlan ? 'border-tiq-primary' : 'border-tiq-border'
                  } bg-tiq-surface p-4 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-lg font-semibold text-tiq-navy">{plan.name}</div>
                        {plan.subtitle ? (
                          <div className="text-xs text-tiq-muted mt-0.5">{plan.subtitle}</div>
                        ) : null}
                        <div className="flex items-baseline gap-1 mt-1">
                          {stripedPrice ? (
                            <span className="text-xs text-tiq-muted line-through">
                              {stripedPrice} {pricing?.currency}
                            </span>
                          ) : null}
                          <span className="text-sm text-tiq-muted">
                            {plan.amount} {pricing?.currency} / {pricing?.billingInterval?.toLowerCase()}
                          </span>
                        </div>
                      </div>
                      {plan.badgeLabel ? (
                        <span className="shrink-0 rounded-full bg-tiq-primary/10 px-2 py-0.5 text-xs font-medium text-tiq-primary">
                          {plan.badgeLabel}
                        </span>
                      ) : null}
                    </div>

                    <ul className="mt-3 space-y-1 text-sm text-tiq-muted">
                      {(plan.features ?? []).slice(0, 5).map((f) => (
                        <li key={f}>- {f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    {isCurrentPlan ? (
                      <div className="mb-2 rounded-lg bg-tiq-primary/5 px-3 py-1.5 text-xs font-medium text-tiq-primary text-center">
                        {t('billing.current') || 'Current plan'}
                      </div>
                    ) : !(plan as any).selfServeEnabled ? (
                      <a
                        href="mailto:sales@targetiq.io"
                        className="block w-full text-center rounded-xl border border-tiq-border px-3 py-2 text-sm font-medium text-tiq-navy hover:bg-tiq-surface-alt transition-colors"
                      >
                        {t('billing.contact_sales') || 'Contact Sales'}
                      </a>
                    ) : !plan.checkoutEnabled ? (
                      <a
                        href="mailto:sales@targetiq.io"
                        className="block w-full text-center rounded-xl border border-tiq-border px-3 py-2 text-sm font-medium text-tiq-navy hover:bg-tiq-surface-alt transition-colors"
                      >
                        {t('billing.contact_sales') || 'Contact Sales'}
                      </a>
                    ) : (
                      <TiqButton
                        onClick={() => handleUpgrade(plan.planCode)}
                        disabled={(redirectingPlanCode !== null && redirectingPlanCode !== plan.planCode) || !canManageBilling}
                        loading={redirectingPlanCode === plan.planCode}
                        variant={isDowngrade ? 'secondary' : 'primary'}
                        className="w-full"
                      >
                        {redirectingPlanCode === plan.planCode
                          ? t('billing.redirecting')
                          : isDowngrade
                          ? t('billing.downgrade') || 'Downgrade'
                          : t('billing.upgrade')}
                      </TiqButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TiqCard>

        <TiqCard title={t('billing.enrich_pricing_title') || 'Enrich credit pricing'}>
          <div className="space-y-1 text-sm text-tiq-muted">
            <p>
              {t('billing.enrich_pricing_intro')
                || 'Enrich credits are only consumed when we successfully find contact details for a lead.'}
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>{t('billing.enrich_pricing_email') || 'Email found: 1 enrich credit'}</li>
              <li>{t('billing.enrich_pricing_phone') || 'Phone found: 6 enrich credits'}</li>
              <li>{t('billing.enrich_pricing_both') || 'Email + phone found: 7 enrich credits in total'}</li>
            </ul>
          </div>
        </TiqCard>
      </PageShell>
    </DashboardLayout>
  );
}
