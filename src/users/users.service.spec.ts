import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { GeocodingService } from './services/geocoding.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
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

describe('UsersService', () => {
  let service: UsersService;
  let geocoding: GeocodingService;
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
    geocoding = module.get(GeocodingService);
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

    it('should throw BadRequestError if email is already in use', async () => {
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
        BadRequestException,
      );
      await expect(service.create(dto)).rejects.toThrow(
        'Email is already in use',
      );
    });

    it('should throw BadRequestError if username is already in use', async () => {
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
        BadRequestException,
      );
      await expect(service.create(dto)).rejects.toThrow(
        'Username is already in use',
      );
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
});
