'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Archive, CheckCircle, PowerOff, Power } from 'lucide-react';
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
  adminBillingListPrices,
  adminBillingUpdatePrice,
  adminBillingArchivePrice,
  type AdminBillingPriceDto,
} from '@/lib/api';
import {
  BillingTableToolbar,
  SortHeader,
  TablePagination,
  useSort,
  usePagination,
} from './BillingTableToolbar';
import {
  BillingStatusBadge,
  BillingStripeBadge,
  IntervalBadge,
  DefaultBadge,
} from './BillingBadges';
import { BillingPriceFormDrawer } from './BillingPriceFormDrawer';
import { CURRENCY_OPTIONS, INTERVAL_OPTIONS, matchesSearch, fmtAmount } from './billingUtils';

// ─── Filters ──────────────────────────────────────────────────────────────────

interface PricesFilter {
  search: string;
  status: string;
  planCode: string;
  currency: string;
  interval: string;
}

function applyFilters(prices: AdminBillingPriceDto[], f: PricesFilter): AdminBillingPriceDto[] {
  return prices.filter((p) => {
    if (f.search) {
      const haystack = [p.planCode, p.internalPriceKey, p.stripePriceId].join(' ');
      if (!matchesSearch(haystack, f.search)) return false;
    }
    if (f.status === 'active' && !p.isActive) return false;
    if (f.status === 'inactive' && p.isActive) return false;
    if (f.planCode && (p.planCode ?? '').toUpperCase() !== f.planCode.toUpperCase()) return false;
    if (f.currency && p.currency !== f.currency) return false;
    if (f.interval && p.billingInterval !== f.interval) return false;
    return true;
  });
}

