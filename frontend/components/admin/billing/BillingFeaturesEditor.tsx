'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Edit2, Archive } from 'lucide-react';
import { toast } from 'sonner';
import {
  TiqTable,
  TiqTableBody,
  TiqTableCell,
  TiqTableHead,
  TiqTableRow,
} from '@/components/tiq/TiqTable';
import { RowMenu } from '@/components/tiq/RowMenu';
import { ConfirmDialog } from '@/components/tiq/ConfirmDialog';
import { TiqButton } from '@/components/tiq/TiqButton';
import { BillingStatusBadge } from './BillingBadges';
import { BillingFeatureFormDrawer } from './BillingFeatureFormDrawer';
import {
  adminBillingListFeatures,
  adminBillingArchiveFeature,
  type AdminBillingFeatureDto,
} from '@/lib/api';
import type { ElementType } from 'react';

interface Props {
  planCode: string;
}

export function BillingFeaturesEditor({ planCode }: Props) {
  const [features, setFeatures] = useState<AdminBillingFeatureDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminBillingFeatureDto | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminBillingFeatureDto | null>(null);
  const [archiving, setArchiving] = useState(false);

  const load = useCallback(async () => {
    if (!planCode) return;
    setLoading(true);
    try {
      const data = await adminBillingListFeatures(planCode);
      setFeatures(data ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load features');
    } finally {
      setLoading(false);
    }
  }, [planCode]);

  useEffect(() => { load(); }, [load]);

  function openEdit(f: AdminBillingFeatureDto) {
    setEditTarget(f);
    setDrawerOpen(true);
  }

  function openCreate() {
    setEditTarget(null);
    setDrawerOpen(true);
  }

  async function handleArchiveConfirm() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await adminBillingArchiveFeature(archiveTarget.id);
      toast.success(`Feature "${archiveTarget.code}" archived`);
      setArchiveTarget(null);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Archive failed');
    } finally {
      setArchiving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <TiqButton variant="primary" onClick={openCreate}>+ Add Feature</TiqButton>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-4">Loading features…</p>
      ) : features.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No features for this plan yet.</p>
      ) : (
        <TiqTable>
          <TiqTableHead>
            <TiqTableRow>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label (EN)</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2" />
            </TiqTableRow>
          </TiqTableHead>
          <TiqTableBody>
            {features.map((f) => (
              <TiqTableRow key={f.id}>
                <TiqTableCell className="font-mono text-xs">{f.code}</TiqTableCell>
                <TiqTableCell>{f.labelI18n?.en ?? '—'}</TiqTableCell>
                <TiqTableCell>{f.displayOrder}</TiqTableCell>
                <TiqTableCell><BillingStatusBadge active={f.isActive} /></TiqTableCell>
                <TiqTableCell className="text-right">
                  <RowMenu
                    actions={[
                      { label: 'Edit', icon: Edit2 as ElementType, onClick: () => openEdit(f) },
                      ...(f.isActive ? [{ label: 'Archive', icon: Archive as ElementType, onClick: () => setArchiveTarget(f), destructive: true }] : []),
                    ]}
                  />
                </TiqTableCell>
              </TiqTableRow>
            ))}
          </TiqTableBody>
        </TiqTable>
      )}

      <BillingFeatureFormDrawer
        open={drawerOpen}
        planCode={planCode}
        target={editTarget}
        onClose={() => setDrawerOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive Feature"
        description={`Archive feature "${archiveTarget?.code}"? It will no longer appear in plan features.`}
        confirmLabel="Archive"
        onConfirm={handleArchiveConfirm}
        onClose={() => setArchiveTarget(null)}
        loading={archiving}
        destructive
      />
    </div>
  );
}
