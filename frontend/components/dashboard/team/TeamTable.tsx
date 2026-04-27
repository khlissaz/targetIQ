'use client';

import * as React from 'react';
import { MoreHorizontal, Trash2, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { TiqSkeleton } from '@/components/tiq/TiqSkeleton';
import { type MembershipListItemDto, type MembershipInviteDto } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';

function roleBadgeClass(role: string): string {
  const r = role.toUpperCase();
  if (r.includes('OWNER') || r.includes('ADMIN'))
    return 'bg-tiq-primary/10 text-tiq-primary border-tiq-primary/20';
  if (r.includes('MANAGER'))
    return 'bg-tiq-info/10 text-tiq-info border-tiq-info/20';
  return 'bg-tiq-bg text-tiq-muted border-tiq-border';
}

function statusDot(status: string): string {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-tiq-success';
    case 'pending': return 'bg-tiq-warning';
    default: return 'bg-tiq-muted';
  }
}

function initials(email: string | null): string {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._-]/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export interface TeamTableRow extends MembershipListItemDto {}

export interface TeamInviteRow extends MembershipInviteDto {}

export interface TeamTableProps {
  members: TeamTableRow[];
  invites?: TeamInviteRow[];
  loading?: boolean;
  canManage?: boolean;
  onRemoveMember?: (id: string) => void;
  onRevokeInvite?: (id: string) => void;
  className?: string;
}

export function TeamTable({
  members,
  invites = [],
  loading,
  canManage,
  onRemoveMember,
  onRevokeInvite,
  className,
}: TeamTableProps) {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-tiq-border bg-white px-4 py-3">
            <TiqSkeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <TiqSkeleton className="h-3 w-40" />
              <TiqSkeleton className="h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Active members */}
      {members.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-3 rounded-xl border border-tiq-border bg-white px-4 py-3"
        >
          {/* Avatar */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tiq-primary/15 text-[11px] font-bold text-tiq-primary">
            {initials(m.email)}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-tiq-navy">
              {m.email ?? '—'}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', statusDot(m.status))} />
              <span className="text-xs text-tiq-muted capitalize">{m.status}</span>
            </div>
          </div>
          {/* Role badge */}
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[11px] font-medium',
              roleBadgeClass(m.role),
            )}
          >
            {m.role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          {/* Actions */}
          {canManage && onRemoveMember && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t('team.memberActions')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemoveMember(m.id)}
                  className="text-tiq-danger focus:text-tiq-danger"
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {t('team.remove_member')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}

      {/* Pending invites */}
      {invites.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center gap-3 rounded-xl border border-tiq-warning/30 bg-tiq-warning/5 px-4 py-3"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tiq-warning/15 text-[11px] font-bold text-tiq-warning">
            <Mail className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-tiq-navy">{inv.email}</p>
            <p className="text-xs text-tiq-muted">{t('team.invitePending').replace('{{role}}', inv.role)}</p>
          </div>
          {canManage && onRevokeInvite && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-tiq-muted hover:text-tiq-danger text-xs"
              onClick={() => onRevokeInvite(inv.id)}
            >
              {t('team.revoke_invite')}
            </Button>
          )}
        </div>
      ))}

      {members.length === 0 && invites.length === 0 && (
        <div className="rounded-xl border border-tiq-border bg-white py-10 text-center text-sm text-tiq-muted">
          {t('team.noMembers')}
        </div>
      )}
    </div>
  );
}
