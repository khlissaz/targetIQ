import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    // Register and login a user
    const uniqueEmail = `user1+${Date.now()}-${Math.random()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'testpass', name: 'User1' });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'testpass' });
    accessToken = loginRes.body.access_token;
    userId = loginRes.body.user?.id || '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET) should return all users', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/users/me (GET) should return current user', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });
});
