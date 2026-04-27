import { LeadI } from '@/lib/types';

export interface LeadFormValues {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  status: string;
  source: string;
  notes: string;
}

export interface CreateLeadPayload {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: string;
  source: string;
  notes: string;
}

export type UpdateLeadPayload = CreateLeadPayload;

export function toCreateLeadPayload(form: LeadFormValues): CreateLeadPayload {
  return {
    full_name: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    company: form.company.trim(),
    position: form.jobTitle.trim(),
    status: form.status || 'new',
    source: form.source.trim(),
    notes: form.notes.trim(),
  };
}

export function toUpdateLeadPayload(form: LeadFormValues): UpdateLeadPayload {
  return toCreateLeadPayload(form);
}

export function emptyLeadForm(): LeadFormValues {
  return {
    fullName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    status: 'new',
    source: '',
    notes: '',
  };
}

export function fromLeadToForm(lead: LeadI): LeadFormValues {
  return {
    fullName: lead.profile?.name || '',
    email: lead.profile?.email ?? '',
    phone: lead.profile?.phone || '',
    company: lead.profile?.company || '',
    jobTitle: lead.profile?.job || '',
    status: lead.status || 'new',
    source: lead.source || '',
    notes: lead.profile?.info || '',
  };
}
