import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp } from '../utils/create-test-app.util';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
