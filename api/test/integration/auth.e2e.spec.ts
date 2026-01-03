import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) should register a user', async () => {
    const uniqueEmail = `testuser+${Date.now()}-${Math.random()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'testpass', name: 'Test User' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
  });

  it('/auth/login (POST) should login a user', async () => {
    const uniqueEmail = `loginuser+${Date.now()}-${Math.random()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: uniqueEmail, password: 'testpass', name: 'Login User' });
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: uniqueEmail, password: 'testpass' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('access_token');
  });
});
