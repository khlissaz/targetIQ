'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, CheckCircle2, Chrome, CreditCard, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { CHROME_STORE_URL } from '@/lib/constants';
import { getOnboardingSummary } from '@/services/billingServices';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

// ── Inline sub-components ──────────────────────────────────────────────────

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-tiq-bg">
      <div className="h-10 w-10 rounded-full border-2 border-tiq-border border-t-tiq-primary animate-spin" />
    </div>
  );
}

function localizedPlanName(planCode: string | null | undefined, t: (key: string) => string) {
  const code = String(planCode || 'FREE').toUpperCase();
  const map: Record<string, string> = {
    FREE: t('pricing.free'),
    STARTER: t('pricing.starter'),
    PROFESSIONAL: t('pricing.professional'),
    ENTERPRISE: t('pricing.enterprise'),
  };
  return map[code] || code;
}

function StepPathCard({ number, title, hint }: { number: string; title: string; hint: string }) {
  return (
    <div className="rounded-xl bg-tiq-bg p-3 text-center">
      <span className="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-tiq-primary shadow-sm" dir="ltr">{number}</span>
      <strong className="block text-tiq-navy">{title}</strong>
      <span>{hint}</span>
    </div>
  );
}

function ReadinessCell({ label, done, value }: { label: string; done?: boolean; value?: string }) {
  return (
    <div className="rounded-tiq border border-tiq-border bg-tiq-surface px-3 py-2.5 text-center">
      <div className={cn('text-[18px] font-bold leading-tight', done ? 'text-tiq-success' : 'text-tiq-muted')}>
        {value || (done ? '✓' : '—')}
      </div>
      <div className="text-[10px] text-tiq-muted mt-0.5 font-medium">{label}</div>
    </div>
  );
}

interface OnboardingStepProps {
  number: number;
  title: string;
  description: string;
  status: 'done' | 'active' | 'locked';
  cta: string;
  onAction?: () => void | Promise<void>;
  href?: string;
  external?: boolean;
}

