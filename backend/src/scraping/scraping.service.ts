import { assignMetadata, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scraping, ScrapingSource, ScrapingType } from './scraping.entity';
import { LeadProfile } from '../lead/lead-profile/lead-profile.entity';
import { LeadBehaviourService } from '../lead/lead-behaviour/lead-behaviour.service';
import { LeadProfileService } from '../lead/lead-profile/lead-profile.service';
import { LeadType } from '../lead/lead-behaviour/enums/lead-type.enum';
import { ReactionType } from '../lead/lead-behaviour/enums/reaction-type.enum';

import { ScrapingDto } from './dto/scraping.dto';
import * as crypto from 'crypto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { CreditsService } from '../credits/credits.service';
import { Inject, forwardRef } from '@nestjs/common';


@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    @InjectRepository(Scraping)
    private readonly scrapingRepo: Repository<Scraping>,
    private readonly leadProfileService: LeadProfileService,
    private readonly behaviourService: LeadBehaviourService,
    private readonly userService:UsersService,
    @Inject(forwardRef(() => CreditsService))
    private readonly creditsService: CreditsService,
  ) {}

  // Find a queued scraping by idempotencyKey (no user association)
  async findQueuedByIdempotencyKey(idempotencyKey: string): Promise<Scraping | null> {
    if (!idempotencyKey) return null;
    return this.scrapingRepo.findOne({ where: { idempotencyKey } as any });
  }

  private sha256Hex(input: string): string {
    return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
  }

  private toReactionType(s?: string): ReactionType | null {
    if (!s) return null;
    const map: Record<string, ReactionType> = {
      LIKE: ReactionType.LIKE,
      LOVE: ReactionType.LOVE,
      CELEBRATE: ReactionType.CELEBRATE,
      INSIGHTFUL: ReactionType.INSIGHTFUL,
      CURIOUS: ReactionType.CURIOUS,
    };
    return map[s.toUpperCase()] || null;
  }

  async ingest(scrapingDto: ScrapingDto, userId: string): Promise<Scraping> {
    this.logger.log('Ingesting scraping DTO');
    const user = await this.userService.findOne(userId);

    // If idempotencyKey provided and a scraping already exists for this user with that key, return it
    if (scrapingDto.idempotencyKey) {
      const existing = await this.scrapingRepo.findOne({ where: { idempotencyKey: scrapingDto.idempotencyKey, user: { id: userId } } as any });
      if (existing) {
        this.logger.log(`Found existing scraping for idempotencyKey=${scrapingDto.idempotencyKey}, returning existing id=${existing.id}`);
        return existing;
      }
    }

    const payloadJson = JSON.stringify(scrapingDto);
    const hash = this.sha256Hex(payloadJson);

    const scraping = this.scrapingRepo.create({
      source: (scrapingDto.source?.toUpperCase() as ScrapingSource) || ScrapingSource.OTHER,
      type: (scrapingDto.type?.toUpperCase() as ScrapingType) || ScrapingType.OTHER,
      name: this.generateScrapingName(),
      user,
      payloadHash: hash,
      idempotencyKey: scrapingDto.idempotencyKey,
    });

    const saved = await this.scrapingRepo.save(scraping);
    this.logger.log(`Saved scraping ${saved.id}`);

    for (const leadDto of scrapingDto.leads ?? []) {
      const upsertResult = await this.leadProfileService.upsertFromDto({
        profileLink: leadDto.profileLink,
        name: leadDto.name,
        title: leadDto.title,
        company: leadDto.company,
        job: leadDto.job,
        email: leadDto.email,
        phone: leadDto.phone,
        location: leadDto.location,
        picture: leadDto.picture,
        user,
      });
      const { lead, isNewLead } = upsertResult as { lead: LeadProfile; isNewLead: boolean };

      const type = leadDto.reactionType ? LeadType.REACTION : leadDto.text ? LeadType.COMMENT : LeadType.COMMENT;

      await this.behaviourService.saveBehaviour({
        profile: lead,
        scraping: saved,
        type: (scrapingDto.type?.toUpperCase() as LeadType) || LeadType.OTHER,
        source: (scrapingDto.source?.toUpperCase() as ScrapingSource) || ScrapingSource.OTHER,
        sourceLink: leadDto.sourceLink,
        text: leadDto.text,
        reactionType: this.toReactionType(leadDto.reactionType),
        user,
      });

      // Decrement scraping credit only for new leads
      if (isNewLead) {
        await this.creditsService.decrementScrapingCredit(userId, 1);
      }
    }

    return saved;
  }

  // Ingest a queued scraping (no associated authenticated user). Idempotency is checked globally.
  async ingestQueued(scrapingDto: ScrapingDto): Promise<Scraping> {
    this.logger.log('Ingesting queued scraping DTO');

    if (scrapingDto.idempotencyKey) {
      const existing = await this.scrapingRepo.findOne({ where: { idempotencyKey: scrapingDto.idempotencyKey } as any });
      if (existing) {
        this.logger.log(`Found existing queued scraping for idempotencyKey=${scrapingDto.idempotencyKey}, returning existing id=${existing.id}`);
        return existing;
      }
    }

    const payloadJson = JSON.stringify(scrapingDto);
    const hash = this.sha256Hex(payloadJson);

    const scraping = this.scrapingRepo.create({
      source: (scrapingDto.source?.toUpperCase() as ScrapingSource) || ScrapingSource.OTHER,
      type: (scrapingDto.type?.toUpperCase() as ScrapingType) || ScrapingType.OTHER,
      name: this.generateScrapingName(),
      payloadHash: hash,
      idempotencyKey: scrapingDto.idempotencyKey,
    });

    const saved = await this.scrapingRepo.save(scraping);
    this.logger.log(`Saved queued scraping ${saved.id}`);

    for (const leadDto of scrapingDto.leads ?? []) {
      const { lead } = await this.leadProfileService.upsertFromDto({
        profileLink: leadDto.profileLink,
        name: leadDto.name,
        title: leadDto.title,
        company: leadDto.company,
        job: leadDto.job,
        email: leadDto.email,
        phone: leadDto.phone,
        location: leadDto.location,
        picture: leadDto.picture,
        user: undefined,
      });

      await this.behaviourService.saveBehaviour({
        profile: lead as LeadProfile,
        scraping: saved,
        type: (scrapingDto.type?.toUpperCase() as LeadType) || LeadType.OTHER,
        source: (scrapingDto.source?.toUpperCase() as ScrapingSource) || ScrapingSource.OTHER,
        sourceLink: leadDto.sourceLink,
        text: leadDto.text,
        reactionType: this.toReactionType(leadDto.reactionType),
        user: undefined,
      });
    }

    return saved;
  }

  async listRecentScrapings(userId?: string, limit = 10) {
  const scrapings = await this.scrapingRepo.find({
    order: { createdAt: 'DESC' },
    take: limit,
    relations: ['user'],
    where: { user: { id: userId } },
  });
 
  return scrapings.map((s) => ({
    id: s.id,
    source: s.source,
    type: s.type,
    name: s.name,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    userId: s.user.id,
  }));
}

 async getRecentScraping(userId: string) {
    if (!userId) return null;
    const scraping = await this.scrapingRepo.findOne({
      order: { createdAt: 'DESC' },
      relations: ['user'],
      where: { user: { id: userId } },
    });
    if (!scraping) return null;
    const leads = await this.getLeadsByScrapingId(scraping.id);
    return { scraping, leads };
  }
  async getLeadsByScrapingId(scrapingId: string) {
    return this.behaviourService.findByScrapingId(scrapingId);
  }

  private generateScrapingName() {
    return `scraping-linkedin-${new Date().toISOString()}`;
  }
}
