'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';
import { apiFetch, startBulkLeadEnrichment } from '@/lib/api';
import { safeLog, sanitizeError } from '@/lib/safeLogging';
import { LeadI, ScrapingI } from '@/lib/types';
import { useAppStore } from '@/lib/appStore';
import { getCollectedLeadsById } from '@/services/collectionService';
import {
  bulkEvaluateLeadsForOutreach,
  bulkConvertLeadsToOutreach,
  convertLeadToOutreach,
  getLeadEligibility,
  markLeadTrusted,
  verifyLead,
} from '@/services/leadServices';
import {
  LeadFormValues,
  emptyLeadForm,
  fromLeadToForm,
  toCreateLeadPayload,
  toUpdateLeadPayload,
} from '@/lib/mappers/lead.mapper';
import { normalizeLead } from '@/lib/mappers/lead-normalizer';
import { exportLeadsXlsx, exportLeadsCsv, DEFAULT_EXPORT_FIELDS } from '@/lib/export/leadsExporter';

export interface UseLeadsPageResult {
    hasLoadedOnce: boolean;
  // route
  routeBusinessId: string | null;
  // collection selection
  selectedFile: string | null;
  setSelectedFile: (id: string | null) => void;
  selectedCollection: ScrapingI | null;
  setSelectedCollection: (c: ScrapingI | null) => void;
  // loading
  loading: boolean;
  // leads data
  filteredLeads: LeadI[];
  paginatedLeads: LeadI[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  serverTotal: number;
  serverTotalPages: number;
  // filters
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  // selection
  selectedIds: string[];
  selectedLeads: Record<string, boolean>;
  selectAllRef: React.RefObject<HTMLInputElement>;
  clearSelection: () => void;
  toggleSelectLead: (id: string) => void;
  toggleSelectAllPage: () => void;
  // form dialog
  dialogMode: 'add' | 'edit';
  dialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  formValues: LeadFormValues;
  setFormValues: React.Dispatch<React.SetStateAction<LeadFormValues>>;
  formLoading: boolean;
  openAddDialog: () => void;
  openEditDialog: (lead: LeadI) => void;
  handleFormSubmit: () => Promise<void>;
  // bulk outreach dialog
  bulkDialogOpen: boolean;
  setBulkDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  outreachPreview: any;
  outreachLoading: boolean;
  // handlers
  loadAllLeads: (opts?: { page?: number; limit?: number; search?: string; status?: string }) => Promise<void>;
  handleSearchChange: (value: string) => void;
  handleStatusFilterChange: (value: string) => void;
  handlePageChange: (newPage: number) => void;
  handleLimitChange: (newLimit: number) => void;
  handleDeleteLead: (leadId: string) => Promise<void>;
  handleVerifyLead: (leadId: string) => Promise<void>;
  handleTrustLead: (leadId: string) => Promise<void>;
  handleConvertLead: (leadId: string) => Promise<void>;
  enrichingFields: Array<'email' | 'phone'> | null;
  handleMassEnrichment: (fields: Array<'email' | 'phone'>) => Promise<void>;
  handleExportXlsx: () => void;
  handleExportCsv: () => void;
  openBulkOutreachPreview: () => Promise<void>;
  handleBulkConvert: () => Promise<void>;
}

export function useLeadsPage(collections: ScrapingI[]): UseLeadsPageResult {
  const router = useRouter();
  const params = useParams();
  const { language } = useLanguage();
  const { t } = useTranslation(language);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const routeBusinessId =
    typeof params?.businessId === 'string'
      ? params.businessId
      : Array.isArray(params?.businessId)
        ? params.businessId[0]
        : null;

  const leads = useAppStore((s) => s.leads);
  const setLeads = useAppStore((s) => s.setLeads);
  const fetchEnrichmentCredits = useAppStore((s) => s.fetchEnrichmentCredits);

  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  // ── collection selection ────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<ScrapingI | null>(null);

  // Auto-select the most recent collection (by createdAt or id) if none selected
  useEffect(() => {
    if (selectedFile === null && Array.isArray(collections) && collections.length > 0) {
      // Sort by createdAt desc, fallback to id desc
      const sorted = [...collections].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return String(b.id).localeCompare(String(a.id));
      });
      setSelectedFile(String(sorted[0].id));
    }
  }, [collections, selectedFile]);

  // ── loading / pagination ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [serverTotal, setServerTotal] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── selection ───────────────────────────────────────────────────────────────
  const [selectedLeadsMap, setSelectedLeadsMap] = useState<Record<string, boolean>>({});
  const selectAllRef = useRef<HTMLInputElement>(null);

  // ── form dialog ─────────────────────────────────────────────────────────────
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<LeadFormValues>(emptyLeadForm());
  const [formLoading, setFormLoading] = useState(false);

  // ── bulk outreach dialog ────────────────────────────────────────────────────
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [outreachPreview, setOutreachPreview] = useState<any>(null);
  const [outreachLoading, setOutreachLoading] = useState(false);

  // ── enrichment loading state ─────────────────────────────────────────────────
  const [enrichingFields, setEnrichingFields] = useState<Array<'email' | 'phone'> | null>(null);

  // ── derived ─────────────────────────────────────────────────────────────────
  // Server returns exactly the current page — no client-side slice needed
  const paginatedLeads = leads;
  const totalPages = serverTotalPages;

  const selectedIds = Object.entries(selectedLeadsMap)
    .filter(([, v]) => v)
    .map(([k]) => k);

  // ── load leads ───────────────────────────────────────────────────────────────
  const loadLeads = useCallback(async (
    collectionId: string,
    opts: { page: number; limit: number; search: string; status: string },
  ) => {
    try {
      setLoading(true);
      const result = await getCollectedLeadsById({
        id: collectionId,
        limit:  opts.limit,
        page:   opts.page,
        search: opts.search,
        status: opts.status,
      });
      const items = Array.isArray(result?.items) ? result.items.map(normalizeLead) : [];
      setLeads(items);
      setServerTotal(typeof result?.total === 'number' ? result.total : items.length);
      setServerTotalPages(typeof result?.totalPages === 'number' ? result.totalPages : 1);
      setSelectedLeadsMap({});
    } catch (error: unknown) {
      const se = sanitizeError(error);
      safeLog('error', 'leads.load.failed', { message: se.message, code: se.code });
      toast.error(se.message || tRef.current('error'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLeads]);

  // ── collection switch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedFile && selectedFile !== '__all__') {
      const found = collections.find((c) => String(c.id) === String(selectedFile)) ?? null;
      setSelectedCollection(found);
      setPage(1);
      setSearchQuery('');
      setStatusFilter('all');
      loadLeads(String(selectedFile), { page: 1, limit, search: '', status: 'all' });
    } else if (!selectedFile) {
      setSelectedCollection(null);
      setLeads([]);
      setServerTotal(0);
      setServerTotalPages(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, collections]);

  // ── selectAll indeterminate ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectAllRef.current) return;
    const ids = paginatedLeads.map((l) => l.id);
    const selected = ids.filter((id) => selectedLeadsMap[id]).length;
    selectAllRef.current.indeterminate = selected > 0 && selected < ids.length;
  }, [paginatedLeads, selectedLeadsMap]);

  // ── selection handlers ────────────────────────────────────────────────────────
  const clearSelection = useCallback(() => setSelectedLeadsMap({}), []);

  const toggleSelectLead = useCallback((id: string) => {
    setSelectedLeadsMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleSelectAllPage = useCallback(() => {
    const ids = paginatedLeads.map((l) => l.id);
    const allSelected = ids.every((id) => selectedLeadsMap[id]);
    setSelectedLeadsMap((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = !allSelected));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedLeads, selectedLeadsMap]);

  // ── dialog handlers ──────────────────────────────────────────────────────────
  const openAddDialog = useCallback(() => {
    setDialogMode('add');
    setCurrentLeadId(null);
    setFormValues(emptyLeadForm());
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((lead: LeadI) => {
    setDialogMode('edit');
    setCurrentLeadId(lead.id);
    setFormValues(fromLeadToForm(lead));
    setDialogOpen(true);
  }, []);

  const refreshCurrentLeads = useCallback(async () => {
    if (selectedFile && selectedFile !== '__all__') {
      await loadLeads(String(selectedFile), { page, limit, search: searchQuery, status: statusFilter });
    } else if (selectedFile === '__all__') {
      await loadAllLeads({ page, limit, search: searchQuery, status: statusFilter });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, page, limit, searchQuery, statusFilter]);

  const handleFormSubmit = useCallback(async () => {
    try {
      setFormLoading(true);
      if (dialogMode === 'add') {
        const payload = toCreateLeadPayload(formValues);
        await apiFetch('/leads', {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            collection_id: selectedFile,
          }),
        });
        toast.success(t('leadAdded'));
      } else {
        if (!currentLeadId) return;
        const payload = toUpdateLeadPayload(formValues);
        await apiFetch(`/leads/${currentLeadId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success(t('leadUpdated'));
      }
      setDialogOpen(false);
      setFormValues(emptyLeadForm());
      await refreshCurrentLeads();
    } catch (error: unknown) {
      const se = sanitizeError(error);
      toast.error(se.message || t('error'));
    } finally {
      setFormLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogMode, formValues, currentLeadId, selectedFile, t]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────────
  const handleDeleteLead = useCallback(async (leadId: string) => {
    try {
      await apiFetch(`/leads/${leadId}`, { method: 'DELETE' });
      toast.success(t('leadDeleted'));
      await refreshCurrentLeads();
    } catch (error: unknown) {
      const se = sanitizeError(error);
      toast.error(se.message || t('error'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, refreshCurrentLeads]);

  const handleVerifyLead = useCallback(async (leadId: string) => {
    try {
      await verifyLead(leadId);
      toast.success(tRef.current('lead.verify') || 'Lead marked as verified');
      await refreshCurrentLeads();
    } catch (error: unknown) {
      const se = sanitizeError(error);
      toast.error(se.message || tRef.current('error'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCurrentLeads]);

  const handleTrustLead = useCallback(async (leadId: string) => {
    try {
      await markLeadTrusted(leadId);
      toast.success(tRef.current('lead.trust') || 'Lead marked as trusted');
      await refreshCurrentLeads();
    } catch (error: unknown) {
      const se = sanitizeError(error);
      toast.error(se.message || tRef.current('error'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCurrentLeads]);

  const handleConvertLead = useCallback(async (leadId: string) => {
    try {
      const eligibility = await getLeadEligibility(leadId) as { canConvert?: boolean; reasons?: string[] } | null;
      if (!eligibility?.canConvert) {
        toast.error(tRef.current('error') || `Lead is not eligible: ${(eligibility?.reasons ?? []).join(', ')}`);
        return;
      }
      await convertLeadToOutreach(leadId);
      toast.success(tRef.current('lead.convert') || 'Lead converted to outreach');
      await refreshCurrentLeads();
    } catch (error: unknown) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to convert lead');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCurrentLeads]);

  const loadAllLeads = useCallback(async (
    opts: { page?: number; limit?: number; search?: string; status?: string } = {},
  ) => {
    try {
      setLoading(true);
      const currentPage   = opts.page   ?? page;
      const currentLimit  = opts.limit  ?? limit;
      const currentSearch = opts.search  !== undefined ? opts.search  : searchQuery;
      const currentStatus = opts.status  !== undefined ? opts.status  : statusFilter;

      const params = new URLSearchParams({
        page:  String(currentPage),
        limit: String(currentLimit),
      });
      if (currentSearch.trim()) params.set('search', currentSearch.trim());
      if (currentStatus && currentStatus !== 'all') params.set('status', currentStatus);

      const result = await apiFetch<any>(`/leads?${params.toString()}`);
      const items: LeadI[] = (
        Array.isArray(result?.data)  ? result.data  :
        Array.isArray(result?.items) ? result.items :
        Array.isArray(result)        ? result        : []
      ).map(normalizeLead);

      const total: number = typeof result?.total === 'number' ? result.total : items.length;
      const totalPages: number = typeof result?.totalPages === 'number'
        ? result.totalPages
        : Math.max(1, Math.ceil(total / currentLimit));

      setHasLoadedOnce(true);
      setSelectedCollection(null);
      setSelectedFile('__all__');
      setLeads(items);
      setServerTotal(total);
      setServerTotalPages(totalPages);
      setSelectedLeadsMap({});
    } catch (error: unknown) {
      const se = sanitizeError(error);
      toast.error(se.message || tRef.current('error'));
      setHasLoadedOnce(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLeads]);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      if (selectedFile && selectedFile !== '__all__') {
        loadLeads(String(selectedFile), { page: 1, limit, search: value, status: statusFilter });
      } else if (selectedFile === '__all__') {
        loadAllLeads({ page: 1, search: value, status: statusFilter });
      }
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, limit, statusFilter]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
    if (selectedFile && selectedFile !== '__all__') {
      loadLeads(String(selectedFile), { page: 1, limit, search: searchQuery, status: value });
    } else if (selectedFile === '__all__') {
      loadAllLeads({ page: 1, search: searchQuery, status: value });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, limit, searchQuery]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    if (selectedFile && selectedFile !== '__all__') {
      loadLeads(String(selectedFile), { page: newPage, limit, search: searchQuery, status: statusFilter });
    } else if (selectedFile === '__all__') {
      loadAllLeads({ page: newPage, limit, search: searchQuery, status: statusFilter });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, limit, searchQuery, statusFilter]);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    if (selectedFile && selectedFile !== '__all__') {
      loadLeads(String(selectedFile), { page: 1, limit: newLimit, search: searchQuery, status: statusFilter });
    } else if (selectedFile === '__all__') {
      loadAllLeads({ page: 1, limit: newLimit, search: searchQuery, status: statusFilter });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, searchQuery, statusFilter]);

  const getExportLeads = useCallback(() => {
    return selectedIds.length > 0
      ? leads.filter((l) => selectedIds.includes(l.id))
      : leads;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, selectedIds]);

  const handleExportXlsx = useCallback(() => {
    const leads = getExportLeads();
    exportLeadsXlsx(leads, DEFAULT_EXPORT_FIELDS, selectedCollection?.name);
    toast.success(`Exported ${leads.length} leads to XLSX`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getExportLeads, selectedCollection]);

  const handleExportCsv = useCallback(() => {
    const leads = getExportLeads();
    exportLeadsCsv(leads, DEFAULT_EXPORT_FIELDS, selectedCollection?.name);
    toast.success(`Exported ${leads.length} leads to CSV`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getExportLeads, selectedCollection]);

  const handleMassEnrichment = useCallback(async (fields: Array<'email' | 'phone'>) => {
    const leadIds =
      selectedIds.length > 0 ? selectedIds : leads.map((l) => l.id);
    if (leadIds.length === 0) {
      toast.error(tRef.current('lead.no_leads'));
      return;
    }
    setEnrichingFields(fields);
    try {
      const result = await startBulkLeadEnrichment({ leadIds, fields });
      const started = typeof result?.started === 'number' ? result.started : leadIds.length;
      const failed  = typeof result?.failed  === 'number' ? result.failed  : 0;

      // Build a name lookup from current page leads
      const nameMap: Record<string, string> = {};
      leads.forEach((l) => { nameMap[l.id] = l.profile?.name || l.id; });

      // Register tasks in store — use items from API if available, else fall back to leadIds
      const { addTask, showEnrichmentProgress, updateGlobalTimer } = useAppStore.getState();
      const taskItems: Array<{ leadId: string; name: string }> =
        Array.isArray(result?.items) && result.items.length > 0
          ? result.items.map((item: any) => ({
              leadId: String(item.leadId || item.id || ''),
              name: item.name || nameMap[String(item.leadId || item.id)] || String(item.leadId || item.id),
            }))
          : leadIds.map((id) => ({ leadId: id, name: nameMap[id] || id }));

      taskItems.forEach(({ leadId, name }) => {
        addTask({
          leadId,
          name,
          status: 'pending',
          requestedFields: fields,
          message: `Enriching ${fields.join(' + ')}…`,
          creditsUsed: null,
        });
      });

      showEnrichmentProgress();
      updateGlobalTimer();

      toast.success(
        `${fields.includes('email') && fields.includes('phone') ? 'Email + Phone' : fields[0]} enrichment: ${started} started${failed ? `, ${failed} failed` : ''}`,
      );
      await fetchEnrichmentCredits();
    } catch (error: unknown) {
      const se = sanitizeError(error);
      toast.error(se.message || tRef.current('error'));
    } finally {
      setEnrichingFields(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, leads, fetchEnrichmentCredits]);

  const openBulkOutreachPreview = useCallback(async () => {
    const leadIds = selectedIds.length > 0 ? selectedIds : leads.map((l) => l.id);
    if (leadIds.length === 0) {
      toast.error(tRef.current('lead.no_leads') || 'No leads selected');
      return;
    }
    try {
      setOutreachLoading(true);
      const preview = await bulkEvaluateLeadsForOutreach(leadIds);
      setOutreachPreview(preview);
      setBulkDialogOpen(true);
    } catch (error: unknown) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to evaluate outreach conversion');
    } finally {
      setOutreachLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, leads]);

  const handleBulkConvert = useCallback(async () => {
    const leadIds = selectedIds.length > 0 ? selectedIds : leads.map((l) => l.id);
    try {
      setOutreachLoading(true);
      const result = await bulkConvertLeadsToOutreach(leadIds) as { convertedCount?: number } | null;
      toast.success(`${result?.convertedCount || 0} leads converted to outreach`);
      setBulkDialogOpen(false);
      await refreshCurrentLeads();
      if (routeBusinessId) router.push(`/dashboard/${routeBusinessId}/outreach/prospects`);
    } catch (error: unknown) {
      const se = sanitizeError(error);
      toast.error(se.message || 'Failed to convert selected leads');
    } finally {
      setOutreachLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, leads, routeBusinessId, refreshCurrentLeads]);

  return {
    routeBusinessId,
    selectedFile,
    setSelectedFile,
    selectedCollection,
    setSelectedCollection,
    loading,
      hasLoadedOnce,
    filteredLeads: leads,
    paginatedLeads,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    serverTotal,
    serverTotalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    selectedIds,
    selectedLeads: selectedLeadsMap,
    selectAllRef,
    clearSelection,
    toggleSelectLead,
    toggleSelectAllPage,
    dialogMode,
    dialogOpen,
    setDialogOpen,
    formValues,
    setFormValues,
    formLoading,
    openAddDialog,
    openEditDialog,
    handleFormSubmit,
    bulkDialogOpen,
    setBulkDialogOpen,
    outreachPreview,
    outreachLoading,
    loadAllLeads,
    handleSearchChange,
    handleStatusFilterChange,
    handlePageChange,
    handleLimitChange,
    handleDeleteLead,
    handleVerifyLead,
    handleTrustLead,
    handleConvertLead,
    enrichingFields,
    handleMassEnrichment,
    handleExportXlsx,
    handleExportCsv,
    openBulkOutreachPreview,
    handleBulkConvert,
  };
}
