import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeadBehaviour } from './lead-behaviour.entity';
import { Repository } from 'typeorm';
import { LeadProfile } from '../lead-profile/lead-profile.entity';
import { Scraping } from '../../scraping/scraping.entity';
import { LeadType } from './enums/lead-type.enum';
import { ReactionType } from './enums/reaction-type.enum';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LeadBehaviourService {
  constructor(
    @InjectRepository(LeadBehaviour)
    private readonly repo: Repository<LeadBehaviour>,
  ) {}

  async saveBehaviour(params: {
    profile: LeadProfile;
    scraping?: Scraping;
    type: LeadType;
    sourceLink?: string;
    source?: string;
    text?: string;
    reactionType?: ReactionType | null;
    user?: User;
    group_name?: string;
  }) {
    const behaviour = this.repo.create({
      profile: params.profile,
      scraping: params.scraping,
      type: params.type,
      sourceLink: params.sourceLink,
      text: params.text,
      reactionType: params.reactionType ?? null,
      user: params.user ?? null,
      group_name: params.group_name ?? null,
    });
    return this.repo.save(behaviour);
  }

  async findByScrapingId(scrapingId: string) {
  return this.repo.find({
    where: { scraping: { id: scrapingId } },
    relations: [
      'profile',          // Include LeadProfile
      'scraping',      // Include Scraping metadata
      'user',          // Include the user who performed the behaviour
    ],
    order: { createdAt: 'DESC' },
  });
}

async findByBehaviourLinkWithFilter(
  userId: string,
  filterDto: any,
  limit?: any,
  page?: any,
) {
  // ✅ Parse safely and fall back to defaults
  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);

  const take = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
  const currentPage = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const skip = (currentPage - 1) * take;

  const { name, company, location } = filterDto || {};

  const qb = this.repo
    .createQueryBuilder('behaviour')
    .leftJoinAndSelect('behaviour.profile', 'profile')
    .leftJoinAndSelect('behaviour.user', 'user')
    .where('user.id = :userId', { userId });

  // ✅ Apply filters dynamically if provided
  if (name) {
    qb.andWhere('LOWER(profile.name) LIKE LOWER(:name)', {
      name: `%${name}%`,
    });
  }

  if (company) {
    qb.andWhere('LOWER(profile.company) LIKE LOWER(:company)', {
      company: `%${company}%`,
    });
  }

  if (location) {
    qb.andWhere('LOWER(profile.location) LIKE LOWER(:location)', {
      location: `%${location}%`,
    });
  }

  // ✅ Correct ordering — use "behaviour" or "profile"
  qb.orderBy('behaviour.createdAt', 'DESC');

  // ✅ Pagination
  qb.skip(skip).take(take);

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page: currentPage,
    totalPages: Math.ceil(total / take),
  };
}

}
