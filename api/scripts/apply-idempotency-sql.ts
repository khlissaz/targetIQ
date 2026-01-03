import AppDataSource from '../src/data-source';

async function main() {
  await AppDataSource.initialize();
  const queries = [
    `ALTER TABLE "scrapings" ADD COLUMN IF NOT EXISTS "idempotency_key" character varying;`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_SCRAPING_IDEMPOTENCY" ON "scrapings" ("idempotency_key");`,
  ];
  for (const q of queries) {
    console.log('Executing:', q);
    await AppDataSource.query(q);
  }
  console.log('Done');
  await AppDataSource.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });