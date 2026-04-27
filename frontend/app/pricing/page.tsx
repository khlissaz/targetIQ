'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { MarketingShell } from '@/components/saas/MarketingShell';
import { PricingCards } from '@/components/saas/PricingCards';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { getStoredItem } from '@/lib/browserStorage';
import { ensureActiveBusiness } from '@/lib/business';
import { createCheckoutSession, getPricing, getSubscriptionSummary, type PricingPlan } from '@/services/billingServices';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PricingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [currency, setCurrency] = useState<'USD' | 'SAR'>('USD');
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlanCode, setCurrentPlanCode] = useState<string | null>(null);

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
        setError(typeof e?.message === 'string' ? e.message : 'Failed to load pricing');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [currency, interval, language]);

  // Detect auth state and current plan
  useEffect(() => {
    const token = typeof window !== 'undefined' ? getStoredItem('access-token') : null;
    if (!token?.trim()) return;
    setIsLoggedIn(true);
    getSubscriptionSummary()
      .then((s) => { if (s.planCode) setCurrentPlanCode(s.planCode); })
      .catch(() => { /* silently ignore — user may not have a subscription yet */ });
  }, []);

  const faqs = useMemo(() => [t('pricing.faq1'), t('pricing.faq2'), t('pricing.faq3')], [t]);

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
    noTeam: t('pricing.noTeam'),
    unlimited: t('pricing.unlimited'),
    upTo: (count: number) => t('landing.pricing.teamUpTo').replace('{{count}}', String(count)),
    monthlyLabel: t('pricing.monthlyLabel'),
    yearlyLabel: t('pricing.yearlyLabel'),
    faqTitle: t('pricing.faqTitle'),
    faq1: t('pricing.faq1'),
    faq2: t('pricing.faq2'),
    faq3: t('pricing.faq3'),
    launchTitle: t('pricing.launchTitle'),
    launchBody: t('pricing.launchBody'),
    onboarding: t('pricing.onboarding'),
    secureBilling: t('pricing.secureBilling'),
    teamReady: t('pricing.teamReady'),
    stripeNotice: t('pricing.stripeNotice'),
    upgrade: t('pricing.upgrade'),
    downgrade: t('pricing.downgrade'),
    currentPlan: t('pricing.currentPlan'),
  }), [t]);

  const handleCheckout = async (plan: PricingPlan) => {
    const token = typeof window !== 'undefined' ? getStoredItem('access-token') : null;
    if (!token || !token.trim()) {
      router.push('/auth/login?next=/pricing');
      return;
    }
    try {
      setLoadingPlan(plan.planCode);
      await ensureActiveBusiness();
      const { checkoutUrl } = await createCheckoutSession({ planCode: plan.planCode, currency: plan.currency, billingInterval: interval });
      if (typeof window !== 'undefined') window.location.href = checkoutUrl;
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Could not start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <MarketingShell title={t('pricing.pageTitle')} subtitle={t('pricing.pageSubtitle')}>
      <section className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card className="border-tiq-border bg-white/90">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="inline-flex rounded-xl border border-tiq-border bg-white p-1">
              <Button variant={interval === 'MONTHLY' ? 'default' : 'ghost'} className={interval === 'MONTHLY' ? 'bg-tiq-primary hover:opacity-95' : ''} onClick={() => setInterval('MONTHLY')}>{t('pricing.monthlyLabel')}</Button>
              <Button variant={interval === 'YEARLY' ? 'default' : 'ghost'} className={interval === 'YEARLY' ? 'bg-tiq-primary hover:opacity-95' : ''} onClick={() => setInterval('YEARLY')}>{t('pricing.yearlyLabel')}</Button>
            </div>
            <div className="inline-flex rounded-xl border border-tiq-border bg-white p-1">
              <Button variant={currency === 'USD' ? 'default' : 'ghost'} className={currency === 'USD' ? 'bg-tiq-primary hover:opacity-95' : ''} onClick={() => setCurrency('USD')}>USD</Button>
              <Button variant={currency === 'SAR' ? 'default' : 'ghost'} className={currency === 'SAR' ? 'bg-tiq-primary hover:opacity-95' : ''} onClick={() => setCurrency('SAR')}>SAR</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-tiq-border bg-tiq-navy text-white">
          <CardContent className="flex h-full min-h-[96px] flex-col justify-center gap-3 p-4">
            <div className="text-sm font-semibold">{t('pricing.launchTitle')}</div>
            <div className="text-sm text-white/75">{t('pricing.launchBody')}</div>
            <div className="flex flex-wrap gap-2 text-xs text-white/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"><ShieldCheck className="h-3.5 w-3.5" />{t('pricing.secureBilling')}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"><Sparkles className="h-3.5 w-3.5" />{t('pricing.teamReady')}</span>
            </div>
            <Link href="/onboarding" className="inline-flex items-center gap-1 text-sm font-medium text-white">
              {t('pricing.onboarding')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      {error ? <Card className="mb-6 border-red-200 bg-red-50"><CardContent className="p-4 text-sm text-red-700">{error}</CardContent></Card> : null}
      {loading ? <Card><CardContent className="p-6 text-sm text-tiq-muted">{t('pricing.loading')}</CardContent></Card> : <PricingCards plans={plans} interval={interval} loadingPlan={loadingPlan} onCheckout={handleCheckout} labels={labels} currentPlanCode={currentPlanCode} isLoggedIn={isLoggedIn} />}

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold text-tiq-navy">{t('pricing.faqTitle')}</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {faqs.map((item) => (
            <Card key={item} className="border-tiq-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-tiq-navy"><CheckCircle2 className="h-4 w-4 text-tiq-primary" />TargetIQ</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-tiq-muted">{item}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
