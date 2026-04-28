'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { PricingCards } from '@/components/saas/PricingCards';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { ensureActiveBusiness } from '@/lib/business';
import { createCheckoutSession, getPricing, type PricingPlan } from '@/services/billingServices';
import { Button } from '@/components/ui/button';

export function PublicPricingSection({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, activeBusinessId, loading: authLoading } = useAuth();
  const { t } = useTranslation(language);
  const [currency, setCurrency] = useState<'USD' | 'SAR'>('SAR');
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPricing(currency, language, interval);
        if (!active) return;
        setPlans(res.plans ?? []);
      } catch (e: any) {
        if (!active) return;
        setError(typeof e?.message === 'string' ? e.message : 'Pricing unavailable');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [currency, interval, language]);

  const labels = useMemo(() => ({
    monthly: t('pricing.monthlyLabel'),
    yearly: t('pricing.yearlyLabel'),
    mostPopular: t('pricing.most_popular'),
    free: t('pricing.free'),
    getStarted: t('pricing.getStarted'),
    currentFlow: t('pricing.currentFlow'),
    contactSales: t('pricing.contactSales'),
    capture: t('pricing.capture'),
    enrich: t('pricing.enrich'),
    team: t('pricing.team'),
    dailyCapture: t('pricing.dailyCapture'),
    dailyEnrich: t('pricing.dailyEnrich'),
    noTeam: t('pricing.noTeam'),
    unlimited: t('pricing.unlimited'),
    upTo: (count: number) => t('landing.pricing.teamUpTo').replace('{{count}}', String(count)),
    upgrade: t('pricing.upgrade'),
    downgrade: t('pricing.downgrade'),
    currentPlan: t('pricing.currentPlan'),
    selected: t('pricing.selected'),
  }), [t]);

  const handleCheckout = async (plan: PricingPlan) => {
    const planCode = plan.planCode;

    if (!user) {
      const next = encodeURIComponent(`/onboarding?plan=${planCode}`);
      router.push(`/auth/signup?plan=${encodeURIComponent(planCode)}&next=${next}`);
      return;
    }

    if (!plan.selfServeEnabled) {
      window.location.href = `mailto:sales@targetiq.io?subject=${encodeURIComponent(`TargetIQ ${planCode} plan`)}`;
      return;
    }

    if (plan.billingModelType === 'free' || Number(plan.amount ?? 0) === 0 || !plan.checkoutEnabled) {
      router.push(`/onboarding?plan=${encodeURIComponent(planCode)}`);
      return;
    }

    try {
      setLoadingPlan(planCode);
      await ensureActiveBusiness();
      const { checkoutUrl } = await createCheckoutSession({
        planCode,
        currency: plan.currency || currency,
        billingInterval: interval,
      });
      window.location.href = checkoutUrl;
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : t('pricing.checkoutError'));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <div className="inline-flex rounded-2xl border border-tiq-border bg-white p-1 shadow-tiq">
          <Button type="button" variant={interval === 'MONTHLY' ? 'default' : 'ghost'} className={interval === 'MONTHLY' ? 'bg-tiq-primary hover:opacity-95' : ''} onClick={() => setInterval('MONTHLY')}>
            {t('pricing.monthlyLabel')}
          </Button>
          <Button type="button" variant={interval === 'YEARLY' ? 'default' : 'ghost'} className={interval === 'YEARLY' ? 'bg-tiq-primary hover:opacity-95' : ''} onClick={() => setInterval('YEARLY')}>
            {t('pricing.yearlyLabel')}
          </Button>
        </div>
        <div className="inline-flex rounded-2xl border border-tiq-border bg-white p-1 shadow-tiq">
          <Button type="button" variant={currency === 'SAR' ? 'default' : 'ghost'} className={currency === 'SAR' ? 'bg-tiq-primary hover:opacity-95' : ''} onClick={() => setCurrency('SAR')}>SAR</Button>
          <Button type="button" variant={currency === 'USD' ? 'default' : 'ghost'} className={currency === 'USD' ? 'bg-tiq-primary hover:opacity-95' : ''} onClick={() => setCurrency('USD')}>USD</Button>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-tiq-muted">
          {user ? t('pricing.existingUserHint') : t('pricing.newUserHint')}
        </p>
      </div>

      {error ? (
        <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading || authLoading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-[1.75rem] border border-tiq-border bg-white shadow-tiq">
          <div className="flex items-center gap-3 text-sm font-semibold text-tiq-muted">
            <Loader2 className="h-5 w-5 animate-spin text-tiq-primary" />
            {t('pricing.loading')}
          </div>
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-[1.75rem] border border-tiq-border bg-white p-8 text-center shadow-tiq">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-tiq-primary" />
          <p className="font-bold text-tiq-navy">{t('pricing.unavailable')}</p>
          <p className="mt-2 text-sm text-tiq-muted">{t('pricing.unavailableHint')}</p>
        </div>
      ) : (
        <PricingCards
          plans={plans}
          interval={interval}
          loadingPlan={loadingPlan}
          onCheckout={handleCheckout}
          labels={labels}
          currentPlanCode={null}
          isLoggedIn={!!user}
        />
      )}
    </div>
  );
}