function applySort(prices: AdminBillingPriceDto[], key: string, dir: 'asc' | 'desc'): AdminBillingPriceDto[] {
  return [...prices].sort((a, b) => {
    let cmp = 0;
    if (key === 'planCode') cmp = (a.planCode ?? '').localeCompare(b.planCode ?? '');
    else if (key === 'amount') cmp = parseFloat(a.amount || '0') - parseFloat(b.amount || '0');
    else if (key === 'currency') cmp = a.currency.localeCompare(b.currency);
    else if (key === 'billingInterval') cmp = a.billingInterval.localeCompare(b.billingInterval);
    else if (key === 'updatedAt') cmp = a.updatedAt.localeCompare(b.updatedAt);
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Extract unique plan codes from prices ────────────────────────────────────

function uniquePlanCodes(prices: AdminBillingPriceDto[]): string[] {
  const seen = new Set<string>();
  prices.forEach((p) => { if (p.planCode) seen.add(p.planCode); });
  return Array.from(seen).sort();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BillingPricesTable() {
  const [prices, setPrices] = useState<AdminBillingPriceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PricesFilter>({
    search: '', status: '', planCode: '', currency: '', interval: '',
  });
  const { sort, toggle } = useSort('planCode', 'asc');
  const { page, setPage, size, setSize, reset: resetPage } = usePagination(10);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminBillingPriceDto | null>(null);

  // Confirm dialog
  const [confirm, setConfirm] = useState<{ type: 'archive' | 'deactivate' | 'activate'; price: AdminBillingPriceDto } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPrices(await adminBillingListPrices());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load prices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const planCodes = useMemo(() => uniquePlanCodes(prices), [prices]);
  const filtered = useMemo(() => applyFilters(prices, filters), [prices, filters]);
  const sorted = useMemo(() => applySort(filtered, sort.key, sort.dir), [filtered, sort]);
  const paginated = useMemo(() => sorted.slice((page - 1) * size, page * size), [sorted, page, size]);

  function setFilter<K extends keyof PricesFilter>(k: K, v: PricesFilter[K]) {
    setFilters((f) => ({ ...f, [k]: v }));
    resetPage();
  }

  async function handleToggleDefault(price: AdminBillingPriceDto) {
    try {
      await adminBillingUpdatePrice(price.id, { isDefault: !price.isDefault });
      toast.success(`Default ${price.isDefault ? 'unset' : 'set'} for ${price.planCode}/${price.currency}/${price.billingInterval}.`);
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
        await adminBillingArchivePrice(confirm.price.id);
        toast.success(`Price archived.`);
      } else if (confirm.type === 'deactivate') {
        await adminBillingUpdatePrice(confirm.price.id, { isActive: false });
        toast.success(`Price deactivated.`);
      } else {
        await adminBillingUpdatePrice(confirm.price.id, { isActive: true });
        toast.success(`Price activated.`);
      }
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setConfirming(false);
      setConfirm(null);
    }
  }

  const isFiltered = !!(filters.search || filters.status || filters.planCode || filters.currency || filters.interval);

  return (
    <div className="space-y-3">
      <BillingTableToolbar
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        searchPlaceholder="Search by plan code, internal key, Stripe ID…"
        loading={loading}
        onRefresh={load}
        onCreateClick={() => { setEditTarget(null); setDrawerOpen(true); }}
        createLabel="New Price"
        count={filtered.length}
        countLabel={`price row${filtered.length !== 1 ? 's' : ''} ${isFiltered ? '(filtered)' : ''}`}
        filters={[
          {
            key: 'planCode',
            label: 'Plan',
            value: filters.planCode,
            options: planCodes.map((c) => ({ value: c, label: c })),
            onChange: (v) => setFilter('planCode', v),
            minWidth: '150px',
          },
          {
            key: 'currency',
            label: 'Currency',
            value: filters.currency,
            options: CURRENCY_OPTIONS,
            onChange: (v) => setFilter('currency', v),
          },
          {
            key: 'interval',
            label: 'Interval',
            value: filters.interval,
            options: INTERVAL_OPTIONS,
            onChange: (v) => setFilter('interval', v),
            minWidth: '140px',
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
        {loading && !prices.length ? (
          <div className="p-8 text-center text-sm text-tiq-muted">Loading prices…</div>
        ) : (
          <>
            <TiqTable containerClassName="border-0 rounded-none">
              <TiqTableHead>
                <tr>
                  <SortHeader sortKey="planCode" sort={sort} onSort={toggle}>Plan</SortHeader>
                  <SortHeader sortKey="currency" sort={sort} onSort={toggle}>Currency</SortHeader>
                  <SortHeader sortKey="billingInterval" sort={sort} onSort={toggle}>Interval</SortHeader>
                  <SortHeader sortKey="amount" sort={sort} onSort={toggle}>Amount</SortHeader>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Stripe ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Internal Key</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Default</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted">Status</th>
                  <SortHeader sortKey="updatedAt" sort={sort} onSort={toggle}>Updated</SortHeader>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-tiq-muted">Actions</th>
                </tr>
              </TiqTableHead>
              <TiqTableBody>
                {paginated.map((p) => (
                  <TiqTableRow key={p.id}>
                    <TiqTableCell>
                      <span className="font-mono text-xs font-semibold text-tiq-primary">{p.planCode ?? '—'}</span>
                    </TiqTableCell>
                    <TiqTableCell className="font-medium">{p.currency}</TiqTableCell>
                    <TiqTableCell><IntervalBadge interval={p.billingInterval} /></TiqTableCell>
                    <TiqTableCell className="tabular-nums">{fmtAmount(p.amount, p.currency)}</TiqTableCell>
                    <TiqTableCell><BillingStripeBadge id={p.stripePriceId} /></TiqTableCell>
                    <TiqTableCell>
                      <span className="font-mono text-xs text-tiq-muted">{p.internalPriceKey ?? '—'}</span>
                    </TiqTableCell>
                    <TiqTableCell>
                      <button
                        title={p.isDefault ? 'Click to unset default' : 'Click to set as default'}
                        onClick={() => handleToggleDefault(p)}
                        className="transition-opacity hover:opacity-70"
                      >
                        <DefaultBadge isDefault={p.isDefault} />
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
                            label: p.isDefault ? 'Unset Default' : 'Set as Default',
                            icon: CheckCircle,
                            onClick: () => handleToggleDefault(p),
                          },
                          {
                            label: p.isActive ? 'Deactivate' : 'Activate',
                            icon: p.isActive ? PowerOff : Power,
                            onClick: () => setConfirm({ type: p.isActive ? 'deactivate' : 'activate', price: p }),
                          },
                          {
                            label: 'Archive',
                            icon: Archive,
                            onClick: () => setConfirm({ type: 'archive', price: p }),
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
                    <TiqTableCell colSpan={10} className="py-8 text-center text-sm text-tiq-muted">
                      {isFiltered ? 'No prices match the current filters.' : 'No prices configured yet.'}
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

      <BillingPriceFormDrawer
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
            ? 'Archive this price row?'
            : confirm?.type === 'deactivate'
            ? 'Deactivate this price row?'
            : 'Activate this price row?'
        }
        description={
          confirm?.type === 'archive'
            ? 'This price will be removed from checkout. Existing subscriptions are unaffected.'
            : confirm?.type === 'deactivate'
            ? 'This price will be hidden from checkout until re-activated.'
            : 'This price will become available for checkout.'
        }
        confirmLabel={
          confirm?.type === 'archive' ? 'Archive' : confirm?.type === 'deactivate' ? 'Deactivate' : 'Activate'
        }
      />
    </div>
  );
}
