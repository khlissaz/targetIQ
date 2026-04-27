'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Archive, PowerOff, Power } from 'lucide-react';
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
import {
  adminBillingListPacks,
  adminBillingUpdatePack,
  adminBillingArchivePack,
  type AdminCreditPackDto,
} from '@/lib/api';
import {
  BillingTableToolbar,
  SortHeader,
  TablePagination,
  useSort,
  usePagination,
} from './BillingTableToolbar';
import { BillingStatusBadge, BillingStripeBadge } from './BillingBadges';
import { BillingCreditPackFormDrawer } from './BillingCreditPackFormDrawer';
import { CURRENCY_OPTIONS, matchesSearch, fmtAmount } from './billingUtils';

// ─── Filters ──────────────────────────────────────────────────────────────────

interface PacksFilter {
  search: string;
  status: string;
  currency: string;
}

function applyFilters(packs: AdminCreditPackDto[], f: PacksFilter): AdminCreditPackDto[] {
  return packs.filter((p) => {
    if (f.search) {
      const haystack = [p.code, p.name, p.internalPriceKey, p.stripePriceId].join(' ');
      if (!matchesSearch(haystack, f.search)) return false;
    }
    if (f.status === 'active' && !p.isActive) return false;
    if (f.status === 'inactive' && p.isActive) return false;
    if (f.currency && p.currency !== f.currency) return false;
    return true;
  });
}