function OnboardingStep({ number, title, description, status, cta, onAction, href, external }: OnboardingStepProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const isDone = status === 'done';
  const isLocked = status === 'locked';

  return (
    <div className={cn(
      'flex gap-4 rounded-tiqLg border p-4 transition-all',
      isDone   ? 'border-tiq-success/20 bg-tiq-success/5 opacity-70'
      : isLocked ? 'border-tiq-border bg-tiq-bg opacity-45'
                 : 'border-tiq-primary/25 bg-tiq-surface shadow-sm',
    )}>
      {/* Step indicator */}
      <div className={cn(
        'h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold',
        isDone   ? 'bg-tiq-success text-white'
        : isLocked ? 'bg-tiq-border text-tiq-muted'
                   : 'bg-tiq-primary text-white',
      )}>
        {isDone ? <CheckCircle2 className="h-4 w-4" /> : number}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            'text-[13px] font-semibold',
            isDone ? 'text-tiq-success' : isLocked ? 'text-tiq-muted' : 'text-tiq-navy',
          )}>{title}</span>
          {isDone && (
            <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-tiq-success/10 text-tiq-success border border-tiq-success/20">
              {t('onboarding.doneBadge')}
            </span>
          )}
        </div>
        <p className="text-[12px] text-tiq-muted leading-relaxed mb-3">{description}</p>

        {!isLocked && (
          onAction ? (
            <Button
              size="sm"
              className={isDone
                ? 'bg-tiq-success/10 text-tiq-success border border-tiq-success/20 hover:bg-tiq-success/20'
                : 'bg-tiq-primary text-white hover:opacity-90'}
              variant={isDone ? 'ghost' : 'default'}
              onClick={onAction}
            >
              {isDone ? t('onboarding.openDashboard') : cta}
            </Button>
          ) : external ? (
            <a href={href} target="_blank" rel="noreferrer">
              <Button
                size="sm"
                className={isDone
                  ? 'bg-transparent border border-tiq-border text-tiq-muted'
                  : 'bg-tiq-primary text-white hover:opacity-90'}
              >
                {isDone ? t('onboarding.installed') : cta}
              </Button>
            </a>
          ) : (
            <Link href={href || '#'}>
              <Button
                size="sm"
                className={isDone
                  ? 'bg-transparent border border-tiq-border text-tiq-muted'
                  : 'bg-tiq-primary text-white hover:opacity-90'}
              >
                {cta}
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const { t, dir } = useTranslation(language);
  const { user, activeBusinessId, provisionWorkspace, loading: authLoading } = useAuth();
  const [creating, setCreating] = useState(false);
  const [summary, setSummary] = useState<{ hasAccount: boolean; hasWorkspace: boolean; planCode: string } | null>(null);
  const selectedPlan = searchParams.get('plan');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push(`/auth/login?next=${encodeURIComponent(selectedPlan ? `/onboarding?plan=${selectedPlan}` : '/onboarding')}`);
  }, [authLoading, user, router, selectedPlan]);

  useEffect(() => {
    getOnboardingSummary()
      .then((res) => setSummary({ hasAccount: res.hasAccount, hasWorkspace: res.hasWorkspace, planCode: res.planCode }))
      .catch(() => undefined);
  }, []);

  const stepStatus = {
    workspace: summary?.hasWorkspace || !!activeBusinessId ? 'done' as const
               : summary?.hasAccount || !!user ? 'active' as const : 'locked' as const,
    plan:      summary?.planCode && summary.planCode !== 'FREE' ? 'done' as const
               : summary?.hasWorkspace || !!activeBusinessId ? 'active' as const : 'locked' as const,
    extension: 'active' as const,
    capture:   activeBusinessId ? 'active' as const : 'locked' as const,
  };

  const handleCreateWorkspace = useMemo(() => async () => {
    if (activeBusinessId) { router.push(`/dashboard/${activeBusinessId}/leads`); return; }
    setCreating(true);
    try {
      const id = await provisionWorkspace();
      if (id) router.push(`/dashboard/${id}/leads`);
    } finally {
      setCreating(false);
    }
  }, [activeBusinessId, provisionWorkspace, router]);

  if (authLoading) return <FullPageSpinner />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-tiq-bg flex flex-col" dir={dir}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-tiq-surface border-b border-tiq-border">
        <Link href="/landing">
          <Logo showTagline={false} />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {activeBusinessId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/${activeBusinessId}/leads`)}
            >
          {t('onboarding.skipDashboard')}
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-lg">
          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-bold text-tiq-navy tracking-tight">{t('onboarding.title')}</h1>
            <p className="text-sm text-tiq-muted mt-2">{t('onboarding.subtitle')}</p>
          </div>

          {selectedPlan ? (
            <div className="mb-5 rounded-tiqLg border border-tiq-primary/25 bg-tiq-primary/5 p-4 text-sm text-tiq-navy">
              <div className="font-bold">{t('onboarding.selectedPlan')}: {localizedPlanName(selectedPlan, t)}</div>
              <div className="mt-1 text-tiq-muted">{t('onboarding.selectedPlanBody')}</div>
            </div>
          ) : null}

          <div className="mb-5 rounded-tiqLg border border-tiq-border bg-tiq-surface p-4">
            <div className="text-sm font-bold text-tiq-navy">{t('onboarding.setupPath')}</div>
            <div className="mt-3 grid gap-2 text-xs text-tiq-muted sm:grid-cols-4">
              <StepPathCard number="1" title={t('onboarding.account')} hint={t('onboarding.accountHint')} />
              <StepPathCard number="2" title={t('onboarding.workspace')} hint={t('onboarding.workspaceHint')} />
              <StepPathCard number="3" title={t('onboarding.plan')} hint={t('onboarding.planHint')} />
              <StepPathCard number="4" title={t('onboarding.extension')} hint={t('onboarding.extensionHint')} />
            </div>
          </div>

          {/* Readiness strip */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            <ReadinessCell label={t('onboarding.account')}   done={summary?.hasAccount || !!user} />
            <ReadinessCell label={t('onboarding.workspace')}  done={summary?.hasWorkspace || !!activeBusinessId} />
            <ReadinessCell label={t('onboarding.plan')} value={summary?.planCode || 'FREE'} done={!!summary?.planCode} />
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <OnboardingStep
              number={1}
              title={t('onboarding.create')}
              description={t('onboarding.step1')}
              status={stepStatus.workspace}
              cta={creating ? t('onboarding.creating') : t('onboarding.create')}
              onAction={handleCreateWorkspace}
            />
            <OnboardingStep
              number={2}
              title={t('onboarding.pricing')}
              description={t('onboarding.step2')}
              status={stepStatus.plan}
              cta={t('onboarding.pricing')}
              href={selectedPlan ? `/pricing?plan=${encodeURIComponent(selectedPlan)}` : '/pricing'}
            />
            <OnboardingStep
              number={3}
              title={t('onboarding.install')}
              description={t('onboarding.step3')}
              status={stepStatus.extension}
              cta={t('onboarding.install')}
              href={CHROME_STORE_URL}
              external
            />
            <OnboardingStep
              number={4}
              title={t('onboarding.openApp')}
              description={t('onboarding.step4')}
              status={stepStatus.capture}
              cta={t('onboarding.done')}
              href={activeBusinessId ? `/dashboard/${activeBusinessId}/leads` : '/dashboard'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
