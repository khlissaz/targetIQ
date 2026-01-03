import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { getConnection } from 'typeorm';
import { ScrapingService } from '../../src/scraping/scraping.service';

describe('Scraping idempotency (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('should insert only once when calling service with same idempotency key', async () => {
    const scrapingService = app.get(ScrapingService) as ScrapingService;

    const payload = {
      idempotencyKey: 'itest-jest-123',
      source: 'LINKEDIN',
      type: 'OTHER',
      leads: [{ name: 'Test Lead', profileLink: 'https://linkedin.com/in/test' }],
    };

    const first = await scrapingService.ingestQueued(payload as any);
    expect(first).toBeDefined();
    expect(first.id).toBeDefined();

    const second = await scrapingService.ingestQueued(payload);
    expect(second).toBeDefined();
    expect(second.id).toEqual(first.id);
  }, 30000);
});
