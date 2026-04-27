import { apiFetch } from '@/lib/api';
import type { MessageTemplateListResponse, MessageTemplateRow } from '@/types/api/messaging';

export async function getMessageTemplates(params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && String(v).trim() !== '' && String(v) !== 'all') qs.set(k, String(v)); });
  return apiFetch<MessageTemplateListResponse>(`/message-templates${qs.toString() ? `?${qs.toString()}` : ''}`);
}
export async function createMessageTemplate(payload: Partial<MessageTemplateRow>) { return apiFetch<MessageTemplateRow>('/message-templates', { method: 'POST', body: JSON.stringify(payload) }); }
export async function updateMessageTemplate(id: string, payload: Partial<MessageTemplateRow>) { return apiFetch<MessageTemplateRow>(`/message-templates/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); }
export async function deleteMessageTemplate(id: string) { return apiFetch<{ success: true }>(`/message-templates/${id}`, { method: 'DELETE' }); }