function applySort(packs: AdminCreditPackDto[], key: string, dir: 'asc' | 'desc'): AdminCreditPackDto[] {
  return [...packs].sort((a, b) => {
    let cmp = 0;
    if (key === 'code') cmp = a.code.localeCompare(b.code);
    else if (key === 'displayOrder') cmp = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    else if (key === 'creditsAmount') cmp = a.creditsAmount - b.creditsAmount;
    else if (key === 'amountMinor') cmp = parseFloat(a.amountMinor || '0') - parseFloat(b.amountMinor || '0');
    else if (key === 'updatedAt') cmp = a.updatedAt.localeCompare(b.updatedAt);
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BillingCreditPacksTable() {
  const [packs, setPacks] = useState<AdminCreditPackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PacksFilter>({ search: '', status: '', currency: '' });
  const { sort, toggle } = useSort('displayOrder', 'asc');
  const { page, setPage, size, setSize, reset: resetPage } = usePagination(10);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminCreditPackDto | null>(null);

  // Confirm dialog
  const [confirm, setConfirm] = useState<{ type: 'archive' | 'deactivate' | 'activate'; pack: AdminCreditPackDto } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPacks(await adminBillingListPacks());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load credit packs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => applyFilters(packs, filters), [packs, filters]);
  const sorted = useMemo(() => applySort(filtered, sort.key, sort.dir), [filtered, sort]);
  const paginated = useMemo(() => sorted.slice((page - 1) * size, page * size), [sorted, page, size]);

  function setFilter<K extends keyof PacksFilter>(k: K, v: PacksFilter[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
    resetPage();
  }

  async function handleConfirm() {
    if (!confirm) return;
    setConfirming(true);
    try {
      if (confirm.type === 'archive') {
        await adminBillingArchivePack(confirm.pack.id);
        toast.success(`Pack ${confirm.pack.code} archived.`);
      } else if (confirm.type === 'deactivate') {
        await adminBillingUpdatePack(confirm.pack.id, { isActive: false } as Partial<AdminCreditPackDto>);
        toast.success(`Pack ${confirm.pack.code} deactivated.`);
      } else {
        await adminBillingUpdatePack(confirm.pack.id, { isActive: true } as Partial<AdminCreditPackDto>);
        toast.success(`Pack ${confirm.pack.code} activated.`);
      }
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setConfirming(false);
      setConfirm(null);
    }
  }

  const isFiltered = !!(filters.search || filters.status || filters.currency);

  return (
    <div className="space-y-3">
      <BillingTableToolbar
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        searchPlaceholder="Search by code, name, or internal key…"
        loading={loading}
        onRefresh={load}
        onCreateClick={() => { setEditTarget(null); setDrawerOpen(true); }}
        createLabel="New Pack"
        count={filtered.length}
        countLabel={`credit pack${filtered.length !== 1 ? 's' : ''} ${isFiltered ? '(filtered)' : ''}`}
        filters={[
          {
            key: 'currency',
            label: 'Currency',
            value: filters.currency,
            options: CURRENCY_OPTIONS,
            onChange: (v) => setFilter('currency', v),
          },
          {
            key: 'status',
            label: 'Status',
            value: filters.status,
            options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Archived' }],
            onChange: (v) => setFilter('status', v),
          },
        ]}
      />

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-tiqLg border border-tiq-border bg-tiq-surface">
        {loading && !packs.length ? (
          <div className="p-8 text-center text-sm text-tiq-muted">Loading credit packs…</div>
        ) : (
          <>
            <TiqTable containerClassName="border-0 rounded-none">
              <TiqTableHead>
                <tr>
                  <SortHeader sortKey="code" sort={sort} onSort={toggle}>Code</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Name</th>
                  <SortHeader sortKey="creditsAmount" sort={sort} onSort={toggle}>Credits</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Currency</th>
                  <SortHeader sortKey="amountMinor" sort={sort} onSort={toggle}>Price</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Stripe ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Internal Key</th>
                  <SortHeader sortKey="displayOrder" sort={sort} onSort={toggle}>Order</SortHeader>
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
                    <TiqTableCell>{p.name ?? '—'}</TiqTableCell>
                    <TiqTableCell className="tabular-nums font-medium">{p.creditsAmount.toLocaleString()}</TiqTableCell>
                    <TiqTableCell>{p.currency}</TiqTableCell>
                    <TiqTableCell className="tabular-nums">{fmtAmount(p.amountMinor, p.currency)}</TiqTableCell>
                    <TiqTableCell><BillingStripeBadge id={p.stripePriceId} /></TiqTableCell>
                    <TiqTableCell>
                      <span className="font-mono text-xs text-tiq-muted">{p.internalPriceKey ?? '—'}</span>
                    </TiqTableCell>
                    <TiqTableCell className="tabular-nums">{p.displayOrder}</TiqTableCell>
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
                            label: p.isActive ? 'Deactivate' : 'Activate',
                            icon: p.isActive ? PowerOff : Power,
                            onClick: () => setConfirm({ type: p.isActive ? 'deactivate' : 'activate', pack: p }),
                          },
                          {
                            label: 'Archive',
                            icon: Archive,
                            onClick: () => setConfirm({ type: 'archive', pack: p }),
                            destructive: true,
                            disabled: !p.isActive,
                          },
                        ]}
                      />
                    </TiqTableCell>
                  </TiqTableRow>
                ))}
                {paginated.length === 0 && (
                  <TiqTableRow>
                    <TiqTableCell colSpan={11} className="py-8 text-center text-sm text-tiq-muted">
                      {isFiltered ? 'No credit packs match the current filters.' : 'No credit packs configured yet.'}
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

      <BillingCreditPackFormDrawer
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
            ? `Archive pack ${confirm.pack.code}?`
            : confirm?.type === 'deactivate'
            ? `Deactivate pack ${confirm?.pack.code}?`
            : `Activate pack ${confirm?.pack.code}?`
        }
        description={
          confirm?.type === 'archive'
            ? 'This pack will be removed from the add-ons list.'
            : confirm?.type === 'deactivate'
            ? 'This pack will be hidden from the add-ons list until re-activated.'
            : 'This pack will become available for purchase.'
        }
        confirmLabel={
          confirm?.type === 'archive' ? 'Archive' : confirm?.type === 'deactivate' ? 'Deactivate' : 'Activate'
        }
      />
    </div>
  );
}
