'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Coins, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { MarketingShell } from '@/components/saas/MarketingShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useSearchParams } from 'next/navigation';
import { createCreditPackCheckout, getBillingUsage, type BillingUsageResponse } from '@/services/billingServices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';



const packs = [
  { code: 'PACK_100' as const, credits: 100 },
  { code: 'PACK_500' as const, credits: 500 },
  { code: 'PACK_1000' as const, credits: 1000 },
];

function Meter({ used, total }: { used: number; total: number | null }) {
  const pct = total && total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-tiq-border/40"><div className="h-full rounded-full bg-tiq-primary" style={{ width: `${pct}%` }} /></div>
      <div className="text-xs text-tiq-muted">{used}{total != null ? ` / ${total}` : ''}</div>
    </div>
  );
}

export default function BillingPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [usage, setUsage] = useState<BillingUsageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getBillingUsage();
        if (active) setUsage(res);
      } catch (e: any) {
        if (active) setError(typeof e?.message === 'string' ? e.message : 'Failed to load billing usage');
      }
    })();
    return () => { active = false; };
  }, []);

  const renewal = useMemo(() => {
    if (!usage?.renewalDate) return '—';
    try { return new Date(usage.renewalDate).toLocaleDateString(); } catch { return usage.renewalDate; }
  }, [usage?.renewalDate]);

  const buyPack = async (code: 'PACK_100' | 'PACK_500' | 'PACK_1000') => {
    try {
      setLoadingPack(code);
      const { checkoutUrl } = await createCreditPackCheckout({ packCode: code, currency: (usage?.currency || 'USD') as string });
      if (typeof window !== 'undefined') window.location.href = checkoutUrl;
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to start credit checkout');
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <MarketingShell title={t('billing.pageTitle')} subtitle={t('billing.pageSubtitle')}>
      {error ? <Card className="mb-6 border-red-200 bg-red-50"><CardContent className="p-4 text-sm text-red-700">{error}</CardContent></Card> : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-tiq-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-tiq-navy"><CreditCard className="h-5 w-5 text-tiq-primary" />{t('billing.currentPlan')}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tiq-navy">{usage?.plan || '—'}</div>
            <div className="mt-2 text-sm text-tiq-muted">{t('billing.renews_on')}: {renewal}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/pricing"><Button className="bg-tiq-primary hover:opacity-95">{t('billing.upgrade')}</Button></Link>
              <Link href="/subscription"><Button variant="outline">{t('billing.subscription')}</Button></Link>
            </div>
          </CardContent>
        </Card>
        <Card className="border-tiq-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-tiq-navy"><Coins className="h-5 w-5 text-tiq-primary" />{t('billing.addonBalance')}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tiq-navy">{usage?.addonBalance ?? 0}</div>
            <div className="mt-2 text-sm text-tiq-muted">{usage?.currency || 'USD'}</div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-tiq-bg px-3 py-1.5 text-xs text-tiq-muted"><ShieldCheck className="h-3.5 w-3.5 text-tiq-primary" />{t('billing.secure')}</div>
          </CardContent>
        </Card>
        <Card className="border-tiq-border">
          <CardHeader><CardTitle className="flex items-center gap-2 text-tiq-navy"><BarChart3 className="h-5 w-5 text-tiq-primary" />{t('billing.packs')}</CardTitle></CardHeader>
          <CardContent className="grid gap-3">{packs.map((pack) => <Button key={pack.code} variant="outline" className="justify-between" onClick={() => buyPack(pack.code)} disabled={loadingPack === pack.code}><span>{t('billing.packCredits').replace('{{credits}}', String(pack.credits))}</span><span>{loadingPack === pack.code ? '…' : t('billing.buyPack')}</span></Button>)}</CardContent>
        </Card>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card className="border-tiq-border">
          <CardHeader><CardTitle className="text-tiq-navy">{t('billing.usageTitle')}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm text-tiq-muted">
            <div className="rounded-xl bg-tiq-bg px-4 py-3">{t('billing.capture')}: {usage?.capture.monthlyRemaining ?? 0} / {usage?.capture.monthlyCap ?? '—'}</div>
            <div className="rounded-xl bg-tiq-bg px-4 py-3">{t('billing.enrich')}: {usage?.enrich.monthlyRemaining ?? 0} / {usage?.enrich.monthlyCap ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="border-tiq-border">
          <CardHeader><CardTitle className="text-tiq-navy">{t('billing.resetWindows')}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm text-tiq-muted">
            <div className="rounded-xl bg-tiq-bg px-4 py-3">{t('billing.capture')}: {usage?.capture.resetAt ? new Date(usage.capture.resetAt).toLocaleDateString() : '—'}</div>
            <div className="rounded-xl bg-tiq-bg px-4 py-3">{t('billing.enrich')}: {usage?.enrich.resetAt ? new Date(usage.enrich.resetAt).toLocaleDateString() : '—'}</div>
          </CardContent>
        </Card>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-tiq-navy"><Zap className="h-5 w-5 text-tiq-primary" />{t('billing.capture')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><div className="mb-1 text-sm text-tiq-muted">{t('billing.monthlyRemaining')}</div><Meter used={usage?.capture.monthlyUsed ?? 0} total={usage?.capture.monthlyCap ?? null} /></div>
            <div><div className="mb-1 text-sm text-tiq-muted">{t('billing.dailyRemaining')}</div><Meter used={usage?.capture.dailyUsed ?? 0} total={usage?.capture.dailyCap ?? 0} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-tiq-navy"><Zap className="h-5 w-5 text-tiq-primary" />{t('billing.enrich')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><div className="mb-1 text-sm text-tiq-muted">{t('billing.monthlyRemaining')}</div><Meter used={usage?.enrich.monthlyUsed ?? 0} total={usage?.enrich.monthlyCap ?? null} /></div>
            <div><div className="mb-1 text-sm text-tiq-muted">{t('billing.dailyRemaining')}</div><Meter used={usage?.enrich.dailyUsed ?? 0} total={usage?.enrich.dailyCap ?? 0} /></div>
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
}
