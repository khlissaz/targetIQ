'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TiqCard } from '@/components/tiq/TiqCard';
import { apiFetch } from '@/lib/api';
import { safeLog, sanitizeError } from '@/lib/safeLogging';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';
import { MetricStrip } from '@/components/tiq/MetricStrip';

type AnalyticsApiResponse = {
  byStatus?: Record<string, number>;
  bySource?: Record<string, number>;
  byMonth?: Array<{ month: string; count: number }>;
  conversionRate?: number;
};

type AnalyticsState = {
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byMonth: Array<{ month: string; count: number }>;
  conversionRate: number;
};

const INITIAL_ANALYTICS: AnalyticsState = {
  byStatus: {},
  bySource: {},
  byMonth: [],
  conversionRate: 0,
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsState>(INITIAL_ANALYTICS);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      setLoadError(null);
      const data = await apiFetch<AnalyticsApiResponse>('/leads/analytics');
      setAnalytics({
        byStatus: data?.byStatus ?? {},
        bySource: data?.bySource ?? {},
        byMonth: Array.isArray(data?.byMonth) ? data.byMonth : [],
        conversionRate: Number(data?.conversionRate ?? 0),
      });
    } catch (error) {
      const se = sanitizeError(error);
      safeLog('error', 'analytics.load.failed', {
        message: se.message,
        code: se.code,
      });
      setAnalytics(INITIAL_ANALYTICS);
      setLoadError(se.message || 'Unable to load analytics right now.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadAnalytics();
    }
  }, [user, authLoading, router, loadAnalytics]);

  const totalBySource = useMemo(
    () => Object.values(analytics.bySource ?? {}).reduce((a, b) => a + b, 0),
    [analytics.bySource],
  );

  const maxByMonth = useMemo(
    () => Math.max(...(analytics.byMonth ?? []).map((m) => Number(m.count ?? 0)), 1),
    [analytics.byMonth],
  );

  const totalLeads = useMemo(
    () => Object.values(analytics.byStatus ?? {}).reduce((a, b) => a + b, 0),
    [analytics.byStatus],
  );

  const convertedLeads = useMemo(
    () => Number(analytics.byStatus?.converted ?? 0),
    [analytics.byStatus],
  );

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiq-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageShell className="space-y-6">
        <PageHeader title={t('analytics')} subtitle={t('analytics.subtitle')} />

        {loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Analytics could not be loaded. {t('analytics.loadError')}
          </div>
        )}

        <MetricStrip
          cols={3}
          metrics={[
            { label: t('analytics.totalLeads'), value: totalLeads, icon: PieChart },
            { label: t('analytics.converted'), value: convertedLeads, icon: TrendingUp, tone: convertedLeads > 0 ? 'success' : 'default' },
            { label: t('analytics.conversionRate'), value: `${analytics.conversionRate.toFixed(1)}%`, icon: BarChart3, tone: analytics.conversionRate >= 20 ? 'success' : analytics.conversionRate >= 10 ? 'warning' : 'default' },
          ]}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <TiqCard
            title={
              <span className="inline-flex items-center gap-2">
                <PieChart className="w-5 h-5 text-tiq-primary" />
                {t('analytics.byStatus')}
              </span>
            }
          >
            <div className="space-y-3">
              {Object.entries(analytics.byStatus ?? {}).length > 0 ? (
                Object.entries(analytics.byStatus ?? {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-tiq-primary" />
                      <span className="capitalize">{status}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-tiq-muted">{t('analytics.noStatus')}</p>
              )}
            </div>
          </TiqCard>

          <TiqCard
            title={
              <span className="inline-flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-tiq-primary" />
                {t('analytics.conversionRate')}
              </span>
            }
          >
            <div className="text-center">
              <div className="text-5xl font-bold text-tiq-primary mb-2">
                {analytics.conversionRate.toFixed(1)}%
              </div>
              <p className="text-tiq-muted">
                {t('analytics.convertedOf').replace('{{converted}}', String(convertedLeads)).replace('{{total}}', String(totalLeads))}
              </p>
            </div>
          </TiqCard>

          <TiqCard
            title={
              <span className="inline-flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-tiq-primary" />
                {t('analytics.bySource')}
              </span>
            }
          >
            <div className="space-y-3">
              {Object.entries(analytics.bySource ?? {}).length > 0 ? (
                Object.entries(analytics.bySource ?? {}).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="capitalize">{source}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-tiq-border rounded-full h-2">
                        <div
                          className="bg-tiq-primary h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(totalBySource, 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-tiq-muted">{t('analytics.noSource')}</p>
              )}
            </div>
          </TiqCard>

          <TiqCard
            title={
              <span className="inline-flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-tiq-primary" />
                {t('analytics.overTime')}
              </span>
            }
          >
            <div className="space-y-3">
              {(analytics.byMonth ?? []).length > 0 ? (
                analytics.byMonth.map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span>{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-tiq-border rounded-full h-2">
                        <div
                          className="bg-tiq-primary h-2 rounded-full"
                          style={{
                            width: `${(Number(item.count ?? 0) / maxByMonth) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-tiq-muted">{t('analytics.noTimeline')}</p>
              )}
            </div>
          </TiqCard>
        </div>
      </PageShell>
    </DashboardLayout>
  );
}
