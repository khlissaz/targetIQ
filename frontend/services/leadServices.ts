import { LeadI } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { translate } from '@/lib/i18n';

export const updateLeadStatus = async (leadId: string, status: string): Promise<void> => {
  try {
    await apiFetch(`/leads/${leadId}`, { method: 'PUT', body: JSON.stringify({ status }) });
  } catch (error) {
    throw new Error('Failed to update lead status.');
  }
  // Side-effect toast intentionally removed — callers handle display
  void translate('lead.statusUpdated');
};

export const fetchLeadById = async (id: string): Promise<LeadI> => {
  const data = await apiFetch<any>(`/leads/${id}`);
  return data as LeadI;
};

export const fetchFilteredLeadsByScrapingId = async (
  scrapingId: string | null,
  filters: { name?: string; company?: string },
  page = 1,
  limit = 10,
): Promise<{ leads: any[]; total: number }> => {
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(filters.name ? { name: filters.name } : {}),
    ...(filters.company ? { company: filters.company } : {}),
  });
  return apiFetch(`/scrapings/${scrapingId}/leads?${qs}`);
};

// Compatibility wrapper: collection-named API that reuses existing scraping implementation
export const fetchFilteredLeadsByCollectionId = async (
  collectionId: string | null,
  filters: { name?: string; company?: string },
  page = 1,
  limit = 10,
): Promise<{ leads: any[]; total: number }> => {
  return fetchFilteredLeadsByScrapingId(collectionId, filters, page, limit);
};

export async function getLeadEligibility(leadId: string) {
  return apiFetch(`/leads/${leadId}/eligibility`);
}

export async function verifyLead(leadId: string) {
  return apiFetch(`/leads/${leadId}/verify`, { method: 'POST' });
}

export async function markLeadTrusted(leadId: string) {
  return apiFetch(`/leads/${leadId}/mark-trusted`, { method: 'POST' });
}

export async function convertLeadToOutreach(leadId: string) {
  return apiFetch(`/leads/${leadId}/convert-to-outreach`, { method: 'POST' });
}

export async function bulkEvaluateLeadsForOutreach(leadIds: string[]) {
  return apiFetch(`/leads/bulk-evaluate-for-outreach`, { method: 'POST', body: JSON.stringify({ leadIds }) });
}

export async function bulkConvertLeadsToOutreach(leadIds: string[]) {
  return apiFetch(`/leads/bulk-convert-to-outreach`, { method: 'POST', body: JSON.stringify({ leadIds }) });
}

