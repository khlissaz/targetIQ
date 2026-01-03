import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('ScrapingController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    // Register and login a user
    const uniqueEmail = `scrapeuser+${Date.now()}-${Math.random()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'testpass', name: 'Scrape User' });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'testpass' });
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/scraping/recent (GET) should return recent scrapings', async () => {
    const res = await request(app.getHttpServer())
      .get('/scraping/recent')
      .set('Authorization', `Bearer ${accessToken}`);
    expect([200, 204]).toContain(res.status);
    expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
  });
});
