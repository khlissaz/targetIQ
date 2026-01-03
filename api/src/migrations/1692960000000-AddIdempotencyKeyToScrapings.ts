import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdempotencyKeyToScrapings1692960000000 implements MigrationInterface {
  name = 'AddIdempotencyKeyToScrapings1692960000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scrapings" ADD COLUMN "idempotency_key" character varying`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_SCRAPING_IDEMPOTENCY" ON "scrapings" ("idempotency_key")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_SCRAPING_IDEMPOTENCY"`);
    await queryRunner.query(`ALTER TABLE "scrapings" DROP COLUMN "idempotency_key"`);
  }
}
