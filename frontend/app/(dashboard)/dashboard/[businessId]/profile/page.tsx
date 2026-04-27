'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TiqCard } from '@/components/tiq/TiqCard';
import { TiqTable, TiqTableBody, TiqTableCell, TiqTableHead, TiqTableHeaderCell, TiqTableRow } from '@/components/tiq/TiqTable';
import { getUserProfile, updateUserProfile, type UserProfileDto } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user, me, activeBusinessId, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', country: '', language: 'en' });

  const memberships = useMemo(() => {
    const raw = (me as any)?.memberships ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.map((m: any) => ({ businessId: m?.businessId ?? m?.tenantId ?? null, businessName: m?.businessName ?? null, role: m?.role ?? null }));
  }, [me]);

  useEffect(() => { if (!authLoading && !user) router.push('/auth/login'); }, [authLoading, router, user]);
  useEffect(() => { if (!user) return; (async () => { const data = await getUserProfile(); setProfile(data); setForm({ fullName: data.fullName || '', email: data.email || '', country: data.country || '', language: data.language || 'en' }); })(); }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateUserProfile(form);
      setProfile(updated);
      toast.success(t('save'));
    } catch (e: any) {
      toast.error(e?.message || t('error'));
    } finally { setSaving(false); }
  };

  if (authLoading) return <DashboardLayout><div className="text-sm text-tiq-muted">{t('loading')}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageShell className="space-y-4">
        <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
          <div className="grid gap-3 md:grid-cols-2">
            <TiqCard title={t('profile.account')}>
              <div className="space-y-3 text-sm">
                <div className="space-y-1"><Label>{t('fullName')}</Label><Input value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{t('email')}</Label><Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{t('country')}</Label><Input value={form.country} onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))} /></div>
                <div className="space-y-1"><Label>{t('language')}</Label><Input value={form.language} onChange={(e) => setForm((s) => ({ ...s, language: e.target.value }))} /></div>
                <div className="flex justify-end"><Button onClick={handleSave} disabled={saving}>{saving ? t('loading') : t('save')}</Button></div>
              </div>
            </TiqCard>

            <TiqCard title={t('profile.memberships')}>
              <div className="mb-3 space-y-1 text-sm">
                <div><span className="text-tiq-muted">{t('profile.role')}: </span><span className="font-medium">{String(profile?.role ?? (me as any)?.user?.role ?? '')}</span></div>
                <div><span className="text-tiq-muted">{t('profile.activeBusiness')}: </span><span className="font-mono text-xs">{activeBusinessId ?? ''}</span></div>
              </div>
              <TiqTable>
                <TiqTableHead><tr><TiqTableHeaderCell>{t('admin.name')}</TiqTableHeaderCell><TiqTableHeaderCell>{t('admin.id')}</TiqTableHeaderCell><TiqTableHeaderCell>{t('admin.role')}</TiqTableHeaderCell></tr></TiqTableHead>
                <TiqTableBody>
                  {memberships.map((m, idx) => <TiqTableRow key={m.businessId ?? String(idx)}><TiqTableCell>{m.businessName ?? ''}</TiqTableCell><TiqTableCell className="font-mono text-xs">{m.businessId ?? ''}</TiqTableCell><TiqTableCell>{String(m.role ?? '')}</TiqTableCell></TiqTableRow>)}
                  {memberships.length === 0 ? <TiqTableRow><TiqTableCell colSpan={3} className="text-sm text-tiq-muted">{t('admin.empty')}</TiqTableCell></TiqTableRow> : null}
                </TiqTableBody>
              </TiqTable>
            </TiqCard>
          </div>
      </PageShell>
    </DashboardLayout>
  );
}
