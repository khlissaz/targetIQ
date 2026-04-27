import { apiFetch } from '@/lib/api';
import type { CreateOutreachSequencePayload, OutreachSequenceListResponse, OutreachSequenceRow } from '@/types/api/messaging';

export async function getOutreachSequences(params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && String(v).trim() !== '' && String(v) !== 'all') qs.set(k, String(v)); });
  return apiFetch<OutreachSequenceListResponse>(`/outreach-sequences${qs.toString() ? `?${qs.toString()}` : ''}`);
}
export async function createOutreachSequence(
  payload: CreateOutreachSequencePayload,
) {
  return apiFetch('/outreach-sequences', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function updateOutreachSequence(id: string, payload: Partial<CreateOutreachSequencePayload>) { return apiFetch<OutreachSequenceRow>(`/outreach-sequences/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
export async function deleteOutreachSequence(id: string) { return apiFetch<{ success: true }>(`/outreach-sequences/${id}`, { method: 'DELETE' }); }
