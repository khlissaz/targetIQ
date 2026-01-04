import 'dotenv/config';
import AppDataSource from '../src/data-source';
// using global fetch (Node 18+ or environment with fetch)
import { Scraping } from '../src/scraping/scraping.entity';

async function main() {
  await AppDataSource.initialize();
  const base = process.env.API_URL ?? 'http://localhost:5000';
  const idempotency = 'itest-' + Math.random().toString(36).slice(2, 9);

  const payload = {
    source: 'LINKEDIN',
    type: 'REACTION',
    leads: [{ profileLink: 'u1', name: 'Test' }],
    idempotencyKey: idempotency,
  };

  console.log('Posting first time with idempotencyKey=', idempotency);
  const r1 = await fetch(`${base}/api/scraping/queued`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  console.log('first status', r1.status);
  const j1 = await r1.json();
  console.log('first resp', j1);

  console.log('Posting second time with same idempotencyKey');
  const r2 = await fetch(`${base}/api/scraping/queued`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  console.log('second status', r2.status);
  const j2 = await r2.json();
  console.log('second resp', j2);

  // check DB for how many scrapings exist with that key
  const repo = AppDataSource.getRepository(Scraping);
  const rows = await repo.find({ where: { idempotencyKey: idempotency } as any });
  console.log('rows found', rows.length);
  if (rows.length === 1) {
    console.log('Idempotency test passed');
    process.exit(0);
  } else {
    console.error('Idempotency test failed, found rows=', rows.length);
    process.exit(2);
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
