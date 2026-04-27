'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { TiqShell } from '@/components/tiq/TiqShell';
import { TiqCard } from '@/components/tiq/TiqCard';
import { getAdminSummary, type AdminSummaryDto } from '@/lib/api';

export default function AdminHomePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [summary, setSummary] = useState<AdminSummaryDto | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => { try { const data = await getAdminSummary(); if (alive) setSummary(data); } catch {} })();
    return () => { alive = false; };
  }, []);

  const links = [
    { href: '/admin/businesses', label: t('admin.businesses') },
    { href: '/admin/users', label: t('admin.users') },
    { href: '/admin/subscriptions', label: t('admin.subscriptions') },
    { href: '/admin/pricing', label: t('admin.pricing') },
    { href: '/admin/billing', label: 'Billing Admin' },
    { href: '/admin/usage', label: t('admin.usage') },
    { href: '/admin/audit', label: t('admin.audit') },
  ];

  return (
    <div className="space-y-4">
      <TiqShell title={t('admin.title')} subtitle={t('admin.subtitle')}>
        <div className="grid gap-3 md:grid-cols-3 mb-4">
          <TiqCard title="Businesses"><div className="text-2xl font-semibold">{summary?.businesses ?? 0}</div></TiqCard>
          <TiqCard title="Users"><div className="text-2xl font-semibold">{summary?.users ?? 0}</div></TiqCard>
          <TiqCard title="Leads"><div className="text-2xl font-semibold">{summary?.leads ?? 0}</div></TiqCard>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {links.map((l) => <Link key={l.href} href={l.href} className="block"><TiqCard title={l.label}><div className="text-sm text-tiq-muted">{t('admin.open')}</div></TiqCard></Link>)}
        </div>
      </TiqShell>
    </div>
  );
}
