import { ScrapingI } from "./types";
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
import { LeadI } from "./types";

// Fetch leads with optional limit and page
export async function getScrapedLeads({ limit, page }: { limit?: number; page?: number }): Promise<{ data: LeadI[], page: number, total: number, totalPages: number }> {
  let query = '';
  if (limit !== undefined) query += `?limit=${limit}`;
  if (page !== undefined) query += (query ? '&' : '?') + `page=${page}`;
  const result: { data: LeadI[], page: number, total: number, totalPages: number } = await apiFetch(`/leads${query}`);
  console.log('Fetched leads:', result);
  return result;
}
// api.ts
// Helper for making API requests to the NestJS backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
