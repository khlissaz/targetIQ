// Alias for compatibility with tests and legacy code
export const sendScrapeData = sendScrapeLinkedInData;
import apiClient from "@/app/api";
import { LeadI, ScrapedLeadDto } from "@/types";

type SourceType =
  | 'group_membership'
  | 'reaction'
  | 'comment'
  | 'repost'
  | 'search_person'
  | 'connection'
  | 'follower';

interface ScrapeDataPayload {
  sourceType: SourceType;
  data: ScrapedLeadDto[];
}

const API_BASE_URL = 'http://localhost:5000/api'; // change to your backend URL

interface SendScrapeOptions {
  token?: string;
  idempotencyKey?: string;
  maxRetries?: number;
}

export async function sendScrapeLinkedInData(payload: ScrapeDataPayload, options?: SendScrapeOptions) {
  const { token, idempotencyKey, maxRetries = 3 } = options ?? {};
  const url = `${API_BASE_URL}/scraping/ingest`;
  console.log("payload", payload)
  const body = {
    source: 'LINKEDIN',
    type: (payload.sourceType ?? 'OTHER').toUpperCase(),
    leads: payload.data,
    idempotencyKey,
  } as any;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  let attempt = 0;
  while (true) {
    try {
      const res = await apiClient.post(url, body, { headers });
      console.log('[Scraper] Data sent successfully', res.data);
      return res.data;
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) {
        console.error('[Scraper] Failed to send data after retries', err);
        throw err;
      }
      // exponential backoff with jitter
      const backoff = Math.min(1000 * (2 ** (attempt - 1)), 10000) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}

export async function sendScrapedWhatsappData(payload: ScrapeDataPayload, options?: SendScrapeOptions) {
  const { token, idempotencyKey, maxRetries = 3 } = options ?? {};
  const url = `${API_BASE_URL}/scraping/ingest`;
  const body = {
    source: 'WHATSAPP',
    type: (payload.sourceType ?? 'OTHER').toUpperCase(),
    leads: payload.data,
    idempotencyKey,
  } as any;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  let attempt = 0;
  while (true) {
    try {
      const res = await apiClient.post(url, body, { headers });
      console.log('[Scraper] Data sent successfully', res.data);
      return res.data;
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) {
        console.error('[Scraper] Failed to send data after retries', err);
        throw err;
      }
      // exponential backoff with jitter
      const backoff = Math.min(1000 * (2 ** (attempt - 1)), 10000) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}


// Upload diagnostics payload to backend
interface DiagnosticsPayload {
  groupName?: string;
  scanned?: number;
  extracted?: number;
  samples?: { extracted?: any[]; skipped?: any[] };
  metadata?: Record<string, any>;
}

export async function sendDiagnostics(payload: DiagnosticsPayload, options?: { token?: string; maxRetries?: number }) {
  const { token, maxRetries = 3 } = options ?? {};
  const url = `${API_BASE_URL}/scraping/diagnostics`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status >= 500 && attempt < maxRetries) throw new Error(`Retryable API error: ${res.status} ${text}`);
        throw new Error(`API error: ${text}`);
      }

      const json = await res.json();
      console.debug('[sendDiagnostics] called, response:', json);
      console.log('[Scraper] Diagnostics uploaded', json);
      return json;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) {
        console.error('[Scraper] Failed to upload diagnostics after retries', err);
        throw err;
      }
      const backoff = Math.min(1000 * (2 ** (attempt - 1)), 10000) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}


export async function sendLeadToServer(data: { source: string; type: string; leads: LeadI[]; }) {
  try {
    const res = await apiClient.post(`${API_BASE_URL}/scraping/ingest`, data);
   
    return res.data;
  } catch (err) {
    console.error("sendLeadToServer error:", err);
    return false;
  }
}

export async function sendAllLeads(data:{ source: string; type: string; leads: LeadI[]; }) {
  try {
    const res = await fetch(`${API_BASE_URL}/scraping/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("sendAllLeads error:", err);
    throw err;
  }
}
export async function getScrapingLimit():  Promise<{ dailyLimit: number; dailyUsage: number }> {
  try {
    const{ data} = await apiClient.get(`${API_BASE_URL}/credits/scraping-limit`);
  
    console.log("Fetch limit response:", data);
    return data;
  } catch (err) {
    console.log("Fetch limit error:", err);
    return { dailyLimit: 0, dailyUsage: 0 };
  }
}
export async function incrementScrapeCount(amount = 1): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/increment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'scraping', amount }),
    });
    if (!res.ok) throw new Error(await res.text());
    console.log("Increment scrape response:", res);
    return true;
  } catch (err) {
    console.error("Increment scrape error:", err);
    return false;
  }
}