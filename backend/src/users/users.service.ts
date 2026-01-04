import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { CreditsService } from 'src/credits/credits.service';
import { CreditType } from 'src/credits/entities/credits.entity';

@Injectable()
export class UsersService {
  // Logout by clearing the cookie
  async logout(user: User, response: Response) {
    response.clearCookie('Authentication');
    //  await this.redisService.removeActiveSession(user.id);
    return { success: true, message: 'Logged out successfully' };
  }

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly creditsService: CreditsService, 
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Check if user with the same email already exists
    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new (await import('@nestjs/common')).BadRequestException('Email already registered');
    }
    // 1️⃣ Create and save the user
    const user = this.userRepo.create(dto);
    const savedUser = await this.userRepo.save(user);

    // 2️⃣ Give default credits
    await this.creditsService.addCredits(savedUser, CreditType.SCRAPING, 100); // default scraping credits
    await this.creditsService.addCredits(savedUser, CreditType.ENRICHMENT, 50); // default enrichment credits

    return savedUser;
  }


  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);
    await this.userRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.userRepo.delete(id);
  }

  async decrementCredit(id: string, type: 'scraping' | 'enrichment', amount = 1): Promise<User> {
    const user = await this.findOne(id);
    if (type === 'scraping') {
      user.scrapingCredit = Math.max(0, user.scrapingCredit - amount);
    } else {
      user.enrichmentCredit = Math.max(0, user.enrichmentCredit - amount);
    }
    return this.userRepo.save(user);
  }

  async incrementCredit(id: string, type: 'scraping' | 'enrichment', amount = 1): Promise<User> {
    const user = await this.findOne(id);
    if (type === 'scraping') {
      user.scrapingCredit += amount;
    } else {
      user.enrichmentCredit += amount;
    }
    return this.userRepo.save(user);
  }

  // async updatePlan(id: string, planId: string): Promise<User> {
  //   const user = await this.findOne(id);
  //   user.planId = planId;
  //   return this.userRepo.save(user);
  // }
  async resetScrapingCredits(): Promise<void> {
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ scrapingCredit: () => 'scraping_credit_limit' })
      .execute();
  }

  async countUsers(): Promise<number> {
    return this.userRepo.count();
  }

  async getScrapingCredit(userId: string) {
  const user = await this.findOne(userId);
  return this.creditsService.getScrapingLimit(user.id);
}

  async getEnrichmentCredit(id: string): Promise<number> {
    const user = await this.findOne(id);
    return user.enrichmentCredit;
  }
}
