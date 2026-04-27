'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Sparkles, Send, Layers3, Loader2 } from 'lucide-react';
import { CollectionDataSelector } from '@/components/dashboard/leads/ScrapingDataSelector';
import { LeadFormDialog } from '@/components/dashboard/leads/LeadFormDialog';
import { BulkOutreachDialog } from '@/components/dashboard/leads/BulkOutreachDialog';
import { FilterBar } from '@/components/tiq/FilterBar';
import { ActionToolbar } from '@/components/tiq/ActionToolbar';
import { LoadingState } from '@/components/tiq/LoadingState';
import { TiqEmptyState } from '@/components/tiq/TiqEmptyState';
import { LeadStatusBadge } from '@/components/tiq/StatusBadge';
import { RowMenu } from '@/components/tiq/RowMenu';
import { useCollections } from '@/hooks/useCollections';
import { useLeadsPage } from '@/hooks/useLeadsPage';
import { ensureActiveBusiness } from '@/lib/business';
import { useAppStore } from '@/lib/appStore';
import { PageShell } from '@/components/tiq/PageShell';
import { PageHeader } from '@/components/tiq/PageHeader';


export default function LeadsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation(language);

  const STATUS_OPTIONS = React.useMemo(() => [
    { value: 'all', label: t('common.all') },
    { value: 'new', label: t('new') },
    { value: 'contacted', label: t('contacted') },
    { value: 'qualified', label: t('qualified') },
    { value: 'converted', label: t('converted') },
    { value: 'lost', label: t('lost') },
  ], [t]);

  const { user, loading: authLoading } = useAuth();
  const fetchEnrichmentCredits = useAppStore((s) => s.fetchEnrichmentCredits);
  const fetchCreditsRef = useRef(fetchEnrichmentCredits);
  useEffect(() => { fetchCreditsRef.current = fetchEnrichmentCredits; }, [fetchEnrichmentCredits]);

  const { collections, loading: collectionsLoading } = useCollections();
  const lp = useLeadsPage(collections);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/landing');
    } else if (user) {
      ensureActiveBusiness()
        .then((ensured) => {
          if (ensured && lp.routeBusinessId && ensured !== lp.routeBusinessId) {
            router.replace(`/dashboard/${ensured}/leads`);
          }
        })
        .catch(() => null);
      fetchCreditsRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const buildRowActions = (lead: any) => [
    { label: t('edit'), onClick: () => lp.openEditDialog(lead) },
    { label: t('lead.verify'), onClick: () => lp.handleVerifyLead(lead.id) },
    { label: t('lead.trust'), onClick: () => lp.handleTrustLead(lead.id) },
    { label: t('lead.convert'), onClick: () => lp.handleConvertLead(lead.id) },
    {
      label: t('delete'),
      onClick: () => lp.handleDeleteLead(lead.id),
      destructive: true,
    },
  ];

  return (
    <DashboardLayout>
      <PageShell className="space-y-6">
        <PageHeader
          title={t('leads') || 'Leads'}
          subtitle={t('leads.subtitle') || 'Manage and enrich your captured contacts.'}
        />
        {/* Collection selector */}
        {!collectionsLoading && (
          <CollectionDataSelector
            collections={collections}
            selectedFile={lp.selectedFile}
            setSelectedFile={(id) => lp.setSelectedFile(id ?? null)}
            setSelectedCollection={lp.setSelectedCollection}
          />
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterBar
            search={lp.searchQuery}
            onSearchChange={lp.handleSearchChange}
            statusValue={lp.statusFilter}
            onStatusChange={lp.handleStatusFilterChange}
            statusOptions={STATUS_OPTIONS}
            pageSize={lp.limit}
            onPageSizeChange={lp.handleLimitChange}
            pageSizeOptions={[10, 25, 50, 100]}
          />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => lp.loadAllLeads({ page: 1 })} variant="outline" size="sm">
              <Layers3 className="me-1 h-4 w-4" />
              {lp.selectedFile === '__all__' && lp.serverTotal > 0
                ? t('lead.allLeadsCount').replace('{{count}}', lp.serverTotal.toLocaleString())
                : t('lead.allLeads')}
            </Button>

            {/* Enrich dropdown — collapses 3 buttons into 1 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!lp.enrichingFields || lp.filteredLeads.length === 0}
                >
                  {lp.enrichingFields ? (
                    <><Loader2 className="me-1 h-4 w-4 animate-spin" />{t('lead.enrichingBoth')}</>
                  ) : (
                    <><Sparkles className="me-1 h-4 w-4" />
                      {lp.selectedIds.length > 0
                        ? `${t('lead.enrichSelected')} (${lp.selectedIds.length})`
                        : t('lead.enrich')}
                      <ChevronDown className="ms-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => lp.handleMassEnrichment(['email'])}>
                  <Sparkles className="me-2 h-4 w-4" />
                  {t('lead.enrichEmail')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => lp.handleMassEnrichment(['phone'])}>
                  <Sparkles className="me-2 h-4 w-4" />
                  {t('lead.enrichPhone')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => lp.handleMassEnrichment(['email', 'phone'])}>
                  <Sparkles className="me-2 h-4 w-4" />
                  {t('lead.enrichBoth')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export dropdown — collapses 2 buttons into 1 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lp.filteredLeads.length === 0}
                >
                  <Download className="me-1 h-4 w-4" />
                  {lp.selectedIds.length > 0
                    ? `${t('export')} (${lp.selectedIds.length})`
                    : t('export')}
                  <ChevronDown className="ms-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={lp.handleExportXlsx}>
                  {t('lead.exportXlsx')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={lp.handleExportCsv}>
                  {t('lead.exportCsv')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ActionToolbar
          selectedCount={lp.selectedIds.length}
          onClear={lp.clearSelection}
          actions={[
            { label: t('outreach.bulkConvert'), onClick: lp.openBulkOutreachPreview },
            { label: <><Sparkles className="me-1 h-3 w-3 inline" />{t('lead.enrichSelected')}</>, onClick: () => lp.handleMassEnrichment(['email', 'phone']), destructive: false },
          ]}
        />

        {/* Content */}
        {lp.loading ? (
          <LoadingState rows={6} />
        ) : (!lp.loading && lp.filteredLeads.length === 0 && lp.hasLoadedOnce) ? (
          <TiqEmptyState
            title={t('lead.no_leads')}
            description={t('lead.no_leads_desc') || 'Select a collection above or capture new leads using the extension.'}
            className="py-8"
          />
        ) : (
          <div className="overflow-x-auto rounded-tiqLg border border-tiq-border">
            <table className="w-full text-sm">
              <thead className="bg-tiq-surface text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">
                    <input ref={lp.selectAllRef} type="checkbox" onChange={lp.toggleSelectAllPage}
                      checked={lp.paginatedLeads.length > 0 && lp.paginatedLeads.every((l) => lp.selectedLeads[l.id])} />
                  </th>
                  <th className="px-3 py-3 text-start">{t('lead.name')}</th>
                  {/* <th className="px-3 py-3 text-start">{t('lead.jobTitle')}</th> */}
                  <th className="px-3 py-3 text-start">{t('lead.company')}</th>
                  <th className="px-3 py-3 text-start">{t('lead.location')}</th>
                  <th className="px-3 py-3 text-start">{t('lead.email')}</th>
                  <th className="px-3 py-3 text-start">{t('lead.phone') || 'Phone'}</th>
                  <th className="px-3 py-3 text-start">{t('lead.status')}</th>
                  <th className="px-3 py-3 text-end">{t('lead.actions') || ''}</th>
                </tr>
              </thead>
              <tbody>
                {lp.paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-tiq-border hover:bg-tiq-surface/50">
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={!!lp.selectedLeads[lead.id]} onChange={() => lp.toggleSelectLead(lead.id)} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-tiq-navy">{lead.profile?.name || '\u2014'}</div>
                      {lead.profile?.profileLink ? (
                        <a href={lead.profile.profileLink} target="_blank" rel="noreferrer"
                          className="text-xs text-tiq-primary hover:underline truncate block max-w-[180px]">
                          {t('lead.viewProfile')}
                        </a>
                      ) : null}
                    </td>
                    {/* <td className="px-3 py-3 text-sm text-muted-foreground max-w-[160px]">
                      <div className="truncate" title={lead.profile?.job || ''}>
                        {lead.profile?.job || ''}
                      </div>
                    </td> */}
                    <td className="px-3 py-3 text-sm text-muted-foreground">{lead.profile?.company || '\u2014'}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground max-w-[140px]">
                      <div className="truncate" title={lead.profile?.location || ''}>
                        {lead.profile?.location || '\u2014'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm">{lead.profile?.email || '\u2014'}</td>
                    <td className="px-3 py-3 text-sm">{lead.profile?.phone || '\u2014'}</td>
                    <td className="px-3 py-3"><LeadStatusBadge status={lead.status ?? ''} /></td>
                    <td className="px-3 py-3 text-end"><RowMenu actions={buildRowActions(lead)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {lp.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled={lp.page <= 1} onClick={() => lp.handlePageChange(lp.page - 1)}>{t('pagination.prev')}</Button>
            <span className="text-sm">
              {lp.page} / {lp.totalPages}
              {lp.serverTotal > 0 && (
                <span className="ml-2 text-muted-foreground/60">({lp.serverTotal.toLocaleString()} total)</span>
              )}
            </span>
            <Button variant="outline" size="sm" disabled={lp.page >= lp.totalPages} onClick={() => lp.handlePageChange(lp.page + 1)}>{t('pagination.next')}</Button>
          </div>
        )}

        {/* Dialogs */}
        <LeadFormDialog
          mode={lp.dialogMode}
          open={lp.dialogOpen}
          onOpenChange={lp.setDialogOpen}
          values={lp.formValues}
          onChange={lp.setFormValues}
          onSubmit={lp.handleFormSubmit}
          loading={lp.formLoading}
        />
        <BulkOutreachDialog
          open={lp.bulkDialogOpen}
          onOpenChange={lp.setBulkDialogOpen}
          preview={lp.outreachPreview}
          loading={lp.outreachLoading}
          onConfirm={lp.handleBulkConvert}
        />
      </PageShell>
    </DashboardLayout>
  );
}
