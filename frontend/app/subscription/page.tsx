'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Briefcase, CalendarClock, Sparkles } from 'lucide-react';
import { MarketingShell } from '@/components/saas/MarketingShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { getSubscriptionSummary, SubscriptionSummary } from '@/services/billingServices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditMeter } from '@/components/tiq/CreditMeter';

export default function SubscriptionPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [usage, setUsage] = useState<SubscriptionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptionSummary().then(setUsage).catch((e: any) => setError(typeof e?.message === 'string' ? e.message : 'Failed to load subscription'));
  }, []);

  const renewalText = useMemo(() => {
    if (!usage?.renewalDate) return '—';
    try { return new Date(usage.renewalDate).toLocaleDateString(); } catch { return usage.renewalDate; }
  }, [usage?.renewalDate]);

  return (
    <MarketingShell title={t('subscription.title')} subtitle={t('subscription.subtitle')}>
      {error ? <Card className="mb-6 border-red-200 bg-red-50"><CardContent className="p-4 text-sm text-red-700">{error}</CardContent></Card> : null}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-tiq-border">
          <CardHeader><CardTitle className="text-tiq-navy">{usage?.planCode || '—'}</CardTitle></CardHeader>
          <CardContent className="grid gap-5 text-sm text-tiq-muted">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-tiq-bg px-4 py-3"><div className="mb-1 text-xs uppercase tracking-wide">{t('subscription.renewal')}</div><div className="font-semibold text-tiq-text">{renewalText}</div></div>
              <div className="rounded-xl bg-tiq-bg px-4 py-3"><div className="mb-1 text-xs uppercase tracking-wide">{t('subscription.currency')}</div><div className="font-semibold text-tiq-text">{usage?.currency || 'USD'}</div></div>
              <div className="rounded-xl bg-tiq-bg px-4 py-3"><div className="mb-1 text-xs uppercase tracking-wide">{t('subscription.addon')}</div><div className="font-semibold text-tiq-text">{usage?.addonBalance ?? 0}</div></div>
              <div className="rounded-xl bg-tiq-bg px-4 py-3"><div className="mb-1 text-xs uppercase tracking-wide">{t('subscription.workspace')}</div><div className="font-semibold capitalize text-tiq-text">{usage?.workspaceType || 'business'}</div></div>
            </div>
            <CreditMeter label={t('subscription.capture')} used={usage?.capture.monthlyUsed ?? 0} cap={usage?.capture.monthlyCap ?? 0} helperText={`${usage?.capture.monthlyRemaining ?? 0} ${t('subscription.remaining')}`} />
            <CreditMeter label={t('subscription.enrich')} used={usage?.enrich.monthlyUsed ?? 0} cap={usage?.enrich.monthlyCap ?? 0} helperText={`${usage?.enrich.monthlyRemaining ?? 0} ${t('subscription.remaining')}`} tone="success" />
          </CardContent>
        </Card>

        <Card className="border-tiq-border bg-tiq-navy text-white">
          <CardHeader><CardTitle className="text-white">{t('subscription.status')}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm text-white/80">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 w-fit"><CalendarClock className="h-4 w-4" />{usage?.status || 'active'}</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 w-fit"><Briefcase className="h-4 w-4" />{usage?.planCode || 'FREE'}</div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 w-fit"><Sparkles className="h-4 w-4" />{t('subscription.upgrade')}: {usage?.recommendedUpgrade || '—'}</div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/billing"><Button className="bg-tiq-primary hover:opacity-95">{t('subscription.manage')}</Button></Link>
              <Link href="/pricing"><Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">{t('subscription.pricing')}<ArrowUpRight className="ml-2 h-4 w-4" /></Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}
