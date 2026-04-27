'use client';

import React from 'react';
import { PlusCircle, RefreshCw, Search } from 'lucide-react';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqSelect } from '@/components/tiq/TiqSelect';
import { cn } from '@/lib/utils';

export interface BillingToolbarFilter {
  key: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  minWidth?: string;
}

export interface BillingTableToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: BillingToolbarFilter[];
  onRefresh: () => void;
  onCreateClick?: () => void;
  createLabel?: string;
  loading?: boolean;
  count?: number;
  countLabel?: string;
  className?: string;
  right?: React.ReactNode;
}

export function BillingTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  onRefresh,
  onCreateClick,
  createLabel = 'New',
  loading = false,
  count,
  countLabel,
  className,
  right,
}: BillingTableToolbarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Main toolbar row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tiq-muted" />
          <input
            type="search"
            className="h-9 w-full rounded-tiq border border-tiq-border bg-tiq-surface pe-3 ps-9 text-sm text-tiq-text placeholder:text-tiq-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tiq-primary/30 focus-visible:ring-offset-2"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Dynamic select filters */}
        {filters.map((f) => (
          <TiqSelect
            key={f.key}
            aria-label={f.label}
            value={f.value}
            containerClassName={f.minWidth ? `min-w-[${f.minWidth}]` : 'min-w-[130px]'}
            onChange={(e) => f.onChange(e.target.value)}
          >
            <option value="">{f.label}: All</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </TiqSelect>
        ))}

        {/* Right slot + actions */}
        <div className="ms-auto flex items-center gap-2">
          {right}
          <TiqButton
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            tooltip="Refresh data"
          >
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          </TiqButton>
          {onCreateClick && (
            <TiqButton variant="primary" size="sm" onClick={onCreateClick}>
              <PlusCircle size={14} />
              {createLabel}
            </TiqButton>
          )}
        </div>
      </div>

      {/* Row count meta */}
      {count !== undefined && countLabel && (
        <p className="text-xs text-tiq-muted">
          {count} {countLabel}
        </p>
      )}
    </div>
  );
}

// ─── Sort helpers (used by all tables) ───────────────────────────────────────

export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: string;
  dir: SortDir;
}

export interface SortHeaderProps {
  sortKey: string;
  sort: SortState;
  onSort: (key: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SortHeader({ sortKey, sort, onSort, children, className }: SortHeaderProps) {
  const active = sort.key === sortKey;
  return (
    <th
      className={cn(
        'cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tiq-muted hover:text-tiq-navy',
        active && 'text-tiq-navy',
        className,
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
      </span>
    </th>
  );
}

export function useSort(defaultKey: string, defaultDir: SortDir = 'asc') {
  const [sort, setSort] = React.useState<SortState>({ key: defaultKey, dir: defaultDir });
  const toggle = React.useCallback((key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
  }, []);
  return { sort, toggle };
}

// ─── Pagination helper ────────────────────────────────────────────────────────

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}

export function TablePagination({ page, pageSize, total, onPage, onPageSize }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.min(total, (page - 1) * pageSize + 1);
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tiq-border px-4 py-3 text-xs text-tiq-muted">
      <span>
        {total === 0 ? 'No results' : `${from}–${to} of ${total}`}
      </span>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          Rows:
          <select
            value={pageSize}
            onChange={(e) => { onPageSize(Number(e.target.value)); onPage(1); }}
            className="h-7 rounded border border-tiq-border bg-tiq-surface px-1.5 text-xs"
          >
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            className="h-7 w-7 rounded border border-tiq-border bg-tiq-surface hover:bg-tiq-bg disabled:opacity-40"
            onClick={() => onPage(1)}
            disabled={page <= 1}
            aria-label="First page"
          >«</button>
          <button
            className="h-7 w-7 rounded border border-tiq-border bg-tiq-surface hover:bg-tiq-bg disabled:opacity-40"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >‹</button>
          <span className="px-2">{page} / {pages}</span>
          <button
            className="h-7 w-7 rounded border border-tiq-border bg-tiq-surface hover:bg-tiq-bg disabled:opacity-40"
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            aria-label="Next page"
          >›</button>
          <button
            className="h-7 w-7 rounded border border-tiq-border bg-tiq-surface hover:bg-tiq-bg disabled:opacity-40"
            onClick={() => onPage(pages)}
            disabled={page >= pages}
            aria-label="Last page"
          >»</button>
        </div>
      </div>
    </div>
  );
}

export function usePagination(pageSize = 10) {
  const [page, setPage] = React.useState(1);
  const [size, setSize] = React.useState(pageSize);
  const reset = React.useCallback(() => setPage(1), []);
  return { page, setPage, size, setSize, reset };
}
