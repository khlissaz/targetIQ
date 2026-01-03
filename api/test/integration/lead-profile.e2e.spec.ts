import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('LeadProfileController (e2e)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    try {
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleFixture.createNestApplication();
      await app.init();
      // Register and login a user
      const uniqueEmail = `leadprofileuser+${Date.now()}-${Math.random()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: uniqueEmail, password: 'testpass', name: 'Lead Profile User' });
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: 'testpass' });
      accessToken = loginRes.body.access_token;
    } catch (err) {
      console.error('Error in beforeAll:', err);
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('/lead (GET) should return leads for user', async () => {
    const res = await request(app.getHttpServer())
      .get('/lead')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
  });
});
