'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Archive, PowerOff, Power, Star } from 'lucide-react';
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
import { TiqBadge } from '@/components/tiq/TiqBadge';
import {
  adminBillingListPlans,
  adminBillingUpdatePlan,
  adminBillingArchivePlan,
  type AdminBillingPlanDto,
} from '@/lib/api';
import {
  BillingTableToolbar,
  SortHeader,
  TablePagination,
  useSort,
  usePagination,
} from './BillingTableToolbar';
import { BillingStatusBadge, FeaturedBadge } from './BillingBadges';
import { BillingPlanFormDrawer } from './BillingPlanFormDrawer';
import { BILLING_MODEL_OPTIONS, matchesSearch } from './billingUtils';

// ─── Filters ─────────────────────────────────────────────────────────────────

interface PlansFilter {
  search: string;
  status: string;   // '' | 'active' | 'inactive'
  featured: string; // '' | 'yes' | 'no'
  modelType: string;
}

function applyFilters(plans: AdminBillingPlanDto[], f: PlansFilter): AdminBillingPlanDto[] {
  return plans.filter((p) => {
    if (f.search) {
      const haystack = [p.code, p.nameI18n?.en, p.nameI18n?.ar].join(' ');
      if (!matchesSearch(haystack, f.search)) return false;
    }
    if (f.status === 'active' && !p.isActive) return false;
    if (f.status === 'inactive' && p.isActive) return false;
    if (f.featured === 'yes' && !p.isFeatured) return false;
    if (f.featured === 'no' && p.isFeatured) return false;
    if (f.modelType && p.billingModelType !== f.modelType) return false;
    return true;
  });
}

type SortKey = 'code' | 'displayOrder' | 'creditsMonthly' | 'updatedAt';

