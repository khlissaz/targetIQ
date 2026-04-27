import { LeadI, ScrapingI } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { translate } from '@/lib/i18n';
import { safeLog, sanitizeError, hashIdentifier } from '@/lib/safeLogging';

/**
 * Fetch all collections from the server (backed by scraping API)
 */
export const fetchScrapings = async (): Promise<any> => {
  return apiFetch('/scraping/list');
};

/**
 * Fetch collections (via scraping endpoint) filtered by date
 * @param date Date to filter collections
 */
export const fetchScrapedDataByDate = async (date: Date): Promise<any> => {
  const qs = new URLSearchParams({ date: date.toISOString() });
  return apiFetch(`/scraping?${qs}`);
};

/**
 * Fetch collections with filters (implemented on scraping endpoint)
 */
export const fetchFilteredScrapings = async (startDate?: Date, endDate?: Date, leadsCount?: undefined): Promise<ScrapingI[]> => {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate.toISOString();
  if (endDate) params.endDate = endDate.toISOString();
  if (leadsCount !== undefined) params.leadsCount = String(leadsCount);
  const qs = new URLSearchParams(params);
  return apiFetch(`/scraping${qs.toString() ? '?' + qs.toString() : ''}`);
};

interface LeadFilters {
  name?: string;
  company?: string;
  job?: string;
  reactionType?: string;
}

export const fetchLeads = async (
  selectedFile: string | null,
  currentPage: number,
  perPage: number,
  filters: LeadFilters,
): Promise<any> => {
  const params: Record<string, string> = {
    page: String(currentPage),
    perPage: String(perPage),
  };
  if (selectedFile) params.selectedFile = selectedFile;
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = String(value);
  });
  const qs = new URLSearchParams(params);
  return apiFetch(`/leads?${qs}`);
};

/**
 * Fetch leads with pagination
 */
export const fetchLeadsPerPage = async (
  filters: { name?: string; company?: string },
  page = 1,
  limit = 10,
): Promise<any> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(filters.name ? { name: filters.name } : {}),
    ...(filters.company ? { company: filters.company } : {}),
  });
  return apiFetch(`/leads?${params}`);
};

/**
 * Enrich leads with external data
 */
export const enrichLeads = async (file: string): Promise<any> => {
  return apiFetch('/leads/enrich', { method: 'POST', body: JSON.stringify({ file }) });
};

/**
 * Download CSV of collections or leads (uses scraping CSV endpoint)
 */
export const downloadCSV = async (file: string): Promise<void> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access-token') : null;
  const businessId = typeof window !== 'undefined' ? localStorage.getItem('active-business-id') : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (businessId) headers['X-Business-Id'] = businessId;

  const res = await fetch(`${API_URL}/scraping/download`, { headers });
  if (!res.ok) throw new Error(translate('error.unexpected'));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', file);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const fetchScrapingsByMonth = async (month: number, year: number) => {
  try {
    const qs = new URLSearchParams({ month: String(month), year: String(year) });
    return await apiFetch(`/scraping/by-month?${qs}`);
  } catch (error) {
    const se = sanitizeError(error);
    safeLog('error', 'scrape.fetchByMonth.failed', { message: se.message, code: se.code });
    throw error;
  }
};

// Fetch recent scraping files for the logged-in user
export async function getScrapings(): Promise<ScrapingI[]> {
  const result = await apiFetch<any>(`/scraping/recent`);
  if (Array.isArray(result)) return result;
  if (result?.scraping) {
    return [{ ...result.scraping, leads: result.leads || [] }];
  }
  return [];
}

// Fetch leads with server-side pagination, search, and status filter
export async function getScrapedLeadsById({
  id,
  limit,
  page,
  search,
  status,
}: {
  id: string;
  limit?: number;
  page?: number;
  search?: string;
  status?: string;
}): Promise<{ items: LeadI[]; page: number; total: number; totalPages: number }> {
  const qs = new URLSearchParams();
  if (id) qs.set('scrapingId', id);
  if (limit !== undefined) qs.set('limit', String(limit));
  if (page !== undefined) qs.set('page', String(page));
  if (search && search.trim()) qs.set('search', search.trim());
  if (status && status !== 'all') qs.set('status', status);

  const result: { items: LeadI[]; page: number; total: number; totalPages: number } = await apiFetch(
    `/scraping/list-leads?${qs}`,
  );

  const itemCount = Array.isArray((result as any)?.items)
    ? (result as any).items.length
    : Array.isArray(result)
      ? (result as any).length
      : undefined;
  const total = typeof (result as any)?.total === 'number' ? (result as any).total : undefined;
  safeLog('info', 'scrape.fetchedLeads.result', {
    scrapingIdHash: id ? hashIdentifier(String(id), 'scrapingId') : undefined,
    itemCount,
    total,
  });
  return result;
}

// Backwards-compatible aliases: expose collect/collection names mapped to existing scraping APIs
export const fetchCollections = fetchScrapings;
export const fetchCollectionDataByDate = fetchScrapedDataByDate;
export const fetchFilteredCollections = fetchFilteredScrapings;
export const fetchLeadsForCollection = fetchLeads;
export const fetchLeadsPage = fetchLeadsPerPage;
export const enrichCollectionLeads = enrichLeads;
export const downloadCollectionCSV = downloadCSV;
export const fetchCollectionByMonth = fetchScrapingsByMonth;
export const getCollections = getScrapings;
export const getCollectedLeadsById = getScrapedLeadsById;

export type CollectionI = ScrapingI;
export type CollectedLeadDto = LeadI;
