'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';

import { fetchLeadById } from '@/services/leadServices';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppStore } from '@/lib/appStore';
import { startLeadEnrichmentProcess } from '@/services/enrichServices';
import { toast } from '@/hooks/use-toast';
import { EnrichmentTaskI } from '@/lib/types';

interface EnrichLeadButtonProps {
  leadId: string;
  iconOnly?: boolean;
  fields?: Array<'email'>;
}

const EnrichLeadButton: React.FC<EnrichLeadButtonProps> = ({
  leadId,
  fields = ['email'],
  iconOnly = false,
}) => {
  const { language } = useLanguage();
 const { t } = useTranslation(language);

  // TODO : changer le format destructurer car ça met à jour tout le store
  const { showEnrichmentProgress, addTask, leads, setLeads, updateGlobalTimer } = useAppStore();
  const setEnrichmentCredits = useAppStore((state) => state.setEnrichmentCredits);
  const enrichmentCredits = useAppStore((state) => state.enrichmentCredits);

  const handleEnrich = async () => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) {
      throw new Error('Lead not found in store');
    }
    const previousLeadStatus = lead.status;
    const previousEnrichmentCredits = enrichmentCredits;
      
      
    setLeads((prevLeads) =>
      prevLeads.map((l) =>
        l.id === leadId ? { ...l, status: 'pending' } : l
      )
    );
    setEnrichmentCredits(enrichmentCredits - 1);

    

    try {
      const processStatus = await startLeadEnrichmentProcess(leadId);
      if (processStatus === null) return;
        const task: EnrichmentTaskI = {
        leadId: lead.id,
        name: lead.profile.name,
        status: lead.status as 'pending' | 'success' | 'failed' | 'error' | 'terminated',
        message: t("lead.enrich_tooltip"),
      }
      addTask(task);
      showEnrichmentProgress();
      updateGlobalTimer();

    } catch (err) {
      setLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === leadId ? { ...l, status: previousLeadStatus } : l
        )
      );
      setEnrichmentCredits(previousEnrichmentCredits);
      toast({ description: "Error enrichment: " + err });
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleEnrich}
          variant={iconOnly ? 'ghost' : 'default'}
          className="flex items-center gap-2 text-sm"
        >
          <Zap className="h-4 w-4" />
          {!iconOnly && t('lead.enrich')}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t("lead.enrich_tooltip")}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default EnrichLeadButton;