function applySort(plans: AdminBillingPlanDto[], key: string, dir: 'asc' | 'desc'): AdminBillingPlanDto[] {
  return [...plans].sort((a, b) => {
    let cmp = 0;
    if (key === 'code') cmp = a.code.localeCompare(b.code);
    else if (key === 'displayOrder') cmp = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    else if (key === 'creditsMonthly') cmp = (a.creditsMonthly ?? 0) - (b.creditsMonthly ?? 0);
    else if (key === 'updatedAt') cmp = a.updatedAt.localeCompare(b.updatedAt);
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BillingPlansTable() {
  const [plans, setPlans] = useState<AdminBillingPlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlansFilter>({ search: '', status: '', featured: '', modelType: '' });
  const { sort, toggle } = useSort('displayOrder', 'asc');
  const { page, setPage, size, setSize, reset: resetPage } = usePagination(10);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminBillingPlanDto | null>(null);

  // Confirm dialog
  const [confirm, setConfirm] = useState<{ type: 'archive' | 'deactivate' | 'activate'; plan: AdminBillingPlanDto } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPlans(await adminBillingListPlans());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Derived: filtered + sorted + paginated
  const filtered = useMemo(() => applyFilters(plans, filters), [plans, filters]);
  const sorted = useMemo(() => applySort(filtered, sort.key, sort.dir), [filtered, sort]);
  const paginated = useMemo(() => sorted.slice((page - 1) * size, page * size), [sorted, page, size]);

  function setFilter<K extends keyof PlansFilter>(k: K, v: PlansFilter[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
    resetPage();
  }

  async function handleToggleFeatured(plan: AdminBillingPlanDto) {
    try {
      await adminBillingUpdatePlan(plan.id, { isFeatured: !plan.isFeatured });
      toast.success(`${plan.code} ${plan.isFeatured ? 'unfeatured' : 'featured'}.`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  }

  async function handleConfirm() {
    if (!confirm) return;
    setConfirming(true);
    try {
      if (confirm.type === 'archive') {
        await adminBillingArchivePlan(confirm.plan.id);
        toast.success(`Plan ${confirm.plan.code} archived.`);
      } else if (confirm.type === 'deactivate') {
        await adminBillingUpdatePlan(confirm.plan.id, { isActive: false });
        toast.success(`Plan ${confirm.plan.code} deactivated.`);
      } else {
        await adminBillingUpdatePlan(confirm.plan.id, { isActive: true });
        toast.success(`Plan ${confirm.plan.code} activated.`);
      }
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setConfirming(false);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-3">
      <BillingTableToolbar
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        searchPlaceholder="Search by code or name…"
        loading={loading}
        onRefresh={load}
        onCreateClick={() => { setEditTarget(null); setDrawerOpen(true); }}
        createLabel="New Plan"
        count={filtered.length}
        countLabel={`plan${filtered.length !== 1 ? 's' : ''} ${filters.search || filters.status || filters.featured || filters.modelType ? '(filtered)' : ''}`}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: filters.status,
            options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Archived' }],
            onChange: (v) => setFilter('status', v),
          },
          {
            key: 'featured',
            label: 'Featured',
            value: filters.featured,
            options: [{ value: 'yes', label: 'Featured' }, { value: 'no', label: 'Not Featured' }],
            onChange: (v) => setFilter('featured', v),
          },
          {
            key: 'modelType',
            label: 'Model',
            value: filters.modelType,
            options: BILLING_MODEL_OPTIONS,
            onChange: (v) => setFilter('modelType', v),
            minWidth: '160px',
          },
        ]}
      />

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-tiqLg border border-tiq-border bg-tiq-surface">
        {loading && !plans.length ? (
          <div className="p-8 text-center text-sm text-tiq-muted">Loading plans…</div>
        ) : (
          <>
            <TiqTable containerClassName="border-0 rounded-none">
              <TiqTableHead>
                <tr>
                  <SortHeader sortKey="code" sort={sort} onSort={toggle}>Code</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Name (EN)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Model</th>
                  <SortHeader sortKey="creditsMonthly" sort={sort} onSort={toggle}>Credits/mo</SortHeader>
                  <SortHeader sortKey="displayOrder" sort={sort} onSort={toggle}>Order</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Featured</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Status</th>
                  <SortHeader sortKey="updatedAt" sort={sort} onSort={toggle}>Updated</SortHeader>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-tiq-muted">Actions</th>
                </tr>
              </TiqTableHead>
              <TiqTableBody>
                {paginated.map((p) => (
                  <TiqTableRow key={p.id}>
                    <TiqTableCell>
                      <span className="font-mono text-xs font-semibold text-tiq-primary">{p.code}</span>
                    </TiqTableCell>
                    <TiqTableCell className="max-w-[160px] truncate">{p.nameI18n?.en ?? '—'}</TiqTableCell>
                    <TiqTableCell>
                      <TiqBadge variant="neutral" className="text-xs">{p.billingModelType}</TiqBadge>
                    </TiqTableCell>
                    <TiqTableCell className="tabular-nums">{p.creditsMonthly.toLocaleString()}</TiqTableCell>
                    <TiqTableCell className="tabular-nums">{p.displayOrder}</TiqTableCell>
                    <TiqTableCell>
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        title={p.isFeatured ? 'Click to unfeature' : 'Click to feature'}
                        className="transition-opacity hover:opacity-70"
                      >
                        <FeaturedBadge featured={p.isFeatured} />
                      </button>
                    </TiqTableCell>
                    <TiqTableCell><BillingStatusBadge active={p.isActive} /></TiqTableCell>
                    <TiqTableCell className="text-xs text-tiq-muted">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </TiqTableCell>
                    <TiqTableCell className="text-right">
                      <RowMenu
                        actions={[
                          {
                            label: 'Edit',
                            icon: Edit2,
                            onClick: () => { setEditTarget(p); setDrawerOpen(true); },
                          },
                          {
                            label: p.isFeatured ? 'Unfeature' : 'Mark as Featured',
                            icon: Star,
                            onClick: () => handleToggleFeatured(p),
                          },
                          {
                            label: p.isActive ? 'Deactivate' : 'Activate',
                            icon: p.isActive ? PowerOff : Power,
                            onClick: () => setConfirm({ type: p.isActive ? 'deactivate' : 'activate', plan: p }),
                            disabled: p.code === 'FREE',
                          },
                          {
                            label: 'Archive',
                            icon: Archive,
                            onClick: () => setConfirm({ type: 'archive', plan: p }),
                            destructive: true,
                            disabled: !p.isActive || p.code === 'FREE',
                          },
                        ]}
                      />
                    </TiqTableCell>
                  </TiqTableRow>
                ))}
                {paginated.length === 0 && (
                  <TiqTableRow>
                    <TiqTableCell colSpan={9} className="py-8 text-center text-sm text-tiq-muted">
                      {filters.search || filters.status || filters.featured || filters.modelType
                        ? 'No plans match the current filters.'
                        : 'No plans configured yet.'}
                    </TiqTableCell>
                  </TiqTableRow>
                )}
              </TiqTableBody>
            </TiqTable>
            <TablePagination
              page={page}
              pageSize={size}
              total={filtered.length}
              onPage={setPage}
              onPageSize={(s) => { setSize(s); resetPage(); }}
            />
          </>
        )}
      </div>

      <BillingPlanFormDrawer
        open={drawerOpen}
        target={editTarget}
        onClose={() => setDrawerOpen(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        loading={confirming}
        destructive={confirm?.type === 'archive' || confirm?.type === 'deactivate'}
        title={
          confirm?.type === 'archive'
            ? `Archive plan ${confirm.plan.code}?`
            : confirm?.type === 'deactivate'
            ? `Deactivate plan ${confirm?.plan.code}?`
            : `Activate plan ${confirm?.plan.code}?`
        }
        description={
          confirm?.type === 'archive'
            ? 'The plan will no longer be available for checkout or shown on the pricing page.'
            : confirm?.type === 'deactivate'
            ? 'The plan will be hidden from checkout. Existing subscribers are unaffected.'
            : 'The plan will become available for checkout again.'
        }
        confirmLabel={
          confirm?.type === 'archive'
            ? 'Archive'
            : confirm?.type === 'deactivate'
            ? 'Deactivate'
            : 'Activate'
        }
      />
    </div>
  );
}
