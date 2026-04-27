'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/lib/appStore';
import { LeadI, EnrichmentTaskI } from '@/lib/types';
import { startLeadEnrichmentProcess } from '@/services/enrichServices';

import { toast } from '@/hooks/use-toast';
import { fetchLeadById } from '@/services/leadServices';
import { sanitizeError, safeLog } from '@/lib/safeLogging';
import { Loader2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRuntimeStatus } from '@/lib/runtimeStatus';

interface EnrichLeadButtonProps {
  lead?: LeadI;
  leadId?: string;
  fields?: Array<'email' | 'phone'>;
  iconOnly?: boolean;
}

const costForFields = (fields?: Array<'email' | 'phone'>) => {
  const normalized = Array.from(new Set(fields || [])).sort().join(',');
  if (normalized === 'email') return 1;
  if (normalized === 'phone') return 6;
  return 7;
};

const EnrichLeadButton: React.FC<EnrichLeadButtonProps> = ({
  lead,
  leadId,
  fields,
  iconOnly = false,
}) => {
  const { language } = useLanguage();
  const { t } = useTranslation(language);
  const router = useRouter();
  const {
    showEnrichmentProgress,
    addTask,
    updateGlobalTimer,
    enrichmentCredits,
    setEnrichmentCredits,
    fetchEnrichmentCredits,
  } = useAppStore();
  const storeLeads = useAppStore((state) => state.leads);
  const setStoreLeads = useAppStore((state) => state.setLeads);
  const [isLoading, setIsLoading] = useState(false);
  const runtime = useRuntimeStatus();

  const lastCredits = runtime.lastCredits;
  const addonBalance = typeof lastCredits?.addonBalance === 'number' ? lastCredits.addonBalance : 0;
  const enrichMonthlyRemaining =
    typeof lastCredits?.enrich?.monthlyRemaining === 'number' ? lastCredits.enrich.monthlyRemaining : null;
  const enrichPlanRemaining = enrichMonthlyRemaining != null ? Math.max(0, enrichMonthlyRemaining) : 0;
  const enrichAvailable = enrichPlanRemaining + addonBalance;
  const noEnrichAvailable = enrichAvailable <= 0;
  const dailyEnrichDisabled =
    !!lastCredits?.enrich &&
    typeof lastCredits.enrich.dailyUsed === 'number' &&
    typeof lastCredits.enrich.dailyCap === 'number' &&
    lastCredits.enrich.dailyCap > 0 &&
    lastCredits.enrich.dailyUsed >= lastCredits.enrich.dailyCap;
  const blockedByApi = runtime.block.kind !== 'none';
  const requiredCredits = costForFields(fields);
  const outOfEnrichmentCredits = (enrichmentCredits ?? 0) < requiredCredits;

  const normalizedLeadId = useMemo(() => {
    if (leadId) return String(leadId);
    if (lead?.id !== undefined && lead?.id !== null) return String(lead.id);
    return '';
  }, [lead?.id, leadId]);

  const resolveLead = useCallback(async (): Promise<LeadI | null> => {
    const id = normalizedLeadId;
    if (!id) return null;

    const fromStore = (storeLeads || []).find((l) => String(l.id) === String(id));
    if (fromStore) return fromStore;
    if (lead && String(lead.id) === String(id)) return lead;

    try {
      const fetched = await fetchLeadById(String(id));
      if (fetched && (fetched as any).id !== undefined) {
        setStoreLeads((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const idx = next.findIndex((l) => String(l.id) === String((fetched as any).id));
          if (idx >= 0) next[idx] = fetched as any;
          else next.push(fetched as any);
          return next;
        });
        return fetched as any;
      }
    } catch {
      // ignore
    }

    return null;
  }, [lead, normalizedLeadId, setStoreLeads, storeLeads]);

  const computedFields = useMemo(() => {
    if (Array.isArray(fields) && fields.length > 0) return fields;

    const l = (storeLeads || []).find((x) => String(x.id) === String(normalizedLeadId)) ?? lead;
    const email = (l?.profile?.email ?? '').trim();
    const phone = (l?.profile?.phone ?? '').trim();
    const missing: Array<'email' | 'phone'> = [];
    if (!email) missing.push('email');
    if (!phone) missing.push('phone');
    return missing.length > 0 ? missing : undefined;
  }, [fields, lead, normalizedLeadId, storeLeads]);

  const disabledReasonKey = useMemo(() => {
    if (runtime.block.kind === 'login') return 'status.loginRequired';
    if (runtime.block.kind === 'workspaceRequired') return 'status.workspaceRequired';
    if (noEnrichAvailable) return 'status.enrichExhausted';
    if (runtime.block.kind === 'upgrade' || outOfEnrichmentCredits) return 'status.upgradeRequired';
    if (runtime.block.kind === 'dailyCap' || dailyEnrichDisabled) return 'status.dailyCapReached';
    if (blockedByApi) return 'status.temporarilyUnavailable';
    if (isLoading) return null;
    return null;
  }, [blockedByApi, dailyEnrichDisabled, isLoading, noEnrichAvailable, outOfEnrichmentCredits, runtime.block.kind]);

  const actionTooltipKey = useMemo(() => {
    if (disabledReasonKey) return disabledReasonKey;
    if (!computedFields || computedFields.length === 0) return 'lead.enrich_tooltip';
    const normalized = Array.from(new Set(computedFields)).sort().join(',');
    if (normalized === 'email') return 'lead.enrichEmail';
    if (normalized === 'phone') return 'lead.enrichPhone';
    return 'lead.enrichEmailPhone';
  }, [computedFields, disabledReasonKey]);

  const handleEnrich = async () => {
    try {
      setIsLoading(true);
      const id = normalizedLeadId;
      if (!id) {
        toast({ description: t('lead.notFoundInStore') });
        return;
      }

      const resolved = await resolveLead();
      if (!resolved) {
        toast({ description: t('lead.notFoundInStore') });
        return;
      }

      const response = await startLeadEnrichmentProcess(String(id), computedFields);

      const safeName =
        resolved?.profile?.name ||
        [resolved?.profile?.firstname, resolved?.profile?.lastname].filter(Boolean).join(' ') ||
        (resolved?.profile?.email ?? '').trim() ||
        String(id);

      const task: EnrichmentTaskI = {
        leadId: String(id),
        name: safeName,
        status: (response.status as any) || 'pending',
        message: response.message || t(actionTooltipKey),
        email: response.email || undefined,
        phone: response.phone || undefined,
        requestedFields: response.requestedFields || computedFields,
        creditsUsed: response.creditsUsed ?? null,
      };

      addTask(task);
      showEnrichmentProgress();
      updateGlobalTimer();

      if (typeof response.creditsUsed === 'number' && response.creditsUsed > 0) {
        setEnrichmentCredits(Math.max(0, (enrichmentCredits ?? 0) - response.creditsUsed));
      }
      fetchEnrichmentCredits();
    } catch (error) {
      const se = sanitizeError(error);
      safeLog('error', 'enrich.handleEnrich.failed', {
        action: 'enrich',
        message: se.message,
        code: se.code,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || dailyEnrichDisabled || blockedByApi || outOfEnrichmentCredits || noEnrichAvailable;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex" tabIndex={isDisabled ? 0 : -1}>
          <Button
            onClick={handleEnrich}
            variant={iconOnly ? 'ghost' : 'default'}
            size={iconOnly ? 'icon' : 'sm'}
            className={`flex items-center gap-2 text-sm border border-tiq-border bg-tiq-bg text-tiq-text shadow-tiq transition-colors hover:bg-tiq-surface hover:text-tiq-primary ${isLoading ? 'ring-2 ring-tiq-primary animate-pulse' : ''}`}
            disabled={isDisabled}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {!iconOnly && t('lead.enrich')}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {runtime.block.kind === 'workspaceRequired' ? (
          <div className="space-y-2">
            <p>{t('status.workspaceRequired')}</p>
            <Button size="sm" variant="outline" onClick={() => router.push('/dashboard')}>
              {t('auth.createWorkspace')}
            </Button>
          </div>
        ) : (
          <p>{t(actionTooltipKey)}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default EnrichLeadButton;
