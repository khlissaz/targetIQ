import { apiFetch } from '@/lib/api';

export type OutreachProspectRow = {
  id: string;
  businessId: string;
  leadId: string;
  qualificationStatus: string;
  trustScore: number;
  primaryChannel?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  whatsappNumber?: string | null;
  fullName?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  contactReadiness: string;
  status: string;
  createdAt?: string;
};

export async function getOutreachProspects(params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') qs.set(k, String(v));
  });
  return apiFetch<{ items: OutreachProspectRow[]; total: number; page: number; limit: number; totalPages: number }>(`/outreach/prospects${qs.toString() ? `?${qs.toString()}` : ''}`);
}
export async function pauseOutreachProspect(id: string) { return apiFetch(`/outreach/prospects/${id}/pause`, { method: 'POST' }); }
export async function resumeOutreachProspect(id: string) { return apiFetch(`/outreach/prospects/${id}/resume`, { method: 'POST' }); }
export async function archiveOutreachProspect(id: string) { return apiFetch(`/outreach/prospects/${id}/archive`, { method: 'POST' }); }
