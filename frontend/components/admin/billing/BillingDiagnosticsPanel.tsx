'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Activity,
  Info,
} from 'lucide-react';
import {
  TiqTable,
  TiqTableBody,
  TiqTableCell,
  TiqTableHead,
  TiqTableHeaderCell,
  TiqTableRow,
} from '@/components/tiq/TiqTable';
import { TiqButton } from '@/components/tiq/TiqButton';
import { TiqBadge } from '@/components/tiq/TiqBadge';
import { adminBillingGetDiagnostics, type AdminBillingDiagnosticsDto } from '@/lib/api';

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-lg border p-3 ${
        alert
          ? 'border-amber-300 bg-amber-50'
          : 'border-tiq-border bg-tiq-surface'
      }`}
    >
      <div className="text-xs font-medium text-tiq-muted">{label}</div>
      <div
        className={`text-xl font-bold tabular-nums ${
          alert ? 'text-amber-700' : 'text-tiq-navy'
        }`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-tiq-muted">{sub}</div>}
    </div>
  );
}

// ─── Issue type badge ─────────────────────────────────────────────────────────

function IssueTypeBadge({ type }: { type: string }) {
  if (type.includes('missing') || type.includes('no_price'))
    return <TiqBadge variant="error">{type}</TiqBadge>;
  if (type.includes('placeholder'))
    return <TiqBadge variant="warn">{type}</TiqBadge>;
  return <TiqBadge variant="neutral">{type}</TiqBadge>;
}

// ─── Severity icon ────────────────────────────────────────────────────────────

function SeverityIcon({ type }: { type: string }) {
  if (type.includes('missing') || type.includes('no_price'))
    return <XCircle size={14} className="shrink-0 text-red-500" />;
  return <AlertTriangle size={14} className="shrink-0 text-amber-500" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BillingDiagnosticsPanel() {
  const [data, setData] = useState<AdminBillingDiagnosticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await adminBillingGetDiagnostics());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load diagnostics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-tiq-primary" />
          <p className="text-sm font-medium text-tiq-navy">Billing Health Check</p>
          <span className="text-xs text-tiq-muted">— identifies misconfigured prices and missing Stripe mappings.</span>
        </div>
        <TiqButton variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </TiqButton>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading && !data ? (
        <div className="p-8 text-center text-sm text-tiq-muted">Running diagnostics…</div>
      ) : data ? (
        <>
          {/* ── Summary KPIs ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <KpiCard
              label="Total Plans"
              value={data.summary.totalPlans}
              sub={`${data.summary.activePlans} active`}
            />
            <KpiCard
              label="Total Prices"
              value={data.summary.totalPrices}
              sub={`${data.summary.activePrices} active`}
            />
            <KpiCard
              label="Credit Packs"
              value={data.summary.totalPacks}
              sub={`${data.summary.activePacks} active`}
            />
            <KpiCard
              label="Issues Found"
              value={data.summary.issueCount}
              alert={data.summary.issueCount > 0}
              sub={data.summary.issueCount > 0 ? 'Require attention' : 'All clear'}
            />
            <KpiCard
              label="Archived Plans"
              value={data.inactivePlans.length}
              sub="Not available for checkout"
            />
            <KpiCard
              label="Health"
              value={data.summary.issueCount === 0 ? '✓ OK' : '⚠ Issues'}
              alert={data.summary.issueCount > 0}
            />
          </div>

          {/* ── Issues table ── */}
          {data.issues.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 size={20} className="shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-700">All billing prices are configured correctly.</p>
                <p className="text-xs text-green-600">No missing Stripe IDs, no duplicate internal keys, no checkout mapping problems.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                <p className="text-sm font-semibold text-tiq-navy">
                  {data.issues.length} issue{data.issues.length !== 1 ? 's' : ''} require attention
                </p>
              </div>

              <div className="rounded-tiqLg border border-tiq-border bg-tiq-surface">
                <TiqTable containerClassName="border-0 rounded-none">
                  <TiqTableHead>
                    <tr>
                      <TiqTableHeaderCell>Severity</TiqTableHeaderCell>
                      <TiqTableHeaderCell>Type</TiqTableHeaderCell>
                      <TiqTableHeaderCell>Context</TiqTableHeaderCell>
                      <TiqTableHeaderCell>Issue</TiqTableHeaderCell>
                      <TiqTableHeaderCell>Env Variable</TiqTableHeaderCell>
                      <TiqTableHeaderCell>Current DB Value</TiqTableHeaderCell>
                    </tr>
                  </TiqTableHead>
                  <TiqTableBody>
                    {data.issues.map((issue, i) => (
                      <TiqTableRow key={i}>
                        <TiqTableCell>
                          <SeverityIcon type={issue.type} />
                        </TiqTableCell>
                        <TiqTableCell>
                          <IssueTypeBadge type={issue.type} />
                        </TiqTableCell>
                        <TiqTableCell>
                          <span className="font-mono text-xs font-semibold text-tiq-primary">{issue.context}</span>
                        </TiqTableCell>
                        <TiqTableCell className="text-xs text-tiq-text">{issue.issue}</TiqTableCell>
                        <TiqTableCell>
                          {issue.envKey ? (
                            <code className="rounded bg-tiq-bg px-1.5 py-0.5 text-xs font-mono text-tiq-navy">
                              {issue.envKey}
                            </code>
                          ) : (
                            <span className="text-xs text-tiq-muted">—</span>
                          )}
                        </TiqTableCell>
                        <TiqTableCell>
                          {issue.currentValue ? (
                            <span className="font-mono text-xs text-amber-700">{issue.currentValue}</span>
                          ) : (
                            <span className="text-xs text-red-600">Not set</span>
                          )}
                        </TiqTableCell>
                      </TiqTableRow>
                    ))}
                  </TiqTableBody>
                </TiqTable>
              </div>

              {/* How-to fix guidance */}
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <Info size={14} className="mt-0.5 shrink-0 text-blue-600" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold">How to fix:</p>
                  <ol className="mt-1 list-decimal list-inside space-y-0.5">
                    <li>Go to <strong>Stripe Dashboard → Products</strong> and copy the real <code>price_1...</code> ID.</li>
                    <li>Go to the <strong>Prices</strong> tab above → click the row menu → <em>Edit</em> → paste the ID.</li>
                    <li>Come back here and click <strong>Refresh</strong> to verify all issues are resolved.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ── Archived plans list ── */}
          {data.inactivePlans.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-tiq-muted">
                Archived / Inactive Plans ({data.inactivePlans.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {data.inactivePlans.map((p) => (
                  <TiqBadge key={p.id} variant="neutral" className="font-mono">{p.code}</TiqBadge>
                ))}
              </div>
              <p className="text-xs text-tiq-muted">
                These plans are not available for checkout. Activate them from the Plans tab.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
