import type { PaginatedResponse } from './common';

export type MessageTemplateRow = {
  id: string;
  businessId: string;
  name: string;
  channel: 'email' | 'phone' | 'linkedin' | 'whatsapp' | 'multi';
  status: 'draft' | 'active' | 'archived';
  subject?: string | null;
  body: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OutreachSequenceRow = {
  id: string;
  businessId: string;
  name: string;
  channel: 'email' | 'phone' | 'linkedin' | 'whatsapp' | 'multi';
  status: 'draft' | 'active' | 'archived';
  stepsJson: OutreachSequenceStep[];
  createdAt?: string;
  updatedAt?: string;
};
export type OutreachSequenceStep = {
  step: number;
  name: string;
  delayDays: number;
};

export type CreateOutreachSequencePayload = {
  name: string;
  channel: 'email' | 'phone' | 'linkedin' | 'whatsapp' | 'multi';
  status: 'draft' | 'active' | 'paused';
  stepsJson: OutreachSequenceStep[];
};

export type MessageTemplateListResponse = PaginatedResponse<MessageTemplateRow>;
export type OutreachSequenceListResponse = PaginatedResponse<OutreachSequenceRow>;
export type UpdateOutreachSequencePayload = Partial<CreateOutreachSequencePayload>;
