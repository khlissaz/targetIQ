// types.ts

export interface Reaction {
  name: string;
  profileLink: string;
  picture: string;
  caption: string;
  reactionType: string;
  postLink: string;
}
export interface LinkedInProfileData {
  name: string;
  firstname: string;
  lastname: string;
  headline: string;
  location: string;
  about: string;
  profilePicture: string;
  email: string;
  phone: string;
  website: string;
  profileLink: string;
  experiences: {
    title: string;
    company: string;
    duration: string;
    description: string;
    location: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    duration: string;
  }[];
  skills: string[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
    pdfUrl?: string;
  }[];
  projects: {
    title: string;
    description: string;
    url?: string;
  }[];
  documents: {
    name: string;
    type: 'resume' | 'portfolio' | 'other';
    url: string;
  }[];
}

export type ScrapedLeadDto = LeadI;

export interface LeadI {
  id: string;
  status?: string;
  title?: string;
  profile: {
    name: string;
    firstname?: string;
    lastname?: string;
    picture: string;
    profileLink: string;
    company?: string;
    job?: string;
    email?: string | null;
    phone?: string;
    info?: string;
    location?: string;
    caption?: string;
    website?: string;
    websites?: string[];
    twitter?: string;
    ims?: string[];
    about?: string;
  };
  text?: string;
  seeMore?: boolean;
  reactionType?: string;
  sourceLink: string;
  eventLink?: string;
  type: string;
  loading?: boolean;
  source?: string;
  createdAt?: string;
}
export interface ScrapingI {
  id?: string;
  name: string;
  type: string;
  items: LeadI[];
  totalLeads?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CollectionI = ScrapingI;
export type CollectedLeadDto = ScrapedLeadDto;

export interface UserI {
  id: string;
  firstname: string;
  lastname: string;
  name: string;
  email: string;
  phoneNo: string;
  company: string;
}
export interface EnrichmentResultI {
  email?: string;
  phone?: string;
  profileLink?: string;
  company?: {
    website?: string;
    industry?: string;
    size?: string;
  };
}
export interface GetEnrichmentTasksStatusI {
  leadId: string;
  status: 'pending' | 'success' | 'failed' | 'error';
  email?: string;
  phone?: string;
  name?: string;
  requestedFields?: Array<'email' | 'phone'>;
  message?: string;
}
export interface StartLeadEnrichmentI {
  taskId: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'enriched' | 'converted' | 'pending' | 'success' | 'error' | 'failed' | 'terminated';
  step: 'step0' | 'step1' | 'step2';
  source: 'DataBase' | 'FullEnrich' | null;
  email: string | null;
  phone?: string | null;
  requestedFields?: Array<'email' | 'phone'>;
  cacheHit?: boolean;
  message: string;
  enrichmentRequestId: string | null;
  creditsUsed?: number | null;
}
export interface EnrichmentTaskI {
  leadId: string;
  status: 'new' | 'contacted' | 'qualified' | 'enriched' | 'converted' | 'pending' | 'success' | 'error' | 'failed' | 'terminated';
  message?: string;
  email?: string;
  phone?: string;
  name: string;
  requestedFields?: Array<'email' | 'phone'>;
  creditsUsed?: number | null;
}
