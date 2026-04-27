import { LeadI } from '@/lib/types';
export type LeadEligibility = { leadId: string; canConvert: boolean; trustScore: number; qualificationStatus: 'raw'|'reviewing'|'verified'|'trusted'|'rejected'|'archived'; primaryChannel: 'email'|'phone'|'linkedin'|'whatsapp'|null; contactReadiness: 'ready'|'partial'|'not_ready'; reasons: string[]; };
export type BulkEvaluateLeadsResponse = { eligible: Array<{ leadId: string; trustScore: number; qualificationStatus: string; primaryChannel: string|null; contactReadiness: string }>; ineligible: Array<{ leadId: string; reasons: string[]; trustScore?: number; qualificationStatus?: string; primaryChannel?: string|null; contactReadiness?: string }>; };
export type BulkConvertLeadsResponse = { convertedCount: number; skippedCount: number; prospectIds: string[]; skipped: Array<{ leadId: string; reasons: string[] }>; };
export type ConvertLeadToOutreachResponse = { prospectId: string; leadId: string; qualificationStatus: string; trustScore: number; primaryChannel: string | null; contactReadiness: string; };
export type LeadRow = LeadI;
