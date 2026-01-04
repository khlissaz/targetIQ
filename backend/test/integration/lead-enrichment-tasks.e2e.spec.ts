import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('LeadEnrichmentTasksController (e2e)', () => {
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
      .send({ email: 'enrichuser@example.com', password: 'testpass', name: 'Enrich User' });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'enrichuser@example.com', password: 'testpass' });
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/lead-enrichment-tasks/getStatusOfProcessingTasks (GET) should return status', async () => {
    const res = await request(app.getHttpServer())
      .get('/lead-enrichment-tasks/getStatusOfProcessingTasks')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
  });
});
