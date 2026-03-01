import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { createTestApp } from '../utils/test-app';
import { resetTestDatabase } from '../utils/test-db';
import { resetUploads } from '../utils/test-uploads';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    await resetTestDatabase();
    resetUploads();
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
