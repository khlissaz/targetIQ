import { Test, TestingModule } from '@nestjs/testing';
import { LeadProfileService } from './lead-profile.service';

describe('LeadProfileService', () => {
  let service: LeadProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadProfileService],
    }).compile();
    service = module.get<LeadProfileService>(LeadProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
