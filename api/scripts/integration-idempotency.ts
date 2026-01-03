import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ScrapingService } from '../src/scraping/scraping.service';
import AppDataSource from '../src/data-source';

async function main() {
  await AppDataSource.initialize();
  const app = await NestFactory.createApplicationContext(AppModule);
  const scrapingService = app.get(ScrapingService);

  const idempotency = 'itest-' + Math.random().toString(36).slice(2,9);
  const payload = {
    source: 'LINKEDIN',
    type: 'REACTION',
    leads: [{ profileLink: 'u1', name: 'Test' }],
    idempotencyKey: idempotency,
  } as any;

  console.log('Calling ingestQueued first time with idempotencyKey=', idempotency);
  const r1 = await scrapingService.ingestQueued(payload);
  console.log('first saved id', r1.id);

  console.log('Calling ingestQueued second time with same idempotencyKey');
  const r2 = await scrapingService.ingestQueued(payload);
  console.log('second returned id', r2.id);

  if (r1.id === r2.id) {
    console.log('Idempotency test passed');
    process.exit(0);
  } else {
    console.error('Idempotency test failed: ids differ', r1.id, r2.id);
    process.exit(2);
  }
}

main().catch((e) => { console.error(e); process.exit(2); });