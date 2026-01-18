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
  // Basic Info
  name: string;
  firstname: string;
  lastname: string;
  headline: string;
  location: string;
  about: string;
  profilePicture: string;
  
  // Contact
  email: string;
  phone: string;
  website: string;
  profileLink: string;
  
  // Experience
  experiences: {
    title: string;
    company: string;
    duration: string;
    description: string;
    location: string;
  }[];
  
  // Education
  education: {
    institution: string;
    degree: string;
    field: string;
    duration: string;
  }[];
  
  // Skills
  skills: string[];
  
  // Certifications (including PDF links)
  certifications: {
    name: string;
    issuer: string;
    date: string;
    pdfUrl?: string;
  }[];
  
  // Projects
  projects: {
    title: string;
    description: string;
    url?: string;
  }[];
  
  // Additional PDFs (resumes, portfolios)
  documents: {
    name: string;
    type: 'resume' | 'portfolio' | 'other';
    url: string;
  }[];
}

export type ScrapedLeadDto = LeadI;

export interface LeadI {
  status?: string;
  title?: string;
  name: string;
  text?: string;
  seeMore?: boolean;
  profileLink: string;
  picture?: string;
  reactionType?: string;
  sourceLink: string;
  location?: string;
  caption?: string;
  eventLink?: string;
  company?: string;
  job?: string;
  email?: string | null;
  phone?: string;
  info?: string;
  website?: string;
  websites?: string[];
  twitter?: string;
  ims?: string[];
  about?: string;
  type: string;
  loading?: boolean;
  source?: string;
}
export interface ScrapingI {
  name: string;
  type: string;
  leads: LeadI[];
}

export interface UserI {
  id: string;
  firstname: string;
  lastname: string;
  name: string;
  email: string;
  phoneNo: string;
  company: string;
}
export interface PageInjector {
  mount(): void;
  cleanup(): void;
}
export enum ScrapeType {
  REACTIONS = "REACTIONS",
  COMMENTS = "COMMENTS",
  REPOSTS = "REPOSTS",
  SEARCH_PEOPLE = "SEARCH_PEOPLE",
  FOLLOWERS = "FOLLOWERS",
  CONNECTIONS = "CONNECTIONS",
}
export enum LeadType {
  REACTION = "REACTION",
  COMMENT = "COMMENT",
  REPOST = "REPOST",
  CONNECTION = "CONNECTION",
  FOLLOWER = "FOLLOWER",
  SEARCH_PERSON = "SEARCH_PERSON",
  GROUP_MEMBERSHIP = "GROUP_MEMBERSHIP",
  OTHER = "OTHER",
}