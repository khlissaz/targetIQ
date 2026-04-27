'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { TiqShell } from '@/components/tiq/TiqShell';
import { TiqTable, TiqTableBody, TiqTableCell, TiqTableHead, TiqTableHeaderCell, TiqTableRow } from '@/components/tiq/TiqTable';
import { getAdminSubscriptions, type AdminSubscriptionsDto } from '@/lib/api';

function fmtDate(value: string | Date | null) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

export default function AdminSubscriptionsPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [data, setData] = useState<AdminSubscriptionsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getAdminSubscriptions();
        if (alive) setData(res);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <TiqShell title={t('admin.subscriptions')} subtitle={t('admin.subscriptions.subtitle')}>
        {loading ? <div className="text-sm text-tiq-muted">{t('loading')}</div> : null}
      </TiqShell>

      {!loading ? (
        <>
          <TiqShell title={t('admin.subscriptions.tenants')}>
            <TiqTable>
              <TiqTableHead>
                <tr>
                  <TiqTableHeaderCell>{t('admin.id')}</TiqTableHeaderCell>
                  <TiqTableHeaderCell>{t('admin.name')}</TiqTableHeaderCell>
                  <TiqTableHeaderCell>{t('admin.plan')}</TiqTableHeaderCell>
                  <TiqTableHeaderCell>{t('admin.renewal')}</TiqTableHeaderCell>
                </tr>
              </TiqTableHead>
              <TiqTableBody>
                {(data?.tenants ?? []).map((r) => (
                  <TiqTableRow key={r.id}>
                    <TiqTableCell className="font-mono text-xs">{r.id}</TiqTableCell>
                    <TiqTableCell>{r.name}</TiqTableCell>
                    <TiqTableCell>{r.planId ?? ''}</TiqTableCell>
                    <TiqTableCell>{fmtDate(r.renewalDate ?? null)}</TiqTableCell>
                  </TiqTableRow>
                ))}
                {(data?.tenants ?? []).length === 0 ? (
                  <TiqTableRow>
                    <TiqTableCell colSpan={4} className="text-sm text-tiq-muted">
                      {t('admin.empty')}
                    </TiqTableCell>
                  </TiqTableRow>
                ) : null}
              </TiqTableBody>
            </TiqTable>
          </TiqShell>

          <TiqShell title={t('admin.subscriptions.users')}>
            <TiqTable>
              <TiqTableHead>
                <tr>
                  <TiqTableHeaderCell>{t('admin.id')}</TiqTableHeaderCell>
                  <TiqTableHeaderCell>{t('email')}</TiqTableHeaderCell>
                  <TiqTableHeaderCell>{t('admin.plan')}</TiqTableHeaderCell>
                  <TiqTableHeaderCell>{t('admin.renewal')}</TiqTableHeaderCell>
                </tr>
              </TiqTableHead>
              <TiqTableBody>
                {(data?.users ?? []).map((r) => (
                  <TiqTableRow key={r.id}>
                    <TiqTableCell className="font-mono text-xs">{r.id}</TiqTableCell>
                    <TiqTableCell>{r.email}</TiqTableCell>
                    <TiqTableCell>{r.planId ?? ''}</TiqTableCell>
                    <TiqTableCell>{fmtDate(r.renewalDate ?? null)}</TiqTableCell>
                  </TiqTableRow>
                ))}
                {(data?.users ?? []).length === 0 ? (
                  <TiqTableRow>
                    <TiqTableCell colSpan={4} className="text-sm text-tiq-muted">
                      {t('admin.empty')}
                    </TiqTableCell>
                  </TiqTableRow>
                ) : null}
              </TiqTableBody>
            </TiqTable>
          </TiqShell>
        </>
      ) : null}
    </div>
  );
}
