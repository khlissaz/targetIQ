'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
type Lead = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  source?: string;
  created_at: string;
};
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    byStatus: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    byMonth: [] as Array<{ month: string; count: number }>,
    conversionRate: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      loadAnalytics();
    }
  }, [user, authLoading]);

  const loadAnalytics = async () => {
    try {
      const leads = await apiFetch<Lead[]>(`/leads?user_id=${user!.id}`);
      if (leads) {
        const byStatus: Record<string, number> = {};
        const bySource: Record<string, number> = {};
        const monthCounts: Record<string, number> = {};
        leads.forEach((lead) => {
          byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
          if (lead.source) bySource[lead.source] = (bySource[lead.source] || 0) + 1;
          const month = new Date(lead.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          });
          monthCounts[month] = (monthCounts[month] || 0) + 1;
        });
        const byMonth = Object.entries(monthCounts)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
          .slice(-6);
        const converted = byStatus['converted'] || 0;
        const total = leads.length;
        const conversionRate = total > 0 ? (converted / total) * 100 : 0;
        setAnalytics({
          byStatus,
          bySource,
          byMonth,
          conversionRate,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B00]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2B3C]">{t('analytics')}</h1>
          <p className="text-gray-600">Insights into your lead generation performance</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#FF6B00]" />
                Leads by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status === 'converted'
                            ? 'bg-green-500'
                            : status === 'qualified'
                            ? 'bg-blue-500'
                            : status === 'contacted'
                            ? 'bg-yellow-500'
                            : status === 'lost'
                            ? 'bg-red-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      <span className="capitalize">{t(status as any)}</span>
                    </div>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#FF6B00]" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-[#FF6B00] mb-2">
                  {analytics.conversionRate.toFixed(1)}%
                </div>
                <p className="text-gray-600">
                  {analytics.byStatus['converted'] || 0} out of{' '}
                  {Object.values(analytics.byStatus).reduce((a, b) => a + b, 0)} leads converted
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#FF6B00]" />
                Leads by Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.bySource).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="capitalize">{source}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#FF6B00] h-2 rounded-full"
                          style={{
                            width: `${
                              (count /
                                Object.values(analytics.bySource).reduce((a, b) => a + b, 0)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#FF6B00]" />
                Leads Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.byMonth.map((item) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span>{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#FF6B00] h-2 rounded-full"
                          style={{
                            width: `${
                              (item.count /
                                Math.max(...analytics.byMonth.map((m) => m.count), 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
