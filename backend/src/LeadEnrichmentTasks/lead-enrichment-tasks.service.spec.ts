import { Test, TestingModule } from '@nestjs/testing';
import { LeadEnrichmentTasksService } from './lead-enrichment-tasks.service';

describe('LeadEnrichmentTasksService', () => {
  let service: LeadEnrichmentTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadEnrichmentTasksService],
    }).compile();
    service = module.get<LeadEnrichmentTasksService>(LeadEnrichmentTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
