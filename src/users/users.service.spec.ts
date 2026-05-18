import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { GeocodingService } from './services/geocoding.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { OwnerDetailsEntity } from './entities/owner.entity';
import { AdvertEntity } from 'src/adverts/entities/advert.entity';
import { UserEntity } from './entities/user.entity';
import { FavoriteEntity } from 'src/adverts/entities/favorite.entity';

const prismaMock = {
  user: {
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirstOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  advert: {
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
  },
  photo: {
    deleteMany: jest.fn(),
  },
  favorite: {
    deleteMany: jest.fn(),
  },
  $transaction: (fn) => fn(prismaMock),
};

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('fs/promises', () => ({ unlink: jest.fn() }));

describe('UsersService', () => {
  let service: UsersService;
  let geocoding: jest.Mocked<GeocodingService>;
  let prisma: typeof prismaMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: GeocodingService,
          useValue: {
            fromPostalCode: jest
              .fn()
              .mockResolvedValue({ latitude: 37.38, longitude: -5.99 }),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    geocoding = module.get(GeocodingService) as jest.Mocked<GeocodingService>;
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should create a user with hashed password', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: '123',
        email: 'test@email.com',
        username: 'test',
        password: 'hashed-password',
        postalCode: '41001',
        latitude: 37.38,
        longitude: -5.99,
      });

      const dto = {
        email: 'test@email.com',
        username: 'test',
        password: '12345678',
        postalCode: '41001',
      };

      const result = await service.create(dto);

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.id).toBe('123');
    });

    it('should throw ConflictException if email is already in use', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'existing',
        email: 'user@email.com',
        username: 'other',
      });

      const dto = {
        email: 'user@email.com',
        username: 'user',
        password: '12345678',
        postalCode: '41001',
      };

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(service.create(dto)).rejects.toMatchObject({
        response: {
          code: 'UNIQUE_FIELD_CONFLICT',
          message: 'Field is already in use',
          field: 'email',
        },
      });
    });

    it('should throw ConflictException if username is already in use', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'existing',
        email: 'other@email.com',
        username: 'user',
      });

      const dto = {
        email: 'user@email.com',
        username: 'user',
        password: '12345678',
        postalCode: '41001',
      };

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(service.create(dto)).rejects.toMatchObject({
        response: {
          code: 'UNIQUE_FIELD_CONFLICT',
          message: 'Field is already in use',
          field: 'username',
        },
      });
    });
  });

  describe('getById()', () => {
    it('should return a public user profile with adverts mapped to AdvertEntity', async () => {
      prismaMock.user.findUniqueOrThrow.mockResolvedValue({
        id: '123',
        email: 'test@email.com',
        username: 'test',
        postalCode: '41001',
        latitude: 37.38,
        longitude: -5.99,
        createdAt: new Date(),
        updatedAt: new Date(),
        adverts: [
          {
            id: 'a1',
            title: 'Test advert',
            description: 'Desc',
            price: 10,
            category: 'CARE',
            isOffer: true,
            status: 'ACTIVE',
            photos: [{ id: 'p1', url: '/uploads/test.jpg' }],
            _count: { favorites: 3 },
            latitude: 37.38,
            longitude: -5.99,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const result = await service.getById('123');

      expect(prismaMock.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: '123' },
        include: {
          adverts: {
            include: {
              photos: true,
              _count: { select: { favorites: true } },
            },
          },
        },
      });

      expect(result).toBeInstanceOf(OwnerDetailsEntity);
      expect(result.username).toBe('test');
      expect(result.adverts[0]).toBeInstanceOf(AdvertEntity);
      expect(result.advertsCount).toBe(1);
    });

    it('should throw if user does not exist', async () => {
      prismaMock.user.findUniqueOrThrow.mockRejectedValue(
        new Error('Not found'),
      );

      await expect(service.getById('missing')).rejects.toThrow('Not found');
    });
  });

  describe('getMe()', () => {
    it('should return the authenticated user with adverts and favorites mapped correctly', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        id: '123',
        email: 'test@email.com',
        username: 'test',
        postalCode: '41001',
        latitude: 37.38,
        longitude: -5.99,
        createdAt: new Date(),
        updatedAt: new Date(),
        adverts: [
          {
            id: 'a1',
            title: 'Test advert',
            description: 'Desc',
            price: 10,
            category: 'CARE',
            isOffer: true,
            status: 'ACTIVE',
            photos: [{ id: 'p1', url: '/uploads/test.jpg' }],
            _count: { favorites: 3 },
            latitude: 37.38,
            longitude: -5.99,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        favorites: [
          {
            id: 'f1',
            userId: '345',
            advertId: 'a2',
            createdAt: new Date(),
          },
        ],
      });

      const result = await service.getMe('123');

      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: '123' },
        include: {
          adverts: {
            include: {
              photos: true,
              _count: { select: { favorites: true } },
            },
          },
          favorites: true,
        },
      });

      expect(result).toBeInstanceOf(UserEntity);
      expect(result.adverts[0]).toBeInstanceOf(AdvertEntity);
      expect(result.favorites[0]).toBeInstanceOf(FavoriteEntity);
      expect(result.adverts[0].favoriteCount).toBe(3);
    });

    it('should throw if user does not exist', async () => {
      prisma.user.findUniqueOrThrow.mockImplementation(() => {
        throw new Error('Not found');
      });

      await expect(service.getMe('missing')).rejects.toThrow('Not found');
    });
  });

  describe('update()', () => {
    it('should update user and hash password if provided', async () => {
      const assertUniqueCredentials = jest
        .spyOn<any, any>(service, 'assertUniqueCredentials')
        .mockResolvedValue(undefined);

      prisma.user.update.mockResolvedValue({
        id: '123',
        email: 'test@email.com',
        username: 'test',
        password: 'hashed-password',
        postalCode: '41001',
        latitude: 37.38,
        longitude: -5.99,
      });

      const dto = {
        email: 'new@email.com',
        password: 'new-password',
      };

      const result = await service.update('123', dto);

      expect(assertUniqueCredentials).toHaveBeenCalledWith(
        'new@email.com',
        undefined,
        '123',
      );
      expect(require('bcrypt').hash).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          email: 'new@email.com',
          password: 'hashed-password',
        },
      });
      expect(result).toBeInstanceOf(UserEntity);
    });

    it('should update user without calling assertUniqueCredentials or hashing password', async () => {
      const assertUniqueCredentials = jest
        .spyOn<any, any>(service, 'assertUniqueCredentials')
        .mockResolvedValue(undefined);

      prisma.user.update.mockResolvedValue({
        id: '123',
        email: 'test@email.com',
        username: 'test',
        password: 'unchanged',
      });

      const dto = {};

      const result = await service.update('123', dto);

      expect(assertUniqueCredentials).not.toHaveBeenCalled();
      expect(require('bcrypt').hash).not.toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {},
      });
      expect(result).toBeInstanceOf(UserEntity);
    });

    it('should throw BadRequestException if email is already in use', async () => {
      jest
        .spyOn<any, any>(service, 'assertUniqueCredentials')
        .mockRejectedValue(new BadRequestException('Email is already in use'));

      const dto = { email: 'duplicated@email.com' };

      await expect(service.update('123', dto)).rejects.toThrow(
        'Email is already in use',
      );
    });

    it('should throw BadRequestException if username is already in use', async () => {
      jest
        .spyOn<any, any>(service, 'assertUniqueCredentials')
        .mockRejectedValue(
          new BadRequestException('Username is already in use'),
        );

      const dto = { username: 'taken' };

      await expect(service.update('123', dto)).rejects.toThrow(
        'Username is already in use',
      );
    });
  });

  describe('delete()', () => {
    it('should delete user, adverts, photos and favorites correctly', async () => {
      const unlink = require('fs/promises').unlink;

      prisma.user.findFirstOrThrow.mockResolvedValue({
        id: '123',
        favorites: [{ id: 'f1' }],
        adverts: [
          {
            id: 'a1',
            photos: [
              { id: 'p1', url: '/uploads/photo1.jpg' },
              { id: 'p2', url: '/uploads/photo2.jpg' },
            ],
            favorites: [{ id: 'fa1' }],
          },
        ],
      });

      prisma.user.delete.mockResolvedValue({
        id: '123',
        email: 'test@email.com',
        username: 'test',
      });

      const result = await service.delete('123');

      expect(prisma.user.findFirstOrThrow).toHaveBeenCalled();
      expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
        where: { userId: '123' },
      });
      expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
        where: { advertId: { in: ['a1'] } },
      });
      expect(unlink).toHaveBeenCalledTimes(2);
      expect(prisma.photo.deleteMany).toHaveBeenCalledWith({
        where: { advertId: 'a1' },
      });
      expect(prisma.advert.deleteMany).toHaveBeenCalledWith({
        where: { ownerId: '123' },
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
      expect(result).toBeInstanceOf(UserEntity);
    });

    it('should delete user even if they have no adverts', async () => {
      const unlink = require('fs/promises').unlink;

      prisma.user.findFirstOrThrow.mockResolvedValue({
        id: '123',
        favorites: [],
        adverts: [],
      });

      prisma.user.delete.mockResolvedValue({
        id: '123',
        email: 'test@email.com',
        username: 'test',
      });

      const result = await service.delete('123');

      expect(unlink).not.toHaveBeenCalled();
      expect(prisma.photo.deleteMany).not.toHaveBeenCalled();
      expect(prisma.advert.deleteMany).toHaveBeenCalledWith({
        where: { ownerId: '123' },
      });
      expect(result).toBeInstanceOf(UserEntity);
    });

    it('should handle unlink errors', async () => {
      const unlink = require('fs/promises').unlink;
      const log = jest.spyOn(console, 'log').mockImplementation(() => {});

      unlink.mockRejectedValue(new Error('File not found'));

      prisma.user.findFirstOrThrow.mockResolvedValue({
        id: '123',
        favorites: [],
        adverts: [
          {
            id: 'a1',
            photos: [{ id: 'p1', url: '/uploads/photo1.jpg' }],
            favorites: [],
          },
        ],
      });

      prisma.user.delete.mockResolvedValue({
        id: '123',
        email: 'test@email.com',
        username: 'test',
      });

      const result = await service.delete('123');

      expect(unlink).toHaveBeenCalled();
      expect(log).toHaveBeenCalled();
      expect(result).toBeInstanceOf(UserEntity);
    });

    it('should throw if user does not exist', async () => {
      prisma.user.findFirstOrThrow.mockImplementation(() => {
        throw new Error('Not found');
      });

      await expect(service.delete('missing')).rejects.toThrow('Not found');
    });
  });

  describe('updateLocation()', () => {
    it('should update user and adverts with new coordinates', async () => {
      prisma.user.update.mockResolvedValue({});
      prisma.advert.updateMany.mockResolvedValue({});

      const dto = { postalCode: '41001' };

      const result = await service.updateLocation('123', dto);

      expect(geocoding.fromPostalCode).toHaveBeenCalledWith('41001');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          postalCode: '41001',
          latitude: 37.38,
          longitude: -5.99,
        },
      });
      expect(prisma.advert.updateMany).toHaveBeenCalledWith({
        where: { ownerId: '123' },
        data: {
          latitude: 37.38,
          longitude: -5.99,
        },
      });
      expect(result).toEqual({ message: 'Location successfully updated' });
    });

    it('should throw if geocoding service fails', async () => {
      geocoding.fromPostalCode.mockRejectedValue(new Error('Geocoding failed'));

      const dto = { postalCode: '41001' };

      await expect(service.updateLocation('123', dto)).rejects.toThrow(
        'Geocoding failed',
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.advert.updateMany).not.toHaveBeenCalled();
    });
  });
});
