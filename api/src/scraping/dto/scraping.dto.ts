import { ScrapedLeadDto } from './scraped-lead.dto';

export class ScrapingDto {
  source: string;
  type: string;
  leads: ScrapedLeadDto[];
  idempotencyKey?: string;
}
