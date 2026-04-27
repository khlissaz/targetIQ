'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { TiqShell } from '@/components/tiq/TiqShell';
import { TiqTable, TiqTableBody, TiqTableCell, TiqTableHead, TiqTableHeaderCell, TiqTableRow } from '@/components/tiq/TiqTable';
import { getAdminAudit, type AdminAuditLogDto } from '@/lib/api';

function fmtDate(value: string | Date | null) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function AdminAuditPage() {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const [rows, setRows] = useState<AdminAuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAdminAudit();
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
    <TiqShell title={t('admin.audit')} subtitle={t('admin.audit.subtitle')}>
      {loading ? (
        <div className="text-sm text-tiq-muted">{t('loading')}</div>
      ) : (
        <TiqTable>
          <TiqTableHead>
            <tr>
              <TiqTableHeaderCell>{t('admin.when')}</TiqTableHeaderCell>
              <TiqTableHeaderCell>{t('admin.action')}</TiqTableHeaderCell>
              <TiqTableHeaderCell>{t('admin.target')}</TiqTableHeaderCell>
              <TiqTableHeaderCell>{t('admin.admin_id')}</TiqTableHeaderCell>
            </tr>
          </TiqTableHead>
          <TiqTableBody>
            {rows.map((r) => (
              <TiqTableRow key={r.id}>
                <TiqTableCell>{fmtDate(r.createdAt ?? null)}</TiqTableCell>
                <TiqTableCell>{r.action}</TiqTableCell>
                <TiqTableCell>
                  <div className="text-sm">{r.targetType}</div>
                  <div className="font-mono text-xs text-tiq-muted">{r.targetId ?? ''}</div>
                </TiqTableCell>
                <TiqTableCell className="font-mono text-xs">{r.adminId}</TiqTableCell>
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
