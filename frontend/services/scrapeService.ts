import axios from 'axios';
import apiClient from './api';
import { toast } from '@/hooks/use-toast';
import { LeadI, ScrapingI } from '@/lib/types';
import { apiFetch } from '@/lib/api';

/**
 * Fetch all scrapings from the server
 */
export const fetchScrapings = async (): Promise<any> => {
  try {
    const response = await apiClient.get('/scraping/list');
    toast({ description:'Scrapings retrieved successfully'});
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetching scrapings');
  }
};

/**
 * Fetch scrapings filtered by date
 * @param date Date to filter scrapings
 */
export const fetchScrapedDataByDate = async (date: Date): Promise<any> => {
  try {
    const response = await apiClient.get('/scraping', { params: { date: date.toISOString() } });
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetching scrapings by date');
  }
};

/**
 * Fetch scrapings with filters
 */
export const fetchFilteredScrapings = async (startDate?: Date, endDate?: Date, leadsCount?: undefined): Promise<ScrapingI[]> => {
  try {
    const params: any = {};

    if (startDate) {
      params.startDate = startDate.toISOString(); // Convert to ISO format
    }
    if (endDate) {
      params.endDate = endDate.toISOString(); // Convert to ISO format
    }
    if (leadsCount !== undefined) {
      params.leadsCount = leadsCount;
    }
    const response = await apiClient.get('/scraping', { params });
   
    return response.data; // Return API data
  } catch (error) {
    handleApiError(error, 'fetching filtered scrapings');
    throw new Error('An unexpected error occurred while fetching data.');
  }
};

interface LeadFilters {
  name?: string;
  company?: string;
  job?: string;
  reactionType?: string;
}


export const fetchLeads = async (
  selectedFile: string | null,
  currentPage: number,
  perPage: number,
  filters: LeadFilters
): Promise<any> => {
  try {
    // Construct query parameters dynamically
    const params: Record<string, string | number> = {
      page: currentPage,
      perPage,
    };

    if (selectedFile) params.selectedFile = selectedFile;

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    const response = await apiClient.get('/leads', { params });
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetching leads');
    throw error; // Ensure the error propagates for proper handling
  }
};


/**
 * Fetch leads with pagination
 */
export const fetchLeadsPerPage = async (
  filters: { name?: string; company?: string },
  page: number = 1,
  limit: number = 10
): Promise<any> => {
  try {
    const response = await apiClient.get('/leads', { params: { ...filters, page, limit } });
    return response.data;
  } catch (error) {
    handleApiError(error, 'fetching leads per page');
  }
};

/**
 * Enrich leads with external data
 */
export const enrichLeads = async (file: string): Promise<any> => {
  try {
    const response = await apiClient.post('/leads/enrich', { file });
    toast({description: 'Leads enriched successfully'});
    return response.data;
  } catch (error) {
    handleApiError(error, 'enriching leads');
  }
};

/**
 * Download CSV of scrapings or leads
 */
export const downloadCSV = async (file: string): Promise<void> => {
  try {
    const response = await apiClient.get("/scraping/download", {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({description: 'CSV downloaded successfully'});
  } catch (error) {
    handleApiError(error, 'downloading CSV');
  }
};

/**
 * Generic error handler for API calls
 */
const handleApiError = (error: any, action: string) => {
  const message = axios.isAxiosError(error) ? error.response?.data || error.message : 'Unexpected error occurred';
  toast({description: `Error ${action}: ${message}`,
    variant: 'destructive',});
  throw new Error(`Failed ${action}: ${message}`);
};

export const fetchScrapingsByMonth = async (month: number, year: number) => {
  try {
    const response = await apiClient.get('/scraping/by-month', { params: { month, year } });
    return response.data;
  } catch (error) {
    console.error('Error fetching scrapings:', error);
    throw error;
  }
}

// Fetch recent scraping files for the logged-in user
export async function getScrapings(): Promise<ScrapingI[]> {
  // Backend endpoint: GET /scraping/recent (requires auth)
  const result = await apiFetch<any>(`/scraping/recent`);
  // result can be {scraping, leads} or an array; normalize to array of ScrapingI
  if (Array.isArray(result)) return result;
  if (result?.scraping) {
    // If backend returns {scraping, leads}
    return [{
      ...result.scraping,
      leads: result.leads || [],
    }];
  }
  return [];
}

// Fetch leads with optional limit and page
export async function getScrapedLeadsById({ id, limit, page }: { id: string; limit?: number; page?: number }): Promise<{ leads: LeadI[], page: number, total: number, totalPages: number }> {
  let query = '';
  if (id) query += `?scrapingId=${id}`;
  if (limit !== undefined) query += `&limit=${limit}`;
  if (page !== undefined) query += (query ? '&' : '?') + `page=${page}`;
  const result: { leads: LeadI[], page: number, total: number, totalPages: number } = await apiFetch(`/scraping/list-leads/${query}`);
  console.log('Fetched leads by id:', id);
  console.log('Fetched leads:', result);
  return result;
}