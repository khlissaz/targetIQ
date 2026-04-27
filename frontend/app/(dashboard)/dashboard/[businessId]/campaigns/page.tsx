'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TiqCard } from '@/components/tiq/TiqCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiqBadge } from '@/components/tiq/TiqBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { createCampaign, deleteCampaign, getCampaigns } from '@/services/campaignServices';
import { sanitizeError } from '@/lib/safeLogging';
import { toast } from 'sonner';
import { CampaignFormState } from '@/types/api/campaigns';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';

const initialForm: CampaignFormState = {
  name: '',
  description: '',
  channel: 'email',
  status: 'draft',
};

export default function CampaignsPage() {
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CampaignFormState>(initialForm);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getCampaigns({ page, limit, search, status, channel });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(Number(res?.totalPages || 1));
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!authLoading && !user) router.push('/auth/login'); }, [authLoading, user, router]);
  useEffect(() => { if (user) load(); }, [user, page, search, status, channel]);

  const handleCreate = async () => {
    try {
      if (!form.name.trim()) { toast.error(t('outreach.campaign.nameRequired')); return; }
      await createCampaign(form);
      toast.success(t('outreach.campaign.created'));
      setOpen(false);
      setForm(initialForm);
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to create campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('outreach.campaign.confirmDelete'))) return;
    try {
      await deleteCampaign(id);
      toast.success(t('outreach.campaign.deleted'));
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to delete campaign');
    }
  };

  return <DashboardLayout>
    <PageShell className="space-y-6">
      <PageHeader
        title={t('campaigns')}
        subtitle={t('outreach.campaigns.subtitle')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/${params?.businessId}/outreach/prospects`)}>{t('outreach.prospects')}</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button>{t('outreach.createCampaign')}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('outreach.createCampaign')}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Campaign name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
                <Select value={form.channel} onValueChange={(v: CampaignFormState['channel']) => setForm((prev: CampaignFormState) => ({ ...prev, channel: v }))}><SelectTrigger><SelectValue placeholder="Channel" /></SelectTrigger><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="multi">Multi-channel</SelectItem></SelectContent></Select>
                <Select value={form.status} onValueChange={(v: CampaignFormState['status']) => setForm((prev: CampaignFormState) => ({ ...prev, status: v }))}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem></SelectContent></Select>
                <div className="flex justify-end"><Button onClick={handleCreate}>{t('save')}</Button></div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <TiqCard title="Campaigns">
        <div className="grid gap-3 md:grid-cols-3 mb-4">
          <Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search campaigns" />
          <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">{t('common.allStatuses')}</SelectItem><SelectItem value="draft">{t('common.draft')}</SelectItem><SelectItem value="active">{t('common.active')}</SelectItem><SelectItem value="paused">{t('common.paused')}</SelectItem><SelectItem value="completed">{t('common.completed')}</SelectItem><SelectItem value="archived">{t('common.archived')}</SelectItem></SelectContent></Select>
          <Select value={channel} onValueChange={(v) => { setPage(1); setChannel(v); }}><SelectTrigger><SelectValue placeholder="Channel" /></SelectTrigger><SelectContent><SelectItem value="all">{t('common.allChannels')}</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="linkedin">LinkedIn</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="multi">Multi-channel</SelectItem></SelectContent></Select>
        </div>
        {loading ? <div className="text-sm text-tiq-muted">{t('loading')}</div> : items.length === 0 ? <div className="text-sm text-tiq-muted">{t('outreach.noCampaigns')}</div> : <div className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-tiqLg border border-tiq-border bg-tiq-surface p-4 flex items-start justify-between gap-4"><div className="space-y-2"><div className="flex items-center gap-2 flex-wrap"><div className="font-semibold text-tiq-navy">{item.name}</div><TiqBadge variant="neutral">{item.channel}</TiqBadge><TiqBadge variant={item.status === 'active' ? 'primary' : 'neutral'}>{item.status}</TiqBadge></div><div className="text-sm text-tiq-muted">{item.description || t('outreach.noDescription')}</div><div className="text-xs text-tiq-muted">{t('outreach.enrollments')}: {item.enrollmentsCount ?? 0}</div></div><div className="flex gap-2 flex-wrap"><Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/${params?.businessId}/campaigns/${item.id}`)}>{t('admin.open')}</Button><Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>{t('delete')}</Button></div></div>)}</div>}
        <div className="mt-4 flex items-center justify-between"><div className="text-sm text-tiq-muted">{t('pagination.page')} {page} / {Math.max(totalPages, 1)}</div><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{t('pagination.prev')}</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('pagination.next')}</Button></div></div>
      </TiqCard>
    </PageShell>
  </DashboardLayout>;
}
