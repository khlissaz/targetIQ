'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TiqBanner } from '@/components/tiq/TiqBanner';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqCard } from '@/components/tiq/TiqCard';
import { CHROME_STORE_URL } from '@/lib/constants';
import { ensureActiveBusiness } from '@/lib/business';
import { createCheckoutSession, getPricing, type PricingPlan } from '@/services/billingServices';
import { safeLog } from '@/lib/safeLogging';
import {
  Chrome,
  LayoutDashboard,
  TrendingUp,
  Globe,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Users,
  MousePointerClick,
  Sparkles,
  ListFilter,
  Download,
  Menu,
  X,
} from 'lucide-react';

export default function LandingPage() {
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);
  const { user, activeBusinessId, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pricing, setPricing] = useState<{ currency: string; billingInterval: 'MONTHLY' | 'YEARLY'; plans: PricingPlan[] } | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [checkoutLoadingPlanId, setCheckoutLoadingPlanId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'SAR'>('USD');
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPricingLoading(true);
        setPricingError(null);
        const res = await getPricing(currency, language, billingInterval);
        if (!mounted) return;
        setPricing(res);
      } catch (e: any) {
        if (!mounted) return;
        setPricingError(typeof e?.message === 'string' ? e.message : 'Failed to load pricing.');
      } finally {
        if (mounted) setPricingLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currency, billingInterval, language]);

  const sortedPlans = useMemo(() => {
    const planCount = Array.isArray(pricing?.plans) ? pricing.plans.length : 0;
    safeLog('info', 'landing.pricing.sorted', { planCount });
    // Preserve DB displayOrder (backend already sorts ASC, but we reorder
    // here in case the response order ever changes client-side).
    const plans = pricing?.plans ?? [];
    return [...plans].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [pricing?.plans]);

  const formatPrice = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  };

  const handleCheckout = async (plan: PricingPlan) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access-token') : null;
    if (!token || !token.trim()) {
      router.push('/auth/login?next=/#pricing');
      return;
    }

    try {
      setCheckoutLoadingPlanId(plan.planCode);
      await ensureActiveBusiness();
      const { checkoutUrl } = await createCheckoutSession({
        planCode: plan.planCode || undefined,
        currency: plan.currency,
        billingInterval,
      });
      if (typeof window !== 'undefined') window.location.href = checkoutUrl;
    } catch (e: any) {
      setPricingError(typeof e?.message === 'string' ? e.message : 'Failed to start checkout.');
    } finally {
      setCheckoutLoadingPlanId(null);
    }
  };

  const scrollTo = (id: string) => {
    try {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      // ignore
    }
  };

  const getPlanTierKey = (plan: PricingPlan): 'free' | 'starter' | 'pro' | 'enterprise' | 'other' => {
    const code = (plan.planCode || '').toUpperCase();
    if (code === 'FREE') return 'free';
    if (code === 'STARTER') return 'starter';
    if (code === 'PRO') return 'pro';
    if (code === 'ENTERPRISE') return 'enterprise';

    const n = plan.name.toLowerCase();
    if (n.includes('free')) return 'free';
    if (n.includes('starter')) return 'starter';
    if (n.includes('professional') || n.includes('pro')) return 'pro';
    if (n.includes('enterprise')) return 'enterprise';
    return 'other';
  };

  // Features now come directly from the database via /billing/pricing,
  // already localized based on the current language.

  return (
    <div className="min-h-screen bg-tiq-bg" dir={dir}>
      <header className="border-b border-tiq-border/60 bg-tiq-surface/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <Logo showTagline={false} className="cursor-pointer" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="#features"
                className="px-4 py-2 text-sm font-medium text-tiq-muted hover:text-tiq-navy hover:bg-tiq-bg rounded-lg transition-all"
              >
                {t('features')}
              </Link>
              <Link
                href="#how-it-works"
                className="px-4 py-2 text-sm font-medium text-tiq-muted hover:text-tiq-navy hover:bg-tiq-bg rounded-lg transition-all"
              >
                {t('landing.howItWorksTitle') || 'How It Works'}
              </Link>
              <Link
                href="#pricing"
                className="px-4 py-2 text-sm font-medium text-tiq-muted hover:text-tiq-navy hover:bg-tiq-bg rounded-lg transition-all"
              >
                {t('pricing')}
              </Link>
              <Link
                href="#extension"
                className="px-4 py-2 mx-1 text-sm font-semibold bg-tiq-primary/10 text-tiq-primary rounded-lg border border-tiq-primary/20 hover:bg-tiq-primary hover:text-white transition-all"
              >
                {t('extension')}
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {!authLoading && (
                user ? (
                  activeBusinessId ? (
                    <Link href={`/dashboard/${activeBusinessId}`}>
                      <TiqButton variant="primary" size="sm">
                        {t('dashboard')}
                      </TiqButton>
                    </Link>
                  ) : (
                    <Link href="/onboarding">
                      <TiqButton variant="primary" size="sm">
                        {t('onboarding.create') || t('getStarted')}
                      </TiqButton>
                    </Link>
                  )
                ) : (
                  <>
                    <Link href="/auth/login" className="hidden sm:inline-flex">
                      <Button variant="ghost" size="sm">
                        {t('login')}
                      </Button>
                    </Link>
                    <Link href="/auth/signup" className="hidden sm:inline-flex">
                      <TiqButton variant="primary" size="sm">
                        {t('signup')}
                      </TiqButton>
                    </Link>
                  </>
                )
              )}
              {/* Mobile hamburger — visible below lg */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile nav drawer */}
          {mobileMenuOpen && (
            <div className="border-t border-tiq-border/40 pb-3 lg:hidden">
              <nav className="space-y-1 pt-2">
                {[
                  { href: '#features', label: t('features') },
                  { href: '#how-it-works', label: t('landing.howItWorksTitle') || 'How It Works' },
                  { href: '#pricing', label: t('pricing') },
                  { href: '#extension', label: t('extension') },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-tiq-muted hover:bg-tiq-bg hover:text-tiq-navy transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                {!authLoading && !user && (
                  <div className="mt-2 flex gap-2 border-t border-tiq-border/40 pt-2 sm:hidden">
                    <Link href="/auth/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full">{t('login')}</Button>
                    </Link>
                    <Link href="/auth/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <TiqButton variant="primary" size="sm" className="w-full">{t('signup')}</TiqButton>
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-tiq-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <Logo className="mx-auto mb-8" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-tiq-navy leading-tight">
              {t('landingHero')}
            </h1>
            <p className="text-lg sm:text-xl text-tiq-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('landingHeroDesc')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="#pricing">
                <TiqButton size="lg" variant="primary" className="shadow-lg">
                  {t('getStarted')} <ArrowRight className="ms-2 w-5 h-5" />
                </TiqButton>
              </Link>
              <Link href="#features">
                <TiqButton size="lg" variant="outline">
                  {t('learnMore')}
                </TiqButton>
              </Link>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 text-sm text-tiq-muted">
              <span>{t('landing.socialProofTitle')}</span>
              <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold text-tiq-navy/80">
                <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
                  {t('landing.socialProof.shopify')}
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
                  {t('landing.socialProof.airtable')}
                </span>
                <span className="rounded-full bg-white/70 px-3 py-1 shadow-sm">
                  {t('landing.socialProof.zoominfo')}
                </span>
              </div>
            </div>

            <div className="mt-16 lg:mt-20 relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-tiq-primary to-tiq-navy rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-tiq-border">
                <div className="bg-gradient-to-br from-tiq-navy to-tiq-navy/90 p-8 sm:p-12 lg:p-16 aspect-video flex items-center justify-center">
                  <div className="text-tiq-surface text-center">
                    <LayoutDashboard className="w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 text-tiq-primary" />
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{t('dashboard')}</h3>
                    <p className="text-tiq-surface/80 text-sm sm:text-lg">{t('landing.dashboardHeroSubtitle')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-tiq-navy mb-4">{t('features')}</h2>
            <p className="text-lg lg:text-xl text-tiq-muted">{t('landing.featuresIntro')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <TiqCard className="border-t-4 border-t-tiq-primary hover:shadow-xl transition-all duration-200" hover>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-2xl bg-tiq-primary/10 p-4 mb-4">
                  <Chrome className="w-10 h-10 text-tiq-primary" />
                </div>
                <h3 className="text-lg font-semibold text-tiq-navy mb-2">{t('feature1Title')}</h3>
                <p className="text-sm text-tiq-muted leading-relaxed">{t('feature1Desc')}</p>
              </div>
            </TiqCard>

            <TiqCard className="border-t-4 border-t-tiq-primary hover:shadow-xl transition-all duration-200" hover>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-2xl bg-tiq-primary/10 p-4 mb-4">
                  <LayoutDashboard className="w-10 h-10 text-tiq-primary" />
                </div>
                <h3 className="text-lg font-semibold text-tiq-navy mb-2">{t('feature2Title')}</h3>
                <p className="text-sm text-tiq-muted leading-relaxed">{t('feature2Desc')}</p>
              </div>
            </TiqCard>

            <TiqCard className="border-t-4 border-t-tiq-primary hover:shadow-xl transition-all duration-200" hover>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-2xl bg-tiq-primary/10 p-4 mb-4">
                  <TrendingUp className="w-10 h-10 text-tiq-primary" />
                </div>
                <h3 className="text-lg font-semibold text-tiq-navy mb-2">{t('feature3Title')}</h3>
                <p className="text-sm text-tiq-muted leading-relaxed">{t('feature3Desc')}</p>
              </div>
            </TiqCard>

            <TiqCard className="border-t-4 border-t-tiq-primary hover:shadow-xl transition-all duration-200" hover>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-2xl bg-tiq-primary/10 p-4 mb-4">
                  <Globe className="w-10 h-10 text-tiq-primary" />
                </div>
                <h3 className="text-lg font-semibold text-tiq-navy mb-2">{t('feature4Title')}</h3>
                <p className="text-sm text-tiq-muted leading-relaxed">{t('feature4Desc')}</p>
              </div>
            </TiqCard>
          </div>
        </div>
      </section>
      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-tiq-navy mb-4">
              {t('landing.howItWorksTitle') || 'How TargetIQ Works'}
            </h2>
            <p className="text-lg text-tiq-muted">
              {t('landing.howItWorksSubtitle') || 'From lead capture to enriched contact data in four simple steps.'}
            </p>
          </div>
          <div className="relative">
            {/* connector line, hidden on mobile */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-tiq-border to-transparent" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: 1,
                  Icon: MousePointerClick,
                  title: t('landing.howItWorks.step1Title') || 'Collect',
                  body: t('landing.howItWorks.step1Body') || 'Install the Chrome extension and capture leads directly from LinkedIn or WhatsApp with a single click.',
                },
                {
                  step: 2,
                  Icon: Sparkles,
                  title: t('landing.howItWorks.step2Title') || 'Enrich',
                  body: t('landing.howItWorks.step2Body') || 'TargetIQ automatically finds verified email addresses and phone numbers for every lead you collect.',
                },
                {
                  step: 3,
                  Icon: ListFilter,
                  title: t('landing.howItWorks.step3Title') || 'Review',
                  body: t('landing.howItWorks.step3Body') || 'Manage and filter your leads in the dashboard. Add notes, update status, and prioritise follow-ups.',
                },
                {
                  step: 4,
                  Icon: Download,
                  title: t('landing.howItWorks.step4Title') || 'Export & Reach Out',
                  body: t('landing.howItWorks.step4Body') || 'Export enriched leads to CSV or send them directly to your CRM, outreach tool, or email sequence.',
                },
              ].map(({ step, Icon, title, body }) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <div className="relative mb-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-tiq-primary/10 ring-1 ring-tiq-primary/20">
                      <Icon className="h-9 w-9 text-tiq-primary" />
                    </div>
                    <span className="absolute -top-2 -end-2 flex h-6 w-6 items-center justify-center rounded-full bg-tiq-primary text-[11px] font-bold text-white shadow-sm">
                      {step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-tiq-navy">{title}</h3>
                  <p className="text-sm leading-relaxed text-tiq-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-tiq-bg">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-tiq-navy mb-4">
              {t('landing.benefitsTitle')}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <TiqCard hover className="text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tiq-primary/10">
                  <TrendingUp className="h-6 w-6 text-tiq-primary" />
                </div>
                <h3 className="text-base font-semibold text-tiq-navy">
                  {t('landing.benefits.salesBoostTitle') || 'Accelerate Your Pipeline'}
                </h3>
                <p className="text-sm text-tiq-muted leading-relaxed">{t('landing.benefits.salesBoost')}</p>
              </div>
            </TiqCard>
            <TiqCard hover className="text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tiq-primary/10">
                  <Users className="h-6 w-6 text-tiq-primary" />
                </div>
                <h3 className="text-base font-semibold text-tiq-navy">
                  {t('landing.benefits.qualifiedLeadsTitle') || 'Target the Right Buyers'}
                </h3>
                <p className="text-sm text-tiq-muted leading-relaxed">{t('landing.benefits.qualifiedLeads')}</p>
              </div>
            </TiqCard>
            <TiqCard hover className="text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tiq-primary/10">
                  <Zap className="h-6 w-6 text-tiq-primary" />
                </div>
                <h3 className="text-base font-semibold text-tiq-navy">
                  {t('landing.benefits.responseTimeTitle') || 'Respond Before Competitors'}
                </h3>
                <p className="text-sm text-tiq-muted leading-relaxed">{t('landing.benefits.responseTime')}</p>
              </div>
            </TiqCard>
          </div>
        </div>
      </section>
      <section id="pricing" className="py-20 bg-gradient-to-b from-tiq-surface to-tiq-bg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-bold text-tiq-navy mb-2">{t('pricing')}</h2>
              <p className="text-xl text-tiq-muted">{t('landing.pricingSubtitle')}</p>
            </div>
            <div className="flex flex-col items-center justify-center md:items-end md:justify-end gap-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-tiq-muted mr-1">{t('billing.currency') || 'Currency'}:</span>
                <div className="inline-flex rounded-full border border-tiq-border bg-tiq-surface p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 rounded-full transition ${
                      currency === 'USD' ? 'bg-tiq-primary text-white shadow-sm' : 'text-tiq-muted'
                    }`}
                  >
                    USD
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('SAR')}
                    className={`px-3 py-1 rounded-full transition ${
                      currency === 'SAR' ? 'bg-tiq-primary text-white shadow-sm' : 'text-tiq-muted'
                    }`}
                  >
                    SAR
                  </button>
                </div>
              </div>
              <span className="text-sm text-tiq-muted mr-1">{t('billing.interval') || 'Billing interval'}:</span>
              <div className="inline-flex rounded-full border border-tiq-border bg-tiq-surface p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setBillingInterval('MONTHLY')}
                  className={`px-3 py-1 rounded-full transition ${
                    billingInterval === 'MONTHLY' ? 'bg-tiq-primary text-white shadow-sm' : 'text-tiq-muted'
                  }`}
                >
                  {t('billing.monthly') || 'Monthly'}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval('YEARLY')}
                  className={`px-3 py-1 rounded-full transition ${
                    billingInterval === 'YEARLY' ? 'bg-tiq-primary text-white shadow-sm' : 'text-tiq-muted'
                  }`}
                >
                  {t('billing.yearly') || 'Yearly'}
                </button>
              </div>
            </div>
          </div>

          {pricingError && (
            <div className="max-w-3xl mx-auto mb-8">
              <TiqBanner variant="danger" title={t('pricing.unavailable')}>
                {pricingError}
              </TiqBanner>
            </div>
          )}

          {pricingLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="rounded-tiqLg border border-tiq-border bg-tiq-surface shadow-tiq p-6 animate-pulse">
                  <div className="h-5 w-32 bg-tiq-border/60 rounded mb-4" />
                  <div className="h-10 w-40 bg-tiq-border/60 rounded mb-4" />
                  <div className="h-4 w-full bg-tiq-border/60 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-tiq-border/60 rounded mb-6" />
                  <div className="h-10 w-full bg-tiq-border/60 rounded" />
                </div>
              ))}
            </div>
          ) : sortedPlans.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {sortedPlans.map((plan) => {
                const busy = checkoutLoadingPlanId === plan.planCode;
                const isHighlighted = plan.isFeatured === true;
                const isFree = plan.amount === 0;
                const badgeText = plan.badgeLabel || (isHighlighted ? t('pricing.most_popular') : null);
                return (
                  <TiqCard
                    key={plan.planCode}
                    className={`h-full flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                      isHighlighted ? 'border-2 border-tiq-primary shadow-lg bg-tiq-primary/5' : ''
                    }`}
                    title={<span className="text-base">{plan.name}</span>}
                    actions={
                      <span className="flex items-center gap-2 text-xs text-tiq-muted">
                        {isFree && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            {t('pricing.free')}
                          </span>
                        )}
                        {!plan.checkoutEnabled && (
                          <span className="inline-flex items-center rounded-full bg-tiq-border/50 px-2 py-0.5 text-[10px] font-semibold text-tiq-muted">
                            {t('pricing.contactUs') || 'Contact us'}
                          </span>
                        )}
                        <span>{plan.currency}</span>
                      </span>
                    }
                  >
                    <div className="flex flex-col h-full gap-4">
                      {badgeText && (
                        <div className="inline-flex items-center self-start rounded-full bg-tiq-primary/10 px-3 py-1 text-xs font-semibold text-tiq-primary">
                          {badgeText}
                        </div>
                      )}
                      <div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-3xl font-bold text-tiq-navy">
                            {plan.compareAtAmountMinor != null && plan.compareAtAmountMinor > plan.amount && (
                              <span className="mr-2 text-lg font-normal line-through text-tiq-muted">
                                {formatPrice(plan.compareAtAmountMinor, plan.currency)}
                              </span>
                            )}
                            {formatPrice(plan.amount, plan.currency)}
                            <span className="text-sm font-semibold text-tiq-muted">
                              {billingInterval === 'YEARLY' ? '/year' : '/mo'}
                            </span>
                          </div>
                          {billingInterval === 'YEARLY' && (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {t('pricing.yearly_savings') || 'Save vs monthly'}
                            </span>
                          )}
                        </div>
                        {plan.subtitle && (
                          <div className="text-sm font-medium text-tiq-navy mt-1">{plan.subtitle}</div>
                        )}
                        {plan.description && <div className="text-sm text-tiq-muted mt-1">{plan.description}</div>}
                        <div className="mt-3 space-y-1 text-xs text-tiq-muted">
                          {plan.monthlyCapture != null && (
                            <div className="flex items-center justify-between">
                              <span>{t('landing.pricing.capturesLabel') || 'Lead captures / month'}</span>
                              <span className="font-semibold text-tiq-text">{plan.monthlyCapture.toLocaleString()}</span>
                            </div>
                          )}
                          {plan.monthlyEnrich != null && (
                            <div className="flex items-center justify-between">
                              <span>{t('landing.pricing.enrichLabel') || 'Enrich credits / month'}</span>
                              <span className="font-semibold text-tiq-text">{plan.monthlyEnrich.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span>{t('landing.pricing.teamLabel') || 'Team members'}</span>
                            <span className="font-semibold text-tiq-text">
                              {!plan.teamEnabled
                                ? t('landing.pricing.teamNone') || 'Solo'
                                : plan.teamLimit != null
                                  ? `Up to ${plan.teamLimit}`
                                  : t('landing.pricing.teamUnlimited') || 'Unlimited'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const featureList = Array.isArray(plan.features) ? plan.features : [];
                        return (
                          <ul className="mt-4 space-y-2 border-t border-tiq-border/60 pt-4 text-sm">
                            {featureList.slice(0, 6).map((f) => (
                              <li key={f} className="flex items-start gap-3 text-tiq-text">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-tiq-primary" />
                                <span className="min-w-0">{f}</span>
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                      <div className="mt-auto pt-2">
                        <TiqButton
                          variant="primary"
                          className="w-full"
                          loading={busy}
                          disabled={!plan.checkoutEnabled || (!!checkoutLoadingPlanId && !busy)}
                          onClick={() => plan.checkoutEnabled && void handleCheckout(plan)}
                        >
                          {plan.checkoutEnabled ? t('getStarted') : (t('pricing.contactSales') || 'Contact sales')}
                        </TiqButton>
                      </div>
                    </div>
                  </TiqCard>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: t('landing.plan.free.title'),
                  price: 0,
                  currency,
                  description: t('landing.plan.free.description'),
                  credits: 50,
                  badge: t('pricing.free'),
                  highlighted: false,
                },
                {
                  name: t('landing.plan.starter.title'),
                  price: 19.99,
                  currency,
                  description: t('landing.plan.starter.description'),
                  credits: 500,
                  badge: null,
                  highlighted: false,
                },
                {
                  name: t('landing.plan.pro.title'),
                  price: 49.99,
                  currency,
                  description: t('landing.plan.pro.description'),
                  credits: 5000,
                  badge: t('pricing.most_popular'),
                  highlighted: true,
                },
                {
                  name: t('landing.plan.enterprise.title'),
                  price: 199.99,
                  currency,
                  description: t('landing.plan.enterprise.description'),
                  credits: 10000,
                  badge: null,
                  highlighted: false,
                },
              ].map((plan) => (
                <TiqCard
                  key={plan.name}
                  className={`h-full flex flex-col ${
                    plan.highlighted ? 'border-2 border-tiq-primary shadow-lg bg-tiq-primary/5' : ''
                  }`}
                  title={<span className="text-base">{plan.name}</span>}
                  actions={
                    <span className="flex items-center gap-2 text-xs text-tiq-muted">
                      {plan.badge && (
                        <span className="inline-flex items-center rounded-full bg-tiq-primary/10 px-2 py-0.5 text-[10px] font-semibold text-tiq-primary">
                          {plan.badge}
                        </span>
                      )}
                      <span>{plan.currency}</span>
                    </span>
                  }
                >
                  <div className="flex flex-col h-full gap-4">
                    {plan.highlighted && (
                      <div className="inline-flex items-center self-start rounded-full bg-tiq-primary/10 px-3 py-1 text-xs font-semibold text-tiq-primary">
                        {t('pricing.most_popular')}
                      </div>
                    )}
                    <div>
                      <div className="text-3xl font-bold text-tiq-navy">
                        {formatPrice(plan.price, plan.currency)}
                        <span className="text-sm font-semibold text-tiq-muted">/mo</span>
                      </div>
                      {plan.description && (
                        <div className="text-sm text-tiq-muted mt-1">{plan.description}</div>
                      )}
                      {typeof plan.credits === 'number' && Number.isFinite(plan.credits) && (
                        <div className="text-sm text-tiq-muted mt-2">{plan.credits.toLocaleString()} credits / month</div>
                      )}
                    </div>
                    <ul className="mt-4 space-y-2 border-t border-tiq-border/60 pt-4 text-sm">
                      {/* Simple static bullets for fallback */}
                      <li className="flex items-start gap-3 text-tiq-text">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-tiq-primary" />
                        <span className="min-w-0">{t('feature1Desc')}</span>
                      </li>
                      <li className="flex items-start gap-3 text-tiq-text">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-tiq-primary" />
                        <span className="min-w-0">{t('feature2Desc')}</span>
                      </li>
                    </ul>
                    <div className="mt-auto pt-2">
                      <TiqButton
                        variant="primary"
                        className="w-full"
                        onClick={() => router.push('/auth/signup?next=/#pricing')}
                      >
                        {t('getStarted')}
                      </TiqButton>
                    </div>
                  </div>
                </TiqCard>
              ))}
            </div>
          )}
          {/* Enrich pricing explanation */}
          <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
            <TiqCard title={t('landing.enrichPricingTitle') || 'Contact enrichment pricing'}>
              <div className="space-y-2 text-sm text-tiq-muted">
                <p>{t('landing.enrichPricingIntro') || 'You only pay enrich credits when we find contact details for a lead.'}</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{t('landing.enrichPricingEmail') || 'Email found: 1 enrich credit'}</li>
                  <li>{t('landing.enrichPricingPhone') || 'Phone found: 6 enrich credits'}</li>
                  <li>{t('landing.enrichPricingBoth') || 'Email + phone found: 7 enrich credits in total'}</li>
                  <li>{t('landing.enrichPricingNone') || 'If we find nothing: 0 credits used'}</li>
                </ul>
              </div>
            </TiqCard>

            <TiqCard title={t('landing.pricingFaqTitle') || 'Pricing FAQ'}>
              <div className="space-y-4 text-sm text-tiq-muted">
                <div>
                  <div className="font-semibold text-tiq-navy">
                    {t('landing.pricingFaq.captureQ') || 'What is Lead Capture?'}
                  </div>
                  <p>
                    {t('landing.pricingFaq.captureA')
                      || 'Lead Capture is saving profiles and lists from LinkedIn or WhatsApp into your TargetIQ workspace so you can manage and export them later.'}
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-tiq-navy">
                    {t('landing.pricingFaq.enrichQ') || 'How do enrichment credits work?'}
                  </div>
                  <p>
                    {t('landing.pricingFaq.enrichA')
                      || 'Enrichment credits are only used when we successfully find contact details. Each found email or phone number consumes enrich credits based on the rules above.'}
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-tiq-navy">
                    {t('landing.pricingFaq.addonQ') || 'Can I buy extra enrich credits?'}
                  </div>
                  <p>
                    {t('landing.pricingFaq.addonA')
                      || 'Yes. You can purchase add-on enrich credit packs from inside the app at any time without changing your base plan.'}
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-tiq-navy">
                    {t('landing.pricingFaq.rolloverQ') || 'Do unused credits roll over?'}
                  </div>
                  <p>
                    {t('landing.pricingFaq.rolloverA')
                      || 'Plan-based capture and enrich quotas reset each billing period and do not roll over. Purchased add-on enrich credits stay in your balance until you use them.'}
                  </p>
                </div>
              </div>
            </TiqCard>
          </div>
        </div>
      </section>

      <section id="extension" className="py-20 bg-gradient-to-br from-tiq-bg via-tiq-bg to-tiq-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-tiq-navy mb-4">{t('landing.extensionTitle')}</h2>
            <p className="text-xl text-tiq-muted">{t('landing.extensionSubtitle')}</p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 items-start">
            <TiqCard
              title={t('landing.extensionInstallTitle')}
              className="h-full border-2 border-tiq-primary shadow-tiq"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Chrome className="w-6 h-6 text-tiq-primary mt-0.5" />
                  <div className="text-sm text-tiq-text">
                    {t('landing.extensionInstallBody')}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TiqButton
                    variant="primary"
                    className="w-full md:w-auto shadow-tiq ring-2 ring-tiq-primary/70"
                    onClick={() => {
                      if (typeof window !== 'undefined') window.open(CHROME_STORE_URL, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {t('extension.install')}
                  </TiqButton>
                  <TiqButton variant="outline" onClick={() => scrollTo('extension-how')}>
                    {t('extension.howItWorks')}
                  </TiqButton>
                </div>
              </div>
            </TiqCard>

            <TiqCard title={t('extension.howItWorks')} className="h-full" >
              <ol id="extension-how" className="space-y-3 text-sm text-tiq-text">
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-tiq bg-tiq-primary/10 text-tiq-navy font-semibold">1</span>
                  <span>{t('landing.extensionStep1')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-tiq bg-tiq-primary/10 text-tiq-navy font-semibold">2</span>
                  <span>{t('landing.extensionStep2')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-tiq bg-tiq-primary/10 text-tiq-navy font-semibold">3</span>
                  <span>{t('landing.extensionStep3')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-tiq bg-tiq-primary/10 text-tiq-navy font-semibold">4</span>
                  <span>{t('landing.extensionStep4')}</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-tiq bg-tiq-primary/10 text-tiq-navy font-semibold">5</span>
                  <span>{t('landing.extensionStep5')}</span>
                </li>
              </ol>
            </TiqCard>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-tiq-navy to-tiq-navy/90 text-tiq-surface">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">{t('landing.whyTitle')}</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-tiq-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('landing.why.fastTitle')}</h3>
                    <p className="text-tiq-surface/80">{t('landing.why.fastBody')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-tiq-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('landing.why.secureTitle')}</h3>
                    <p className="text-tiq-surface/80">{t('landing.why.secureBody')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Zap className="w-6 h-6 text-tiq-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('landing.why.automationTitle')}</h3>
                    <p className="text-tiq-surface/80">{t('landing.why.automationBody')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-tiq-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{t('landing.why.teamTitle')}</h3>
                    <p className="text-tiq-surface/80">{t('landing.why.teamBody')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-tiq-surface/10 backdrop-blur-sm rounded-lg p-8 border border-tiq-surface/20">
              <div className="text-center">
                <Users className="w-16 h-16 text-tiq-primary mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4">{t('landing.why.joinTitle')}</h3>
                <p className="text-tiq-surface/80 mb-8">
                  {t('landing.why.joinBody')}
                </p>
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-tiq-primary hover:opacity-95 active:opacity-90 w-full">
                    {t('getStarted')} <ArrowRight className="ms-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-tiq-navy text-tiq-surface/70 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <Logo showTagline={true} className="mb-4" />
              <p className="text-sm">{t('landing.footer.tagline')}</p>
            </div>
            <div>
              <h4 className="text-tiq-surface font-semibold mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-tiq-primary">{t('features')}</Link></li>
                <li><Link href="#pricing" className="hover:text-tiq-primary">{t('pricing')}</Link></li>
                <li><Link href="#extension" className="hover:text-tiq-primary">{t('landing.chromeExtension')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-tiq-surface font-semibold mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-tiq-primary">{t('landing.footer.about')}</Link></li>
                <li><Link href="#" className="hover:text-tiq-primary">{t('landing.footer.contact')}</Link></li>
                <li><Link href="#" className="hover:text-tiq-primary">{t('landing.footer.privacy')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-tiq-surface font-semibold mb-4">{t('landing.footer.support')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-tiq-primary">{t('landing.footer.helpCenter')}</Link></li>
                <li><Link href="#" className="hover:text-tiq-primary">{t('landing.footer.docs')}</Link></li>
                <li><Link href="#" className="hover:text-tiq-primary">{t('landing.footer.api')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-tiq-surface/10 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 TargetIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
