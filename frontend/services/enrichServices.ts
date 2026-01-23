import { toast } from "@/hooks/use-toast";
import { EnrichmentResultI, GetEnrichmentTasksStatusI, LeadI, StartLeadEnrichmentI } from "@/lib/types";
import apiClient from "./api";

interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}
export async function fetchCredits(): Promise<number> {
  try {
    const response = await apiClient.get('/users/enrichmentCredits');
    return response.data;
  } catch (error) {
    toast({description: 'Error fetching credits: ' + error});
    throw error;
  }
}

export async function enrichLead(lead: LeadI, fields: string[]): Promise<EnrichmentResultI | null> {
  try {
    const response = await apiClient.post('/enrichment', {
      id: lead.id,
      name: lead.profile.name,
      profileLink: lead.profile.profileLink,
      company: lead.profile.company,
      previewOnly: false,
      fields
    });
    return response.data.enriched as EnrichmentResultI || null;
}
catch (error) {
    toast({ description: 'Error confirming enrichment: ' + error });
    return null;
  }
}
  
export async function startLeadEnrichmentProcess(leadId: string) {
  try {
    return await apiClient.post(
      '/lead-enrichment-tasks/startLeadEnrichmentProcess',
      { leadId }
    );
  } catch (err) {
    const error = err as ApiError;
    toast({
      variant: "destructive",
      description:
        error?.response?.data?.message ??
        "Failed to start enrichment process",
    });
    return null;
  }
}

//export async function getEnrichmentTasksStatus(): Promise<GetEnrichmentTasksStatusI[] | null> {
export const getEnrichmentTasksStatus = async (): Promise<{ data: GetEnrichmentTasksStatusI[] }> => {
  try {
    return await apiClient.get('/lead-enrichment-tasks/getStatusOfProcessingTasks');
  }
  catch (error) {
    toast({ description: 'Error getEnrichmentTasksStatus service: ' + error });
    return { data: [] };
  }
}