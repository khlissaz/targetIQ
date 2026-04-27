import { apiFetch } from '@/lib/api';
import type { OutreachProspectRow } from './outreachProspectServices';

export type OutreachListRow = {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  membersCount?: number;
};

export type OutreachListDetails = OutreachListRow & {
  members?: Array<{ id: string; prospectId: string; prospect: OutreachProspectRow }>;
};

export async function getOutreachLists(params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') qs.set(k, String(v));
  });
  return apiFetch<{ items: OutreachListRow[]; total: number; page: number; limit: number; totalPages: number }>(`/outreach/lists${qs.toString() ? `?${qs.toString()}` : ''}`);
}
export async function getOutreachListById(id: string) { return apiFetch<OutreachListDetails>(`/outreach/lists/${id}`); }
export async function createOutreachList(payload: { name: string; description?: string; prospectIds?: string[] }) { return apiFetch<OutreachListDetails>(`/outreach/lists`, { method: 'POST', body: JSON.stringify(payload) }); }
export async function updateOutreachList(id: string, payload: { name?: string; description?: string | null }) { return apiFetch<OutreachListDetails>(`/outreach/lists/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
export async function deleteOutreachList(id: string) { return apiFetch<{ success: true }>(`/outreach/lists/${id}`, { method: 'DELETE' }); }
export async function addProspectsToOutreachList(id: string, prospectIds: string[]) { return apiFetch<OutreachListDetails>(`/outreach/lists/${id}/add-prospects`, { method: 'POST', body: JSON.stringify({ prospectIds }) }); }
export async function removeProspectsFromOutreachList(id: string, prospectIds: string[]) { return apiFetch<OutreachListDetails>(`/outreach/lists/${id}/remove-prospects`, { method: 'POST', body: JSON.stringify({ prospectIds }) }); }
