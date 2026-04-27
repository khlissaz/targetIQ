'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { getDashboardSummary, type DashboardSummaryDto } from '@/lib/api';
import { safeLog, sanitizeError } from '@/lib/safeLogging';
import { TiqBadge } from '@/components/tiq/TiqBadge';
import { TiqCard } from '@/components/tiq/TiqCard';
import { TiqSkeleton } from '@/components/tiq/TiqSkeleton';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';
import { MetricStrip } from '@/components/tiq/MetricStrip';
import { TiqEmptyState } from '@/components/tiq/TiqEmptyState';
import { CHROME_STORE_URL } from '@/lib/constants';
import { Users, TrendingUp, CheckCircle, Clock, Chrome, CreditCard, Upload } from 'lucide-react';

function statusToBadgeVariant(status: string) {
  switch (status) {
    case 'converted': return 'success' as const;
    case 'qualified': return 'info' as const;
    case 'contacted': return 'warn' as const;
    case 'error': return 'danger' as const;
    default: return 'neutral' as const;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  const businessId = typeof params?.businessId === 'string' ? params.businessId : Array.isArray(params?.businessId) ? params.businessId[0] : '';
  const base = businessId ? `/dashboard/${businessId}` : '/dashboard';

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
    else if (user) loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    try {
      const summary = await getDashboardSummary();
      setData(summary);
    } catch (error) {
      const se = sanitizeError(error);
      safeLog('error', 'dashboard.load.failed', { message: se.message, code: se.code });
    } finally {
      setLoading(false);
    }
  };

  const conversionRate =
    (data?.total ?? 0) > 0
      ? Math.round(((data?.converted ?? 0) / (data?.total ?? 1)) * 100)
      : 0;

  const metrics = [
    { label: t('totalLeads'), value: data?.total ?? 0, icon: Users },
    { label: t('newLeadsThisMonth'), value: data?.newThisMonth ?? 0, icon: TrendingUp },
    { label: t('conversionRate'), value: `${conversionRate}%`, icon: CheckCircle, tone: conversionRate >= 50 ? 'success' as const : 'default' as const },
    { label: t('activeLeads'), value: data?.active ?? 0, icon: Clock },
  ];

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <PageShell className="space-y-6">
          <div className="space-y-2">
            <TiqSkeleton className="h-8 w-40" />
            <TiqSkeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <TiqCard key={idx}>
                <div className="space-y-3">
                  <TiqSkeleton className="h-4 w-28" />
                  <TiqSkeleton className="h-7 w-16" />
                </div>
              </TiqCard>
            ))}
          </div>
        </PageShell>
      </DashboardLayout>
    );
  }

  const recentLeads = Array.isArray(data?.recentLeads) ? data!.recentLeads : [];
  return (
    <DashboardLayout>
      <PageShell className="space-y-6">
        <PageHeader
          title={t('dashboard')}
          subtitle={`${t('dashboard.welcomeBack')} ${user?.email ?? ''}`}
        />

        <MetricStrip metrics={metrics} cols={4} />

        {/* Quick Actions */}
        <TiqCard title={t('dashboard.quickActions') || 'Quick Actions'}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-xl border border-tiq-border bg-tiq-bg p-4 text-center hover:border-tiq-primary/50 hover:bg-tiq-primary/5 transition-all"
            >
              <Chrome className="h-7 w-7 text-tiq-primary" />
              <span className="text-xs font-medium text-tiq-navy">{t('dashboard.quickAction.openExtension') || 'Open Extension'}</span>
            </a>
            <Link
              href={`${base}/leads`}
              className="flex flex-col items-center gap-2 rounded-xl border border-tiq-border bg-tiq-bg p-4 text-center hover:border-tiq-primary/50 hover:bg-tiq-primary/5 transition-all"
            >
              <Users className="h-7 w-7 text-tiq-primary" />
              <span className="text-xs font-medium text-tiq-navy">{t('dashboard.quickAction.viewLeads') || 'View Leads'}</span>
            </Link>
            <Link
              href={`${base}/billing`}
              className="flex flex-col items-center gap-2 rounded-xl border border-tiq-border bg-tiq-bg p-4 text-center hover:border-tiq-primary/50 hover:bg-tiq-primary/5 transition-all"
            >
              <CreditCard className="h-7 w-7 text-tiq-primary" />
              <span className="text-xs font-medium text-tiq-navy">{t('dashboard.quickAction.billing') || 'Upgrade / Credits'}</span>
            </Link>
            <Link
              href={`${base}/leads?tab=bulk`}
              className="flex flex-col items-center gap-2 rounded-xl border border-tiq-border bg-tiq-bg p-4 text-center hover:border-tiq-primary/50 hover:bg-tiq-primary/5 transition-all"
            >
              <Upload className="h-7 w-7 text-tiq-primary" />
              <span className="text-xs font-medium text-tiq-navy">{t('dashboard.quickAction.bulkImport') || 'Bulk Import'}</span>
            </Link>
          </div>
        </TiqCard>

        <TiqCard title={t('recentLeads') || 'Recent Leads'}>
          {recentLeads.length > 0 ? (
            <div className="space-y-3">
              {recentLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between rounded-xl border border-tiq-border bg-tiq-surface px-4 py-3 hover:bg-tiq-primary/5">
                  <div>
                    <p className="font-medium text-tiq-navy">{lead?.profile?.name || '-'}</p>
                    <p className="text-sm text-tiq-muted">{lead?.profile?.email || lead?.profile?.company || ''}</p>
                  </div>
                  <TiqBadge variant={statusToBadgeVariant(String(lead.status || 'new'))}>
                    {t(String(lead.status || 'new') as any)}
                  </TiqBadge>
                </div>
              ))}
            </div>
          ) : (
            <TiqEmptyState
              title={t('dashboard.emptyLeadsTitle') || 'No leads yet'}
              description={t('dashboard.emptyLeadsBody') || 'Install the Chrome extension and start capturing leads from LinkedIn or WhatsApp.'}
              action={
                <a
                  href={CHROME_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-tiq bg-tiq-primary px-4 py-2 text-sm font-semibold text-white shadow-tiq hover:bg-tiq-primary/90 transition-colors"
                >
                  <Chrome className="h-4 w-4" />
                  {t('extension.install') || 'Install Extension'}
                </a>
              }
            />
          )}
        </TiqCard>
      </PageShell>
    </DashboardLayout>
  );
}
