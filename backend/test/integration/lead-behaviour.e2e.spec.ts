import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('LeadBehaviourController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    // Register and login a user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'leadbehaviouruser@example.com', password: 'testpass', name: 'Lead Behaviour User' });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'leadbehaviouruser@example.com', password: 'testpass' });
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/leads (GET) should return lead behaviours for user', async () => {
    const res = await request(app.getHttpServer())
      .get('/leads')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
  });
});
