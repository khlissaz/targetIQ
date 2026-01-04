import { Test, TestingModule } from '@nestjs/testing';
import { LeadBehaviourService } from './lead-behaviour.service';

describe('LeadBehaviourService', () => {
  let service: LeadBehaviourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadBehaviourService],
    }).compile();
    service = module.get<LeadBehaviourService>(LeadBehaviourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
