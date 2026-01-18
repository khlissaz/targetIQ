import { LeadI } from '../../types';
import { scrapeComments } from './scrapeComments';
import { scrapeConnections } from './scrapeConnections';
import { scrapeFollowers } from './scrapeFollowers';
import { scrapeAndScrollReactions } from './scrapeReaction';
import { scrapeSearchPeople } from './scrapeSearchPeople';

/**
 * Supported scraping types across LinkedIn contexts.
 */
export type ScrapeType =
  | 'reactions'
  | 'comments'
  | 'search_persons'
  | 'followers'
  | 'connections';

/**
 * Centralized utility for LinkedIn scraping actions.
 * Each function should return an array of leads (LeadI[]).
 */
export const scrapePeopleUtils: Record<
  ScrapeType,
  (target?: Element | undefined) => Promise<LeadI[]>
> = {
  /**
   * Scrape all people who reacted to a post.
   */
  reactions: async (target?: Element) => {
    console.log('[Scrape] Reactions started...');
     const urn = target?.getAttribute("componentKey") || target?.getAttribute("data-urn");
  
  const postUrl = urn ? `https://www.linkedin.com/feed/update/${urn}` : null;
    const leads = await scrapeAndScrollReactions(postUrl as string, target as HTMLElement);
    console.log(`[Scrape] Found ${leads?.length || 0} reactions`);
    return leads;
  },

  /**
   * Scrape all people who commented on a post.
   */
  comments: async (target?: Element) => {
    console.log('[Scrape] Comments started...');
    const leads = await scrapeComments(target as Element);
    console.log(`[Scrape] Found ${leads?.length || 0} comments`);
    return leads;
  },

  /**
   * Scrape all people who reposted a post.
   */
//   reposts: async (target?: Element) => {
//     console.log('[Scrape] Reposts started...');
//     const leads = await scrapeReposts(target);
//     console.log(`[Scrape] Found ${leads?.length || 0} reposts`);
//     return leads;
//   },

  /**
   * Scrape all people from LinkedIn "People Search" page.
   */
  search_persons: async () => {
    console.log('[Scrape] People search started...');
    const leads = await scrapeSearchPeople();
    console.log(`[Scrape] Found ${leads?.length || 0} search people`);
    return leads;
  },

  /**
   * Scrape followers list (e.g., company or personal followers page).
   */
  followers: async () => {
    console.log('[Scrape] Followers started...');
    const leads = await scrapeFollowers();
    console.log(`[Scrape] Found ${leads?.length || 0} followers`);
    return leads;
  },

  /**
   * Scrape user connections (LinkedIn "My Network" connections page).
   */
  connections: async () => {
    console.log('[Scrape] Connections started...');
    const leads = await scrapeConnections();
    console.log(`[Scrape] Found ${leads?.length || 0} connections`);
    return leads;
  },
};
