'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TiqCard } from '@/components/tiq/TiqCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TiqBadge } from '@/components/tiq/TiqBadge';
import { RowMenu } from '@/components/tiq/RowMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { getOutreachProspects, pauseOutreachProspect, resumeOutreachProspect, archiveOutreachProspect } from '@/services/outreachProspectServices';
import { sanitizeError } from '@/lib/safeLogging';
import { toast } from 'sonner';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';
import { MetricStrip } from '@/components/tiq/MetricStrip';

export default function OutreachProspectsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [channel, setChannel] = useState('all');
  const [contactReadiness, setContactReadiness] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const res = await getOutreachProspects({ page, limit, search, status, channel, contactReadiness });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(Number(res?.totalPages || 1));
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to load outreach prospects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user, router]);

  useEffect(() => { if (user) load(); }, [user, page, search, status, channel, contactReadiness]);

  const stats = useMemo(() => ({
    total: items.length,
    ready: items.filter((i) => i.contactReadiness === 'ready').length,
    partial: items.filter((i) => i.contactReadiness === 'partial').length,
    paused: items.filter((i) => i.status === 'paused').length,
  }), [items]);

  const act = async (id: string, type: 'pause'|'resume'|'archive') => {
    try {
      if (type === 'pause') await pauseOutreachProspect(id);
      if (type === 'resume') await resumeOutreachProspect(id);
      if (type === 'archive') await archiveOutreachProspect(id);
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || `Failed to ${type} prospect`);
    }
  };

  return <DashboardLayout>
    <PageShell className="space-y-6">
      <PageHeader
        title={t('outreach.prospectsTitle')}
        subtitle={t('outreach.prospectsSubtitle')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/${params?.businessId}/campaigns`)}>{t('outreach.campaigns')}</Button>
            <Button variant="outline" onClick={() => router.push(`/dashboard/${params?.businessId}/leads`)}>{t('outreach.backToLeads')}</Button>
          </div>
        }
      />
      <MetricStrip
        cols={4}
        metrics={[
          { label: t('outreach.prospectsMetricTotal'), value: stats.total },
          { label: t('outreach.prospectsMetricReady'), value: stats.ready, tone: stats.ready > 0 ? 'success' : 'default' },
          { label: t('outreach.prospectsMetricPartial'), value: stats.partial, tone: stats.partial > 0 ? 'warning' : 'default' },
          { label: t('outreach.prospectsMetricPaused'), value: stats.paused, tone: stats.paused > 0 ? 'warning' : 'default' },
        ]}
      />
      <TiqCard title={t('outreach.prospectsTitle')}>
        <div className="grid gap-3 md:grid-cols-4 mb-4">
          <Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search name, company, email, phone" />
          <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">{t('common.allStatuses')}</SelectItem><SelectItem value="active">{t('common.active')}</SelectItem><SelectItem value="paused">{t('common.paused')}</SelectItem><SelectItem value="archived">{t('common.archived')}</SelectItem></SelectContent></Select>
          <Select value={channel} onValueChange={(v) => { setPage(1); setChannel(v); }}><SelectTrigger><SelectValue placeholder="Channel" /></SelectTrigger><SelectContent><SelectItem value="all">{t('common.allChannels')}</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem></SelectContent></Select>
          <Select value={contactReadiness} onValueChange={(v) => { setPage(1); setContactReadiness(v); }}><SelectTrigger><SelectValue placeholder="Readiness" /></SelectTrigger><SelectContent><SelectItem value="all">{t('common.allReadiness')}</SelectItem><SelectItem value="ready">{t('outreach.prospectsMetricReady')}</SelectItem><SelectItem value="partial">{t('outreach.prospectsMetricPartial')}</SelectItem><SelectItem value="not_ready">{t('common.paused')}</SelectItem></SelectContent></Select>
        </div>
        {loading ? <div className="text-sm text-tiq-muted">{t('loading')}</div> : items.length === 0 ? <div className="text-sm text-tiq-muted">{t('outreach.noProspects')}</div> : <div className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-tiqLg border border-tiq-border bg-tiq-surface p-4 flex items-start justify-between gap-4"><div className="space-y-2"><div className="flex items-center gap-2 flex-wrap"><div className="font-semibold text-tiq-navy">{item.fullName || t('outreach.unnamedProspect')}</div><TiqBadge variant="neutral">{item.primaryChannel || 'unknown'}</TiqBadge><TiqBadge variant="neutral">{item.qualificationStatus || 'raw'}</TiqBadge><TiqBadge variant={item.status === 'active' ? 'primary' : 'neutral'}>{item.status}</TiqBadge><TiqBadge variant="neutral">{item.contactReadiness}</TiqBadge></div><div className="text-sm text-tiq-muted">{item.company || '\u2014'} {item.jobTitle ? `\u2022 ${item.jobTitle}` : ''}</div><div className="text-sm text-tiq-muted">{item.email || item.phone || item.linkedinUrl || t('outreach.noChannelDetails')}</div><div className="text-xs text-tiq-muted">{t('outreach.trustScore')}: {item.trustScore ?? 0}</div></div><RowMenu actions={[item.status !== 'paused' ? { label: t('pause'), onClick: () => act(item.id, 'pause') } : { label: t('resume'), onClick: () => act(item.id, 'resume') }, { label: t('archive'), onClick: () => act(item.id, 'archive'), destructive: true }]} /></div>)}</div>}
        <div className="mt-4 flex items-center justify-between"><div className="text-sm text-tiq-muted">{t('pagination.page')} {page} / {Math.max(totalPages, 1)}</div><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('pagination.prev')}</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('pagination.next')}</Button></div></div>
      </TiqCard>
    </PageShell>
  </DashboardLayout>;
}
