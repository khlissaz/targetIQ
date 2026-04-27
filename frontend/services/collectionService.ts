import * as scrapeService from './scrapeService';
import type { ScrapingI, ScrapedLeadDto, LeadI } from '@/lib/types';

// Re-export scrape service functions under "collection"/"collect" names for compatibility
export const fetchCollections = scrapeService.fetchScrapings;
export const fetchCollectionDataByDate = scrapeService.fetchScrapedDataByDate;
export const fetchFilteredCollections = scrapeService.fetchFilteredScrapings;
export const fetchCollectionByMonth = scrapeService.fetchScrapingsByMonth;
export const getCollections = scrapeService.getScrapings;
export const getCollectedLeadsById = scrapeService.getScrapedLeadsById;
export const downloadCollectionCSV = scrapeService.downloadCSV;

export const fetchLeadsForCollection = scrapeService.fetchLeads;
export const fetchLeadsPage = scrapeService.fetchLeadsPerPage;
export const enrichCollectionLeads = scrapeService.enrichLeads;

// Type aliases
export type CollectionI = ScrapingI;
export type CollectedLeadDto = ScrapedLeadDto | LeadI;

export default {
  fetchCollections,
  fetchCollectionDataByDate,
  fetchFilteredCollections,
  fetchCollectionByMonth,
  getCollections,
  getCollectedLeadsById,
  downloadCollectionCSV,
  fetchLeadsForCollection,
  fetchLeadsPage,
  enrichCollectionLeads,
};
