import { Test, TestingModule } from '@nestjs/testing';
import { ScrapingService } from './scraping.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Scraping } from './scraping.entity';
import { LeadProfileService } from '../lead/lead-profile/lead-profile.service';
import { LeadBehaviourService } from '../lead/lead-behaviour/lead-behaviour.service';
import { UsersService } from '../users/users.service';

describe('ScrapingService', () => {
  let service: ScrapingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapingService,
        { provide: getRepositoryToken(Scraping), useValue: {} },
        { provide: LeadProfileService, useValue: {} },
        { provide: LeadBehaviourService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();
    service = module.get<ScrapingService>(ScrapingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
