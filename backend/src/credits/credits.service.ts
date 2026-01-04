import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Credit, CreditType } from './entities/credits.entity';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(Credit)
    private readonly creditRepo: Repository<Credit>,
  ) {}

  async getUserCredits(userId: string): Promise<Credit[]> {
    const result = await this.creditRepo.find({ where: { user: { id: userId } } });
    console.log('User Credits:', result);
    return result
  }

  async addCredits(user: User, type: CreditType, amount: number): Promise<Credit> {
    const credit = this.creditRepo.create({ user, type, amount });
    return this.creditRepo.save(credit);
  }

  async deductCredits(userId: string, type: CreditType, amount: number): Promise<Credit> {
    const credit = await this.creditRepo.findOne({ where: { user: { id: userId }, type } });
    if (!credit) throw new Error('Credit type not found for user');
    credit.amount = Math.max(0, credit.amount - amount);
    return this.creditRepo.save(credit);
  }

  async setCredits(userId: string, type: CreditType, amount: number): Promise<Credit> {
    let credit = await this.creditRepo.findOne({ where: { user: { id: userId }, type } });
    if (!credit) {
      credit = this.creditRepo.create({ user: { id: userId } as User, type, amount });
    } else {
      credit.amount = amount;
    }
    return this.creditRepo.save(credit);
  }
    async getScrapingCredit(userId: string): Promise<Credit | null> {
    return this.creditRepo.findOne({ where: { user: { id: userId }, type: CreditType.SCRAPING } });
  }
  async getEnrichmentCredit(userId: string): Promise<Credit | null> {
    return this.creditRepo.findOne({ where: { user: { id: userId }, type: CreditType.ENRICHMENT } });
  }

  async getScrapingLimit(userId: string): Promise<{ dailyLimit: number; dailyUsage: number }> {
  let credit = await this.creditRepo.findOne({
    where: { user: { id: userId }, type: CreditType.SCRAPING },
    relations: ['user'],
  });

  // If no credit record exists, create one with defaults
  if (!credit) {
    const user = { id: userId } as User;
    credit = this.creditRepo.create({
      user,
      type: CreditType.SCRAPING,
      amount: 100,
      dailyScrapeCount: 0,
      dailyResetDate: new Date(),
    });
    await this.creditRepo.save(credit);
  }

  // reset daily usage if it’s a new day
  const now = new Date();
  if (!credit.dailyResetDate || credit.dailyResetDate.toDateString() !== now.toDateString()) {
    credit.dailyScrapeCount = 0;
    credit.dailyResetDate = now;
    await this.creditRepo.save(credit);
  }

  return {
    dailyLimit: credit.amount,
    dailyUsage: credit.dailyScrapeCount,
  };
}
// Decrement scraping credits, ensuring credits >= 0
  async decrementScrapingCredit(userId: string, amount: number = 1): Promise<Credit> {
    const credit = await this.creditRepo.findOne({ where: { user: { id: userId }, type: CreditType.SCRAPING } });
    if (!credit) throw new Error('Scraping credit not found for user');
    credit.amount = Math.max(0, credit.amount - amount);
    return this.creditRepo.save(credit);
  }

  // Decrement enrichment credits, ensuring credits >= 0
  async decrementEnrichmentCredit(userId: string, amount: number = 1): Promise<Credit> {
    const credit = await this.creditRepo.findOne({ where: { user: { id: userId }, type: CreditType.ENRICHMENT } });
    if (!credit) throw new Error('Enrichment credit not found for user');
    credit.amount = Math.max(0, credit.amount - amount);
    return this.creditRepo.save(credit);
  }

}
