'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const BASE =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize';

// ─── LeadStatusBadge ─────────────────────────────────────────────────────────

const LEAD_STATUS_CLASSES: Record<string, string> = {
  new: 'bg-tiq-info/10 text-tiq-info border-tiq-info/20',
  contacted: 'bg-tiq-warning/10 text-tiq-warning border-tiq-warning/20',
  qualified: 'bg-tiq-primary/10 text-tiq-primary border-tiq-primary/20',
  converted: 'bg-tiq-success/10 text-tiq-success border-tiq-success/20',
  lost: 'bg-tiq-danger/10 text-tiq-danger border-tiq-danger/20',
};

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function LeadStatusBadge({ status, className }: StatusBadgeProps) {
  const key = (status || '').toLowerCase();
  const colors =
    LEAD_STATUS_CLASSES[key] ?? 'bg-tiq-bg text-tiq-muted border-tiq-border';
  return <span className={cn(BASE, colors, className)}>{status || '—'}</span>;
}

// ─── QualificationBadge ───────────────────────────────────────────────────────

const QUALIFICATION_CLASSES: Record<string, string> = {
  trusted: 'bg-tiq-success/10 text-tiq-success border-tiq-success/20',
  verified: 'bg-tiq-info/10 text-tiq-info border-tiq-info/20',
  reviewing: 'bg-tiq-warning/10 text-tiq-warning border-tiq-warning/20',
};

export function QualificationBadge({ status, className }: StatusBadgeProps) {
  const key = (status || '').toLowerCase();
  const colors =
    QUALIFICATION_CLASSES[key] ?? 'bg-tiq-bg text-tiq-muted border-tiq-border';
  return <span className={cn(BASE, colors, className)}>{status || '—'}</span>;
}

// ─── CampaignStatusBadge ──────────────────────────────────────────────────────

const CAMPAIGN_STATUS_CLASSES: Record<string, string> = {
  active: 'bg-tiq-success/10 text-tiq-success border-tiq-success/20',
  paused: 'bg-tiq-warning/10 text-tiq-warning border-tiq-warning/20',
  draft: 'bg-tiq-bg text-tiq-muted border-tiq-border',
  completed: 'bg-tiq-info/10 text-tiq-info border-tiq-info/20',
  archived: 'bg-tiq-bg text-tiq-muted border-tiq-border',
};

export function CampaignStatusBadge({ status, className }: StatusBadgeProps) {
  const key = (status || '').toLowerCase();
  const colors =
    CAMPAIGN_STATUS_CLASSES[key] ?? 'bg-tiq-bg text-tiq-muted border-tiq-border';
  return <span className={cn(BASE, colors, className)}>{status || '—'}</span>;
}

// ─── TrustScorePill ───────────────────────────────────────────────────────────

export interface TrustScorePillProps {
  score: number;
  className?: string;
}

export function TrustScorePill({ score, className }: TrustScorePillProps) {
  const colors =
    score >= 80
      ? 'bg-tiq-success/10 text-tiq-success border-tiq-success/20'
      : score >= 50
        ? 'bg-tiq-warning/10 text-tiq-warning border-tiq-warning/20'
        : 'bg-tiq-danger/10 text-tiq-danger border-tiq-danger/20';

  return (
    <span className={cn(BASE, colors, className)}>
      Trust {score}
    </span>
  );
}

// ─── OutreachStatusBadge ──────────────────────────────────────────────────────

const OUTREACH_STATUS_CLASSES: Record<string, string> = {
  active: 'bg-tiq-success/10 text-tiq-success border-tiq-success/20',
  paused: 'bg-tiq-warning/10 text-tiq-warning border-tiq-warning/20',
  archived: 'bg-tiq-bg text-tiq-muted border-tiq-border',
  pending: 'bg-tiq-info/10 text-tiq-info border-tiq-info/20',
  failed: 'bg-tiq-danger/10 text-tiq-danger border-tiq-danger/20',
};

export function OutreachStatusBadge({ status, className }: StatusBadgeProps) {
  const key = (status || '').toLowerCase();
  const colors =
    OUTREACH_STATUS_CLASSES[key] ?? 'bg-tiq-bg text-tiq-muted border-tiq-border';
  return <span className={cn(BASE, colors, className)}>{status || '—'}</span>;
}
