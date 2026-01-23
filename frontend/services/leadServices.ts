import { LeadI } from "@/lib/types";
import apiClient from "./api";
import { toast } from "@/hooks/use-toast";
import axios from "axios";

export const updateLeadStatus = async (leadId: string, status: string): Promise<void> => {
  try {
    await apiClient.put(`/leads/${leadId}`, { status });
    toast({description: `Lead status updated to ${status}.`});
  } catch (error) {
    throw new Error('Failed to update lead status.');
  }
};
export const fetchLeadById = async (id: string): Promise<LeadI> => {
    try {
      const response = await apiClient.get(`/leads/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  export const fetchFilteredLeadsByScrapingId = async (
    scrapingId: string | null,
    filters: {
      name?: string;
      company?: string;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ leads: any[]; total: number }> => {
    try {
      const params: any = {
        page,
        limit,
        ...filters, // Include optional filters dynamically
      };
  
      const response = await apiClient.get(`/scrapings/${scrapingId}/leads`, { params });
  
      return response.data; // Assuming the response includes { data, total }
    } catch (error) {
      if (axios.isAxiosError(error)) {
       
        throw new Error(`Failed to fetch leads for scraping ID ${scrapingId}: ${error.message}`);
      }
  
      throw new Error('An unexpected error occurred while fetching leads.');
    }
  };
