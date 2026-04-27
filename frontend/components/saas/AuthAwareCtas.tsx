'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function dashboardHref(activeBusinessId?: string | null) {
  return activeBusinessId ? `/dashboard/${activeBusinessId}` : '/onboarding';
}

export function AuthAwareHeaderActions({ labels }: { labels: { login: string; start: string; dashboard?: string } }) {
  const { user, activeBusinessId, loading } = useAuth();
  const isAuthed = Boolean(user);

  if (loading) {
    return <div className="hidden h-10 w-40 rounded-xl bg-tiq-bg sm:block" />;
  }

  if (isAuthed) {
    return (
      <Link
        href={dashboardHref(activeBusinessId)}
        className="inline-flex items-center gap-2 rounded-xl bg-tiq-primary px-4 py-2 text-sm font-bold text-white shadow-tiq hover:opacity-90"
      >
        <LayoutDashboard className="h-4 w-4" />
        {labels.dashboard ?? 'Dashboard'}
      </Link>
    );
  }

  return (
    <>
      <Link href="/auth/login?next=/pricing" className="hidden rounded-xl px-4 py-2 text-sm font-bold text-tiq-navy hover:bg-tiq-bg sm:inline-flex">
        {labels.login}
      </Link>
      <Link href="/auth/signup?next=/onboarding" className="rounded-xl bg-tiq-primary px-4 py-2 text-sm font-bold text-white shadow-tiq hover:opacity-90">
        {labels.start}
      </Link>
    </>
  );
}

export function AuthAwarePrimaryCta({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { user, activeBusinessId } = useAuth();
  const href = user ? dashboardHref(activeBusinessId) : '/auth/signup?next=/onboarding';
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function PricingPlanCta({ children, planCode, className = '' }: { children: React.ReactNode; planCode: string; className?: string }) {
  const { user } = useAuth();
  const href = user
    ? `/pricing?plan=${encodeURIComponent(planCode)}`
    : `/auth/signup?plan=${encodeURIComponent(planCode)}&next=${encodeURIComponent(`/onboarding?plan=${planCode}`)}`;
  return (
    <Link href={href} className={className}>
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
