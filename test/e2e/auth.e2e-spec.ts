import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-test-app.util';
import { resetUploads } from '../utils/reset-uploads.util';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    resetUploads();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('signup()', () => {
    it('should signup a new user', async () => {
      const res = await request(app.getHttpServer()).post('/auth/signup').send({
        email: 'new.user@email.com',
        username: 'new user',
        password: '12345678',
        repeatedPassword: '12345678',
        postalCode: '41001',
      });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('new.user@email.com');
    });

    it('should not signup a user with an existing email', async () => {
      const res = await request(app.getHttpServer()).post('/auth/signup').send({
        email: 'john.doe@email.com',
        username: 'duplicated user',
        password: '12345678',
        repeatedPassword: '12345678',
        postalCode: '41001',
      });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already in use');
    });
  });

  describe('login()', () => {
    it('should login an existing user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'john.doe@email.com', password: '12345678' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('should not login with wrong email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@email.com', password: '12345678' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });

    it('should not login with wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'new.user@email.com', password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });
  });
});
