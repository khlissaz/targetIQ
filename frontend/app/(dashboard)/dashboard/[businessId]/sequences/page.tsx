'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TiqCard } from '@/components/tiq/TiqCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiqBadge } from '@/components/tiq/TiqBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import {
  createOutreachSequence,
  deleteOutreachSequence,
  getOutreachSequences,
} from '@/services/outreachSequenceServices';
import type { OutreachSequenceRow } from '@/types/api/messaging';
import { sanitizeError } from '@/lib/safeLogging';
import { toast } from 'sonner';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';

type SequenceForm = {
  name: string;
  channel: 'email' | 'phone' | 'linkedin' | 'whatsapp' | 'multi';
  status: 'draft' | 'active' | 'paused';
};

const initialForm: SequenceForm = {
  name: '',
  channel: 'email',
  status: 'draft',
};

export default function SequencesPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const [items, setItems] = useState<OutreachSequenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<SequenceForm>(initialForm);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOutreachSequences({ page: 1, limit: 100, search });
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to load sequences');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user, load]);

  const handleCreate = async () => {
    try {
      if (!form.name.trim()) {
        toast.error(t('outreach.sequence.nameRequired'));
        return;
      }

      await createOutreachSequence({
        name: form.name.trim(),
        channel: form.channel,
        status: form.status,
        stepsJson: [],
      });

      toast.success(t('outreach.sequence.created'));
      setForm(initialForm);
      setOpen(false);
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to create sequence');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('outreach.sequence.confirmDelete'))) return;
    try {
      await deleteOutreachSequence(id);
      toast.success(t('outreach.sequence.deleted'));
      await load();
    } catch (error) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to delete sequence');
    }
  };

  return (
    <DashboardLayout>
      <PageShell className="space-y-6">
        <PageHeader
          title={t('sequences')}
          subtitle={t('outreach.sequences.subtitle')}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/${params?.businessId}/templates`)}
              >
                {t('templates')}
              </Button>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>{t('outreach.createSequence')}</Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('outreach.createSequence')}</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-3">
                    <Input
                      placeholder="Name"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    />

                    <Select
                      value={form.channel}
                      onValueChange={(v) => setForm((p) => ({ ...p, channel: v as SequenceForm['channel'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="multi">Multi</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm((p) => ({ ...p, status: v as SequenceForm['status'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button onClick={handleCreate}>{t('save')}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        <TiqCard title="Sequences">
          <div className="mb-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sequences"
            />
          </div>

          {loading ? (
            <div className="text-sm text-tiq-muted">{t('loading')}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-tiq-muted">{t('outreach.noSequences')}</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-tiqLg border border-tiq-border bg-tiq-surface p-4 flex items-start justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-tiq-navy">{item.name}</div>
                      <TiqBadge variant="neutral">{item.channel}</TiqBadge>
                      <TiqBadge variant="neutral">{item.status}</TiqBadge>
                    </div>
                    <div className="text-sm text-tiq-muted">
                      {(item.stepsJson?.length ?? 0) === 1
                        ? t('outreach.sequence.step')
                        : t('outreach.sequence.steps').replace('{{count}}', String(item.stepsJson?.length ?? 0))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    {t('delete')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TiqCard>
      </PageShell>
    </DashboardLayout>
  );
}
