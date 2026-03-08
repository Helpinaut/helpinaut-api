import { INestApplication } from '@nestjs/common';
import { resetUploads } from '../utils/reset-uploads.util';
import { createTestApp } from '../utils/create-test-app.util';
import request from 'supertest';
import { Category } from '@prisma/client';
import jwt from 'jsonwebtoken';
import path from 'path';
import { UploadConfig } from '../../src/config/upload.config';
import fs from 'fs';

describe('AdvertsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdAdvertId: string;
  let otherAdvertId: string;

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

    it('should reject creating a new advert with more than 10 photos', async () => {
      const req = request(app.getHttpServer())
        .post('/adverts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'test advert')
        .field('description', 'lorem ipsum dolor sit')
        .field('price', 10)
        .field('category', Category.CARE)
        .field('isOffer', true);

      for (let i = 0; i < 11; i++) {
        req.attach(
          'photos',
          path.join(__dirname, '../utils/placeholder-image.png'),
        );
      }

      const res = await req;

      expect(res.status).toBe(400);
    });

    it('should reject creating a new advert if a photo exceeds max file size', async () => {
      const imageFile = Buffer.alloc((UploadConfig.MAX_SIZE + 1) * 1024 * 1024);
      const imagePath = path.join(__dirname, '../utils/oversized-image.png');

      fs.writeFileSync(imagePath, imageFile);

      const res = await request(app.getHttpServer())
        .post('/adverts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'test advert')
        .field('description', 'lorem ipsum dolor sit')
        .field('price', 10)
        .field('category', Category.CARE)
        .field('isOffer', true)
        .attach('photos', imagePath);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('File size exceeds');
    });

    it('should rejects creating a new advert if uploaded file is not an image', async () => {
      const file = Buffer.alloc(1 * 1024 * 1024);
      const filePath = path.join(__dirname, '../utils/not-an-image.txt');

      fs.writeFileSync(filePath, file);

      const res = await request(app.getHttpServer())
        .post('/adverts')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('title', 'test advert')
        .field('description', 'lorem ipsum dolor sit')
        .field('price', 10)
        .field('category', Category.CARE)
        .field('isOffer', true)
        .attach('photos', filePath);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid file type');
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

  describe('Photos', () => {
    let uploadedPhotoId: string;
    let advertWithPhotosId: string;

    beforeAll(async () => {
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

      advertWithPhotosId = res.body.id;
    });

    describe('uploadPhoto', () => {
      it('should upload a photo to an existing advert', async () => {
        const res = await request(app.getHttpServer())
          .post(`/adverts/${advertWithPhotosId}/photos`)
          .set('Authorization', `Bearer ${accessToken}`)
          .attach(
            'photos',
            path.join(__dirname, '../utils/placeholder-image.png'),
          );

        uploadedPhotoId = res.body.photos[0].id;

        expect(res.status).toBe(201);
        expect(res.body.photos.length).toBe(2);
      });

      it('should reject uploading photos to a non-existing advert', async () => {
        const res = await request(app.getHttpServer())
          .post('/adverts/a048cbb7-0f3f-482c-95b4-7f633ad8f11d/photos')
          .set('Authorization', `Bearer ${accessToken}`)
          .attach(
            'photos',
            path.join(__dirname, '../utils/placeholder-image.png'),
          );

        expect(res.status).toBe(404);
      });

      it('should reject uploading photos to an advert that belongs to another user', async () => {
        const res = await request(app.getHttpServer())
          .post(`/adverts/${otherAdvertId}/photos`)
          .set('Authorization', `Bearer ${accessToken}`)
          .attach(
            'photos',
            path.join(__dirname, '../utils/placeholder-image.png'),
          );

        expect(res.status).toBe(401);
      });

      it('should reject uploading photos if advert already has 10 photos', async () => {
        const req = request(app.getHttpServer())
          .post('/adverts')
          .set('Authorization', `Bearer ${accessToken}`)
          .field('title', 'test advert')
          .field('description', 'lorem ipsum dolor sit')
          .field('price', 10)
          .field('category', Category.CARE)
          .field('isOffer', true);

        for (let i = 0; i < 10; i++) {
          req.attach(
            'photos',
            path.join(__dirname, '../utils/placeholder-image.png'),
          );
        }

        const advertRes = await req;
        const advertId = advertRes.body.id;

        const res = await request(app.getHttpServer())
          .post(`/adverts/${advertId}/photos`)
          .set('Authorization', `Bearer ${accessToken}`)
          .attach(
            'photos',
            path.join(__dirname, '../utils/placeholder-image.png'),
          );

        expect(res.status).toBe(400);
      });

      it('should reject uploading if a photo exceeds max file size', async () => {
        const imageFile = Buffer.alloc(
          (UploadConfig.MAX_SIZE + 1) * 1024 * 1024,
        );
        const imagePath = path.join(__dirname, '../utils/oversized-image.png');

        fs.writeFileSync(imagePath, imageFile);

        const res = await request(app.getHttpServer())
          .post(`/adverts/${advertWithPhotosId}/photos`)
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('photos', imagePath);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('File size exceeds');
      });

      it('should reject uploading if uploaded file is not an image', async () => {
        const file = Buffer.alloc(1 * 1024 * 1024);
        const filePath = path.join(__dirname, '../utils/not-an-image.txt');

        fs.writeFileSync(filePath, file);

        const res = await request(app.getHttpServer())
          .post(`/adverts/${advertWithPhotosId}/photos`)
          .set('Authorization', `Bearer ${accessToken}`)
          .attach('photos', filePath);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Invalid file type');
      });
    });

    describe('deletePhoto()', () => {
      it('should delete a photo from an existing advert', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/adverts/${advertWithPhotosId}/photos/${uploadedPhotoId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.photos.length).toBe(1);
      });
    });
  });

  describe('Favorites', () => {
    let ownedAdvertId: string;

    beforeAll(async () => {
      const advertsRes = await request(app.getHttpServer()).get('/adverts');

      ownedAdvertId = advertsRes.body[0].id;
    });

    describe('addFavorite()', () => {
      it('should add an advert as favorite', async () => {
        const res = await request(app.getHttpServer())
          .post(`/adverts/${otherAdvertId}/favorites`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(201);
        expect(res.body.isFavorite).toBe(true);
      });

      it('should reject adding an advert as favorite if it belongs to the logged user', async () => {
        const res = await request(app.getHttpServer())
          .post(`/adverts/${ownedAdvertId}/favorites`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(403);
      });
    });

    describe('getFavorites()', () => {
      it('should list adverts marked as favorite', async () => {
        const res = await request(app.getHttpServer())
          .get('/adverts/favorites/me')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
      });
    });

    describe('deleteFavorite()', () => {
      it('should remove advert as favorite', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/adverts/${otherAdvertId}/favorites`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.isFavorite).toBe(false);
      });

      it('should reject deleting an advert as favorite if it was not marked as favorite', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/adverts/${otherAdvertId}/favorites`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(400);
      });
    });
  });
});
