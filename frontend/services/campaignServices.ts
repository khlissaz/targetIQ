import { apiFetch } from '@/lib/api';
import type { CampaignEnrollmentListResponse, CampaignListResponse, CampaignOrchestrationResult, CampaignRow } from '@/types/api/campaigns';

export async function getCampaigns(params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '' && String(v) !== 'all') qs.set(k, String(v));
  });
  return apiFetch<CampaignListResponse>(`/campaigns${qs.toString() ? `?${qs.toString()}` : ''}`);
}

export async function createCampaign(payload: Partial<CampaignRow>) {
  return apiFetch<CampaignRow>('/campaigns', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getCampaignById(id: string) {
  return apiFetch<CampaignRow>(`/campaigns/${id}`);
}

export async function updateCampaign(id: string, payload: Partial<CampaignRow>) {
  return apiFetch<CampaignRow>(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function deleteCampaign(id: string) {
  return apiFetch<{ success: true }>(`/campaigns/${id}`, { method: 'DELETE' });
}

export async function getCampaignEnrollments(id: string, params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '' && String(v) !== 'all') qs.set(k, String(v));
  });
  return apiFetch<CampaignEnrollmentListResponse>(`/campaigns/${id}/enrollments${qs.toString() ? `?${qs.toString()}` : ''}`);
}

export async function enrollProspectsInCampaign(id: string, prospectIds: string[]) {
  return apiFetch<{ enrolledCount: number; skippedCount: number; enrollmentIds: string[]; skipped: Array<{ prospectId: string; reason: string }> }>(`/campaigns/${id}/enroll-prospects`, { method: 'POST', body: JSON.stringify({ prospectIds }) });
}

export async function removeCampaignEnrollments(id: string, enrollmentIds: string[]) {
  return apiFetch<{ removedCount: number }>(`/campaigns/${id}/remove-enrollments`, { method: 'POST', body: JSON.stringify({ enrollmentIds }) });
}

export async function updateCampaignEnrollmentStatus(id: string, enrollmentId: string, payload: Record<string, any>) {
  return apiFetch(`/campaigns/${id}/enrollments/${enrollmentId}/status`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function updateCampaignEnrollmentReply(id: string, enrollmentId: string, payload: Record<string, any>) {
  return apiFetch(`/campaigns/${id}/enrollments/${enrollmentId}/reply`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function updateCampaignEnrollmentFollowup(id: string, enrollmentId: string, payload: Record<string, any>) {
  return apiFetch(`/campaigns/${id}/enrollments/${enrollmentId}/followup`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function orchestrateCampaignSend(
  campaignId: string,
  payload: {
    mode: 'preview' | 'execute';
    enrollmentIds?: string[];
    templateId?: string;
    sequenceId?: string;
  },
): Promise<CampaignOrchestrationResult> {
  return apiFetch<CampaignOrchestrationResult>(
    `/campaigns/${campaignId}/orchestrate-send`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
