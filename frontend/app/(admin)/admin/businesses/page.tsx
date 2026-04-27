'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { TiqShell } from '@/components/tiq/TiqShell';
import { TiqTable, TiqTableBody, TiqTableCell, TiqTableHead, TiqTableHeaderCell, TiqTableRow } from '@/components/tiq/TiqTable';
import { getAdminBusinesses, type AdminBusinessDto } from '@/lib/api';

function fmtDate(value: string | Date | null) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

export default function AdminBusinessesPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [rows, setRows] = useState<AdminBusinessDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAdminBusinesses();
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
    <TiqShell title={t('admin.businesses')} subtitle={t('admin.businesses.subtitle')}>
      {loading ? (
        <div className="text-sm text-tiq-muted">{t('loading')}</div>
      ) : (
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
            {rows.map((r) => (
              <TiqTableRow key={r.id}>
                <TiqTableCell className="font-mono text-xs">{r.id}</TiqTableCell>
                <TiqTableCell>{r.name}</TiqTableCell>
                <TiqTableCell>{r.planId ?? ''}</TiqTableCell>
                <TiqTableCell>{fmtDate(r.renewalDate ?? null)}</TiqTableCell>
              </TiqTableRow>
            ))}
            {rows.length === 0 ? (
              <TiqTableRow>
                <TiqTableCell colSpan={4} className="text-sm text-tiq-muted">
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
