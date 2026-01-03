import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scraping } from './scraping.entity';
import { LeadProfile } from '../lead/lead-profile/lead-profile.entity';
import { LeadBehaviour } from '../lead/lead-behaviour/lead-behaviour.entity';
import { ScrapingService } from './scraping.service';
import { ScrapingController } from './scraping.controller';
import { LeadProfileModule } from '../lead/lead-profile/lead-profile.module';
import { LeadBehaviourModule } from '../lead/lead-behaviour/lead-behaviour.module';
import { UsersModule } from 'src/users/users.module';
import { CreditsModule } from '../credits/credits.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([Scraping, LeadProfile, LeadBehaviour]), LeadProfileModule, LeadBehaviourModule, UsersModule, forwardRef(() => CreditsModule)],
  providers: [ScrapingService],
  controllers: [ScrapingController],
  exports: [ScrapingService],
})
export class ScrapingModule {}
