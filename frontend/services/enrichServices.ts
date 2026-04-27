import { toast } from '@/hooks/use-toast';
import { EnrichmentResultI, GetEnrichmentTasksStatusI, LeadI, StartLeadEnrichmentI } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { translate } from '@/lib/i18n';
import { safeLog, sanitizeError } from '@/lib/safeLogging';

export async function fetchCredits(): Promise<number> {
  try {
    const payload = await apiFetch<any>('/credits');
    const dailyCap = typeof payload?.enrich?.dailyCap === 'number' ? payload.enrich.dailyCap : 0;
    const dailyUsed = typeof payload?.enrich?.dailyUsed === 'number' ? payload.enrich.dailyUsed : 0;
    const remaining = dailyCap > 0 ? Math.max(0, dailyCap - dailyUsed) : 0;
    safeLog('info', 'enrich.credits.fetched', { remaining });
    return remaining;
  } catch (error) {
    const se = sanitizeError(error);
    toast({ description: `${translate('credits.fetchError')}: ${se.message}`, variant: 'destructive' });
    safeLog('error', 'enrich.fetchCredits.failed', { message: se.message, code: se.code });
    throw error;
  }
}

export async function enrichLead(lead: LeadI, fields: string[]): Promise<EnrichmentResultI | null> {
  try {
    const result = await apiFetch<any>('/enrichment', {
      method: 'POST',
      body: JSON.stringify({
        id: lead.id,
        name: lead.profile.name,
        profileLink: lead.profile.profileLink,
        company: lead.profile.company,
        previewOnly: false,
        fields,
      }),
    });
    return (result?.enriched as EnrichmentResultI) || null;
  } catch (error) {
    const se = sanitizeError(error);
    toast({ description: `${translate('lead.enrichmentConfirmError')}: ${se.message}`, variant: 'destructive' });
    safeLog('error', 'enrich.enrichLead.failed', { message: se.message, code: se.code });
    return null;
  }
}

export async function startLeadEnrichmentProcess(
  leadId: string,
  fields?: Array<'email' | 'phone'>,
): Promise<StartLeadEnrichmentI> {
  return apiFetch<StartLeadEnrichmentI>('/lead-enrichment-tasks/startLeadEnrichmentProcess', {
    method: 'POST',
    body: JSON.stringify({
      leadId,
      ...(Array.isArray(fields) && fields.length > 0 ? { fields } : {}),
    }),
  });
}

export const getEnrichmentTasksStatus = async (): Promise<{ data: GetEnrichmentTasksStatusI[] }> => {
  try {
    return await apiFetch<{ data: GetEnrichmentTasksStatusI[] }>('/lead-enrichment-tasks/getStatusOfProcessingTasks');
  } catch (error) {
    const se = sanitizeError(error);
    toast({ description: `${translate('lead.enrichmentTasksStatusError')}: ${se.message}`, variant: 'destructive' });
    safeLog('error', 'enrich.getEnrichmentTasksStatus.failed', { message: se.message, code: se.code });
    return { data: [] };
  }
};

export async function getEnrichmentTasksByLeadIds(leadIds: string[]): Promise<GetEnrichmentTasksStatusI[]> {
  try {
    const uniqueIds = Array.from(new Set((leadIds || []).map((id) => String(id || '').trim()).filter(Boolean)));
    if (uniqueIds.length === 0) return [];

    const params = new URLSearchParams({ leadIds: uniqueIds.join(',') });
    const token = typeof window !== 'undefined' ? localStorage.getItem('access-token') : null;
    const businessId = typeof window !== 'undefined' ? localStorage.getItem('active-business-id') : null;

    const res = await fetch(`/api/enrichment/tasks?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(businessId ? { 'X-Business-Id': businessId } : {}),
      },
    });

    const data = await res.json().catch(() => ({ items: [] }));
    const items = Array.isArray((data as any)?.items) ? (data as any).items : Array.isArray(data) ? data : [];
    return items as GetEnrichmentTasksStatusI[];
  } catch (error) {
    const se = sanitizeError(error);
    toast({ description: `${translate('lead.enrichmentTasksFetchError')}: ${se.message}`, variant: 'destructive' });
    safeLog('error', 'enrich.getEnrichmentTasksByLeadIds.failed', { message: se.message, code: se.code });
    return [];
  }
}
