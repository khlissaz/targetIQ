'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { TiqCard } from '@/components/tiq/TiqCard';
import { TiqBanner } from '@/components/tiq/TiqBanner';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqProgress } from '@/components/tiq/TiqProgress';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';
import { TeamTable } from '@/components/dashboard/team/TeamTable';
import {
  createMembershipInvite,
  getMembershipInvites,
  getMembershipsForBusiness,
  removeMembership,
  revokeMembershipInvite,
  type MembershipInvitesResponseDto,
  type MembershipListResponseDto,
} from '@/lib/api';
import { toast } from 'sonner';

export default function TeamPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const { user, capabilities, loading: authLoading } = useAuth();

  const canViewMembers = capabilities.includes('VIEW_MEMBERS') || capabilities.includes('MANAGE_MEMBERS');
  const canManageMembers = capabilities.includes('MANAGE_MEMBERS');

  const [members, setMembers] = useState<MembershipListResponseDto | null>(null);
  const [invites, setInvites] = useState<MembershipInvitesResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('BUSINESS_USER');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (!authLoading && user && !canViewMembers) {
      router.push('/dashboard');
    }
  }, [authLoading, user, canViewMembers, router]);

  const load = async () => {
    try {
      setLoading(true);
      setErrorBanner(null);
      const [m, i] = await Promise.all([getMembershipsForBusiness(), getMembershipInvites()]);
      setMembers(m);
      setInvites(i);
    } catch (e: any) {
      let msg = e?.message || t('error');
      const rawData = (e && (e.data || e.response?.data)) as any | undefined;
      const code = typeof rawData?.code === 'string' ? rawData.code : '';
      if (code === 'TEAM_NOT_ALLOWED') {
        msg = t('team.not_allowed');
      } else if (code === 'TEAM_LIMIT_REACHED') {
        const lim = rawData?.limit;
        msg = t('team.limit_reached').replace('{{limit}}', String(lim ?? members?.teamLimit ?? ''));
      } else if (code === 'NOT_MEMBER') {
        msg = t('team.not_member');
        router.push('/dashboard');
      } else if (code === 'BUSINESS_REQUIRED') {
        msg = t('team.business_required');
        router.push('/dashboard');
      }
      setErrorBanner(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && canViewMembers) {
      void load();
    }
  }, [authLoading, user, canViewMembers]);

  const membersCount = useMemo(() => members?.items?.length ?? 0, [members]);

  const planCode = useMemo(() => (members?.planCode ?? 'FREE').toUpperCase(), [members?.planCode]);
  const isFreeOrStarter = planCode === 'FREE' || planCode === 'STARTER';
  const isPro = planCode === 'PRO';
  const isEnterprise = planCode === 'ENTERPRISE';

  const teamUpgradeRequired = !!members && !members.teamEnabled;

  const teamStatusLabel = useMemo(() => {
    if (!members) return '';
    if (!members.teamEnabled) return t('team.disabled');
    if (isEnterprise || members.teamLimit === null) return t('team.unlimited');
    const limit = members.teamLimit ?? (isPro ? 5 : membersCount);
    return t('team.meter')
      .replace('{{used}}', String(membersCount))
      .replace('{{limit}}', String(limit));
  }, [isEnterprise, isPro, members, membersCount, t]);

  const handleInvite = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!canManageMembers) {
      toast.error(t('team.no_manage_permission'));
      return;
    }
    const email = inviteEmail.trim();
    if (!email) {
      toast.error(t('team.email_required'));
      return;
    }
    try {
      setSubmitting(true);
      setErrorBanner(null);
      await createMembershipInvite({ email, role: inviteRole });
      toast.success(t('team.invite_sent'));
      setInviteEmail('');
      await load();
    } catch (e: any) {
      let msg = e?.message || t('error');
      const rawData = (e && (e.data || e.response?.data)) as any | undefined;
      const code = typeof rawData?.code === 'string' ? rawData.code : '';
      if (code === 'TEAM_NOT_ALLOWED') {
        msg = t('team.not_allowed');
      } else if (code === 'TEAM_LIMIT_REACHED') {
        const lim = rawData?.limit;
        msg = t('team.limit_reached').replace('{{limit}}', String(lim ?? members?.teamLimit ?? ''));
      } else if (code === 'NOT_MEMBER') {
        msg = t('team.not_member');
        router.push('/dashboard');
      } else if (code === 'BUSINESS_REQUIRED') {
        msg = t('team.business_required');
        router.push('/dashboard');
      }
      setErrorBanner(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    if (!canManageMembers) return;
    try {
      await revokeMembershipInvite(id);
      await load();
    } catch (e: any) {
      const rawData = (e && (e.data || e.response?.data)) as any | undefined;
      const code = typeof rawData?.code === 'string' ? rawData.code : '';
      let msg = e?.message || t('error');
      if (code === 'NOT_MEMBER') {
        msg = t('team.not_member');
        router.push('/dashboard');
      } else if (code === 'BUSINESS_REQUIRED') {
        msg = t('team.business_required');
        router.push('/dashboard');
      }
      toast.error(msg);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!canManageMembers) return;
    try {
      await removeMembership(id);
      await load();
    } catch (e: any) {
      const rawData = (e && (e.data || e.response?.data)) as any | undefined;
      const code = typeof rawData?.code === 'string' ? rawData.code : '';
      let msg = e?.message || t('team.remove_error');
      if (code === 'NOT_MEMBER') {
        msg = t('team.not_member');
        router.push('/dashboard');
      } else if (code === 'BUSINESS_REQUIRED') {
        msg = t('team.business_required');
        router.push('/dashboard');
      }
      toast.error(msg);
    }
  };

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
        <PageHeader
          title={t('team.title')}
          subtitle={t('team.subtitle')}
        />

        {errorBanner && <TiqBanner variant="warning">{errorBanner}</TiqBanner>}

        {teamUpgradeRequired && (
          <TiqBanner variant="warning" title={t('team.upgrade_title')}>
            <div className="space-y-2 text-sm">
              <p>{t('team.upgrade_body')}</p>
              <TiqButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  const bizId = members?.businessId;
                  if (bizId) router.push(`/dashboard/${bizId}/billing`);
                  else router.push('/dashboard');
                }}
              >
                {t('team.upgrade_cta')}
              </TiqButton>
            </div>
          </TiqBanner>
        )}

        <TiqCard title={t('team.overview_title')}>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-tiq-muted">{t('team.plan_label')}</span>
              <span className="font-medium">{members?.planCode ?? 'FREE'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-tiq-muted">{t('team.status_label')}</span>
              <span className="font-medium">{teamStatusLabel}</span>
            </div>

            {members?.teamEnabled && (
              <div className="pt-1 space-y-1">
                {isEnterprise || members.teamLimit === null ? (
                  <>
                    <TiqProgress value={1} max={1} tone="neutral" label={t('team.unlimited')} />
                    <div className="flex items-center justify-between text-xs text-tiq-muted">
                      <span>{t('team.members_title')}</span>
                      <span>{t('team.unlimited')}</span>
                    </div>
                  </>
                ) : (
                  (() => {
                    const limit = members.teamLimit ?? (isPro ? 5 : membersCount || 1);
                    const used = membersCount;
                    return (
                      <>
                        <TiqProgress value={used} max={limit} tone="primary" label={t('team.status_label')} />
                        <div className="flex items-center justify-between text-xs text-tiq-muted">
                          <span>{t('team.members_title')}</span>
                          <span>
                            {used} / {limit}
                          </span>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        </TiqCard>

        <TeamTable
          members={members?.items ?? []}
          invites={invites?.items ?? []}
          canManage={canManageMembers}
          onRemoveMember={handleRemoveMember}
          onRevokeInvite={handleRevokeInvite}
        />

        {canManageMembers && members?.teamEnabled && (
          <TiqCard title={t('team.invite_title')}>
            <form onSubmit={handleInvite} className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-tiq-muted mb-1">{t('email')}</label>
                <input
                  type="email"
                  className="w-full rounded-tiq border border-tiq-border bg-tiq-surface px-3 py-2 text-sm"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-tiq-muted mb-1">{t('team.role_label')}</label>
                <select
                  className="h-10 rounded-tiq border border-tiq-border bg-tiq-surface px-3 text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="BUSINESS_USER">{t('team.role_business_user')}</option>
                  <option value="BUSINESS_OWNER">{t('team.role_business_owner')}</option>
                </select>
              </div>
              <div>
                <TiqButton type="submit" loading={submitting}>
                  {t('team.send_invite')}
                </TiqButton>
              </div>
            </form>
          </TiqCard>
        )}
      </PageShell>
    </DashboardLayout>
  );
}
