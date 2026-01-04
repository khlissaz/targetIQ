import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeadProfile } from './lead-profile.entity';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LeadProfileService {
  constructor(
    @InjectRepository(LeadProfile)
    private readonly repo: Repository<LeadProfile>,
  ) {}

  async findByProfileLink(link: string, withUsers = false) {
    return this.repo.findOne({
      where: { profileLink: link },
      relations: withUsers ? ['users'] : [],
    });
  }

  async upsertFromDto(dto: any) {
    const { user, ...leadData } = dto;

    // Use phone as profileLink fallback if missing
    if (!leadData.profileLink && leadData.phone) {
      leadData.profileLink = `whatsapp:${leadData.phone}`;
    }

    // Try to find by profileLink first
    let existing = leadData.profileLink
      ? await this.findByProfileLink(leadData.profileLink, !!user)
      : null;

    // If not found, try to find by phone_number
    if (!existing && leadData.phone) {
      existing = await this.repo.findOne({ where: { phone: leadData.phone } });
    }

    if (!existing) {
      // Create new lead and link user if exists
      const created = this.repo.create({
        ...leadData,
        users: user ? [user] : [],
        lastScrapedAt: new Date(),
      });
      const saved = await this.repo.save(created);
      return { lead: saved, isNewLead: true };
    }

    // Update changed fields
    let changed = false;
    const fields = ['name', 'title', 'company', 'job', 'email', 'phone', 'location', 'picture'];
    for (const f of fields) {
      if (leadData[f] && (existing as any)[f] !== leadData[f]) {
        (existing as any)[f] = leadData[f];
        changed = true;
      }
    }

    // Ensure user is linked
    if (user) {
      existing.users ??= [];
      const alreadyLinked = existing.users.some(u => u.id === user.id);
      if (!alreadyLinked) {
        existing.users.push(user);
        changed = true;
      }
    }

    if (changed) {
      existing.lastScrapedAt = new Date();
      const saved = await this.repo.save(existing);
      return { lead: saved, isNewLead: false };
    }

    return { lead: existing, isNewLead: false };
  }
async findByProfileLinkWithFilter(
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

  console.log({ userId, limit, page, take, skip }); // 🧩 Debug log

  const { name, company, title, location } = filterDto || {};

  const qb = this.repo.createQueryBuilder('lead')
    .leftJoin('lead.users', 'user')
    .where('user.id = :userId', { userId });

  if (name) {
    qb.andWhere('LOWER(lead.name) LIKE LOWER(:name)', { name: `%${name}%` });
  }

  if (company) {
    qb.andWhere('LOWER(lead.company) LIKE LOWER(:company)', { company: `%${company}%` });
  }

  if (title) {
    qb.andWhere('LOWER(lead.title) LIKE LOWER(:title)', { title: `%${title}%` });
  }

  if (location) {
    qb.andWhere('LOWER(lead.location) LIKE LOWER(:location)', { location: `%${location}%` });
  }

  // ✅ Use guaranteed numeric values
  qb.skip(skip).take(take).orderBy('lead.lastScrapedAt', 'DESC');

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page: currentPage,
    totalPages: Math.ceil(total / take),
  };
}

}
