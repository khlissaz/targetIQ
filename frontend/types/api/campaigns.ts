import type { PaginatedResponse } from './common';

export type CampaignRow = {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  channel: 'email' | 'phone' | 'linkedin' | 'whatsapp' | 'multi';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  enrollmentsCount?: number;
  defaultTemplateId?: string | null;
  sequenceId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CampaignFormState = {
  name: string;
  description: string;
  channel: 'email' | 'phone' | 'linkedin' | 'whatsapp' | 'multi';
  status: 'draft' | 'active' | 'paused' | 'completed';
};

export type CampaignOrchestrationResult = {
  count: number;
  mode: 'preview' | 'execute';
  items?: Array<{
    enrollmentId: string;
    prospectId: string;
    channel?: string | null;
    subject?: string | null;
    body?: string | null;
  }>;
};
export type CampaignEnrollmentRow = {
  id: string;
  campaignId: string;
  prospectId: string;
  status: 'queued' | 'active' | 'contacted' | 'replied' | 'failed' | 'opted_out' | 'completed';
  currentStep: number;
  replyStatus: 'none' | 'replied' | 'interested' | 'not_interested';
  messageCount: number;
  lastContactAt?: string | null;
  nextFollowupAt?: string | null;
  lastError?: string | null;
  createdAt?: string;
  prospectName?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  primaryChannel?: string | null;
  contactReadiness?: string | null;
};

export type CampaignListResponse = PaginatedResponse<CampaignRow>;
export type CampaignEnrollmentListResponse = PaginatedResponse<CampaignEnrollmentRow>;
