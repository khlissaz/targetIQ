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
  const [isLoading, setIsLoading] = useState(false);

  const handleEnrich = async () => {
    try {
    console.log('handleEnrich');
    setIsLoading(true);
    const lead = leads.find((l) => l.id === leadId);
    console.log('Found lead for enrichment:', lead);
    if (!lead) {
      setIsLoading(false);
      toast({ description: t('lead.notFoundInStore') || 'Lead not found.' });
      return;
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
    } finally {
      setIsLoading(false);
    }
  } catch (error) {
    console.error('Error in handleEnrich:', error);
    toast({ description: "Unexpected error during enrichment." });
    setIsLoading(false);
  }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleEnrich}
          variant={iconOnly ? 'ghost' : 'default'}
          className={`flex items-center gap-2 text-sm border-2 border-[#FFBA18] bg-[#FFF7E6] hover:bg-[#FFBA18] hover:text-[#FF6B00] shadow-lg transition-all duration-200 ${isLoading ? 'ring-2 ring-[#FF6B00] animate-pulse' : ''}`}
          disabled={isLoading}
        >
          <span className={isLoading ? 'animate-vibrate' : ''}>
            <Zap className="h-4 w-4" />
          </span>
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

// Add vibrate animation
<style jsx global>{`
@keyframes vibrate {
  0% { transform: translate(0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(-1px, -1px); }
  60% { transform: translate(1px, 1px); }
  80% { transform: translate(1px, -1px); }
  100% { transform: translate(0); }
}
.animate-vibrate {
  animation: vibrate 0.3s linear infinite;
}
`}</style>