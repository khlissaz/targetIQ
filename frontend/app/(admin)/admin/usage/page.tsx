'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { TiqShell } from '@/components/tiq/TiqShell';
import { TiqTable, TiqTableBody, TiqTableCell, TiqTableHead, TiqTableHeaderCell, TiqTableRow } from '@/components/tiq/TiqTable';
import { getAdminUsage, type AdminUsageDto } from '@/lib/api';

function fmtDate(value: string | Date | null) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

export default function AdminUsagePage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [rows, setRows] = useState<AdminUsageDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAdminUsage();
        if (alive) setRows(Array.isArray(data) ? data : []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <TiqShell title={t('admin.usage')} subtitle={t('admin.usage.subtitle')}>
      {loading ? (
        <div className="text-sm text-tiq-muted">{t('loading')}</div>
      ) : (
        <TiqTable>
          <TiqTableHead>
            <tr>
              <TiqTableHeaderCell>{t('admin.tenant')}</TiqTableHeaderCell>
              <TiqTableHeaderCell>{t('admin.plan')}</TiqTableHeaderCell>
              <TiqTableHeaderCell>{t('admin.renewal')}</TiqTableHeaderCell>
              <TiqTableHeaderCell>{t('admin.remaining')}</TiqTableHeaderCell>
              <TiqTableHeaderCell>{t('admin.used_capture')}</TiqTableHeaderCell>
              <TiqTableHeaderCell>{t('admin.used_enrich')}</TiqTableHeaderCell>
            </tr>
          </TiqTableHead>
          <TiqTableBody>
            {rows.map((r) => (
              <TiqTableRow key={r.tenantId}>
                <TiqTableCell>
                  <div className="text-sm font-medium">{r.tenantName}</div>
                  <div className="font-mono text-xs text-tiq-muted">{r.tenantId}</div>
                </TiqTableCell>
                <TiqTableCell>{r.planId ?? ''}</TiqTableCell>
                <TiqTableCell>{fmtDate(r.renewalDate ?? null)}</TiqTableCell>
                <TiqTableCell>{r.meters?.monthly?.remaining ?? 0}</TiqTableCell>
                <TiqTableCell>{r.meters?.monthly?.usedCapture ?? 0}</TiqTableCell>
                <TiqTableCell>{r.meters?.monthly?.usedEnrich ?? 0}</TiqTableCell>
              </TiqTableRow>
            ))}
            {rows.length === 0 ? (
              <TiqTableRow>
                <TiqTableCell colSpan={6} className="text-sm text-tiq-muted">
                  {t('admin.empty')}
                </TiqTableCell>
              </TiqTableRow>
            ) : null}
          </TiqTableBody>
        </TiqTable>
      )}
    </TiqShell>
  );
}
