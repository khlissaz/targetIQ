import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('CreditsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    // Register and login a user
    const uniqueEmail = `credituser+${Date.now()}-${Math.random()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'testpass', name: 'Credit User' });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'testpass' });
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/credits (GET) should return user credits', async () => {
    const res = await request(app.getHttpServer())
      .get('/credits')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c: any) => c.type === 'scraping')).toBe(true);
  });

  it('/credits/scraping-limit (GET) should return scraping limit', async () => {
    const res = await request(app.getHttpServer())
      .get('/credits/scraping-limit')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dailyLimit');
  });
});
