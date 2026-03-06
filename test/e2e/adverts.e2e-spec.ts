import { INestApplication } from '@nestjs/common';
import { resetUploads } from '../utils/reset-uploads.util';
import { createTestApp } from '../utils/create-test-app.util';
import request from 'supertest';
import { Category } from '@prisma/client';
import jwt from 'jsonwebtoken';
import path from 'path';

describe('AdvertsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdAdvertId: string;
  let otherAdvertId: string;
  let uploadedPhotoId: string;

  beforeAll(async () => {
    resetUploads();
    app = await createTestApp();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'john.doe@email.com', password: '12345678' });
    const advertsRes = await request(app.getHttpServer()).get('/adverts');

    accessToken = loginRes.body.accessToken;

    const loggedUserId = (jwt.decode(accessToken) as any).id;

    otherAdvertId = advertsRes.body.find(
      (advert) => advert.ownerId !== loggedUserId,
    )?.id;

    console.log('NODE_ENV', process.env.NODE_ENV);
    console.log('UPLOAD_DIR', process.env.UPLOAD_DIR);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('getAll()', () => {
    it('should list adverts', async () => {
      const res = await request(app.getHttpServer()).get('/adverts');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter adverts by title', async () => {
      const res = await request(app.getHttpServer()).get(
        '/adverts?title=electrician',
      );

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should filter adverts by multiple fields', async () => {
      const res = await request(app.getHttpServer()).get(
        '/adverts?minPrice=20&maxPrice=40&isOffer=false',
      );

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('getById()', () => {
    it('should return an existing advert by id', async () => {
      const advertsRes = await request(app.getHttpServer()).get('/adverts');
      const advert = advertsRes.body[0];
      const res = await request(app.getHttpServer()).get(
        `/adverts/${advert.id}`,
      );

      expect(advertsRes.status).toBe(200);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(advert.id);
    });

    it('should throw NotFoundException if advert id does not exist', async () => {
      const res = await request(app.getHttpServer()).get(
        '/adverts/a048cbb7-0f3f-482c-95b4-7f633ad8f11d',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('create()', () => {
    it('should create a new advert without photos', async () => {
      const res = await request(app.getHttpServer())
        .post('/adverts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'test advert')
        .field('description', 'lorem ipsum dolor sit')
        .field('price', 10)
        .field('category', Category.CARE)
        .field('isOffer', true);

      createdAdvertId = res.body.id;

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('test advert');
    });

    it('should create a new advert with photos', async () => {
      const res = await request(app.getHttpServer())
        .post('/adverts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'test advert')
        .field('description', 'lorem ipsum dolor sit')
        .field('price', 10)
        .field('category', Category.CARE)
        .field('isOffer', true)
        .attach(
          'photos',
          path.join(__dirname, '../utils/placeholder-image.png'),
        );

      expect(res.status).toBe(201);
      expect(res.body.photos.length).toBe(1);
    });

    it('should reject creating without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/adverts')
        .field('title', 'test advert')
        .field('description', 'lorem ipsum dolor sit')
        .field('price', 10)
        .field('category', Category.CARE)
        .field('isOffer', true);

      expect(res.status).toBe(401);
    });
  });

  describe('update()', () => {
    it('should update owned advert', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/adverts/${createdAdvertId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'updated' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('updated');
    });

    it('should reject updating if advert belongs to another user', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/adverts/${otherAdvertId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'updated' });

      expect(res.status).toBe(401);
    });
  });

  describe('delete()', () => {
    it('should delete owned advert', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/adverts/${createdAdvertId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject deleting if advert belongs to another user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/adverts/${otherAdvertId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(401);
    });
  });
});
