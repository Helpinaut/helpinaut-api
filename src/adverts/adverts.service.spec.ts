jest.mock('./adverts.helper');

import { Test, TestingModule } from '@nestjs/testing';
import { AdvertsService } from './adverts.service';
import * as helper from './adverts.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdvertsMapper } from './adverts.mapper';
import { Category } from '@prisma/client';

const prismaMock = {
  user: {
    findUniqueOrThrow: jest.fn(),
  },
  advert: {
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  photo: {
    deleteMany: jest.fn(),
  },
  favorite: {
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

const mapperMock = {
  toAdvertSummaryEntity: jest.fn(),
  toAdvertDetailsEntity: jest.fn(),
};

jest.mock('fs/promises', () => ({ unlink: jest.fn() }));

describe('AdvertsService', () => {
  let service: AdvertsService;
  let prisma: typeof prismaMock;
  let mapper: typeof mapperMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AdvertsMapper, useValue: mapperMock },
      ],
    }).compile();

    service = module.get(AdvertsService);
    prisma = module.get(PrismaService);
    mapper = module.get(AdvertsMapper);

    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  describe('create()', () => {
    it('should create an adverts and return mapped details', async () => {
      const dto = {
        title: 'test advert',
        description: 'lorem ipsum dolor sit',
        price: 10,
        category: Category.CARE,
        isOffer: true,
      };

      const ownerId = '123';
      const photoPaths = ['/uploads/photo1.jpg', '/uploads/photo2.jpg'];

      prisma.user.findUniqueOrThrow.mockResolvedValue({
        latitude: 37.38,
        longitude: -5.99,
      });

      prisma.advert.create.mockResolvedValue({
        id: 'a1',
        ...dto,
        photos: photoPaths.map((url) => ({ url })),
        owner: {
          id: ownerId,
          username: 'test',
          postalCode: '41001',
          createdAt: new Date(),
          _count: { adverts: 3 },
        },
        _count: { favorites: 0 },
      });

      mapper.toAdvertDetailsEntity.mockResolvedValue('mapped advert');

      const result = await service.create(dto, ownerId, photoPaths);

      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: ownerId },
        select: { latitude: true, longitude: true },
      });
      expect(mapper.toAdvertDetailsEntity).toHaveBeenCalledWith(
        expect.any(Object),
        { isOwner: true, isFavorite: false },
      );
      expect(result).toBe('mapped advert');
    });

    it('should throw if user has no location set', async () => {
      const dto = {
        title: 'test advert',
        description: 'lorem ipsum dolor sit',
        price: 10,
        category: Category.CARE,
        isOffer: true,
      };

      const ownerId = '123';

      prisma.user.findUniqueOrThrow.mockResolvedValue({
        latitude: null,
        longitude: null,
      });

      await expect(service.create(dto, ownerId, [])).rejects.toThrow();
    });

    it('should throw if advert creation fails', async () => {
      const dto = {
        title: 'test advert',
        description: 'lorem ipsum dolor sit',
        price: 10,
        category: Category.CARE,
        isOffer: true,
      };

      const ownerId = '123';

      prisma.user.findUniqueOrThrow.mockResolvedValue({
        latitude: 37.38,
        longitude: -5.99,
      });

      prisma.advert.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(dto, ownerId, [])).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getAll()', () => {
    it('should retrieve adverts, map them and return summary entities', async () => {
      const filters = {};
      const userId = '123';

      (helper.getPagination as jest.Mock).mockReturnValue({
        limit: 10,
        offset: 0,
      });
      (helper.resolveCoordinates as jest.Mock).mockResolvedValue(null);

      prisma.$queryRaw.mockResolvedValue([
        {
          id: 'a1',
          ownerId: '123',
          ownerUsername: 'test',
          thumbnailUrl: '/uploads/photo1.jpg',
          isFavorite: false,
          favoriteCount: 3,
          distance: null,
        },
        {
          id: 'a2',
          ownerId: '345',
          ownerUsername: 'other',
          thumbnailUrl: '/uploads/photo2.jpg',
          isFavorite: true,
          favoriteCount: 5,
          distance: 12.5,
        },
      ]);

      mapper.toAdvertSummaryEntity
        .mockReturnValueOnce('mapped advert 1')
        .mockReturnValueOnce('mapped advert 2');

      const result = await service.getAll(userId, filters);

      expect(helper.getPagination).toHaveBeenCalledWith(filters);
      expect(helper.resolveCoordinates).toHaveBeenCalledWith(
        userId,
        filters,
        prisma,
      );
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(mapper.toAdvertSummaryEntity).toHaveBeenCalledTimes(2);
      expect(mapper.toAdvertSummaryEntity).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a1' }),
        expect.objectContaining({
          isOwner: true,
          isFavorite: false,
          favoriteCount: 3,
          distance: null,
        }),
      );
      expect(mapper.toAdvertSummaryEntity).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a2' }),
        expect.objectContaining({
          isOwner: false,
          isFavorite: true,
          favoriteCount: 5,
          distance: 12.5,
        }),
      );
      expect(result).toEqual(['mapped advert 1', 'mapped advert 2']);
    });

    it('should pass popular=true to getAdvertsRaw when filters.popular is true', async () => {
      const filters = { popular: true };
      const userId = '123';

      (helper.getPagination as jest.Mock).mockReturnValue({
        limit: 10,
        offset: 0,
      });
      (helper.resolveCoordinates as jest.Mock).mockResolvedValue(null);

      prisma.$queryRaw.mockResolvedValue([]);

      await service.getAll(userId, filters);

      expect(prisma.$queryRaw).toHaveBeenCalled();
      const callArgs = prisma.$queryRaw.mock.calls[0][0].values;
      expect(filters.popular).toBe(true);
    });

    it('should apply distance filter when maxDistance is provided', async () => {
      const filters = { maxDistance: 30 };
      const userId = '123';

      (helper.getPagination as jest.Mock).mockReturnValue({
        limit: 10,
        offset: 0,
      });
      (helper.resolveCoordinates as jest.Mock).mockResolvedValue({
        latitude: 37.38,
        longitude: -5.99,
      });

      prisma.$queryRaw.mockResolvedValue([]);

      await service.getAll(userId, filters);

      expect(helper.resolveCoordinates).toHaveBeenCalledWith(
        userId,
        filters,
        prisma,
      );
      expect(prisma.$queryRaw).toHaveBeenCalled();
      const sql = prisma.$queryRaw.mock.calls[0][0].sql;
      expect(sql).toContain('<=');
    });

    it('should handle unauthenticated users (userId = null)', async () => {
      const filters = {};

      (helper.getPagination as jest.Mock).mockReturnValue({
        limit: 10,
        offset: 0,
      });
      (helper.resolveCoordinates as jest.Mock).mockResolvedValue(null);

      prisma.$queryRaw.mockResolvedValue([
        {
          id: 'a1',
          ownerId: '123',
          isFavorite: false,
          favoriteCount: 2,
          distance: null,
        },
      ]);

      mapper.toAdvertSummaryEntity.mockReturnValue('mapped advert');

      const result = await service.getAll(null, filters);

      expect(helper.resolveCoordinates).toHaveBeenCalledWith(
        null,
        filters,
        prisma,
      );
      expect(mapper.toAdvertSummaryEntity).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'a1' }),
        expect.objectContaining({
          isOwner: false,
          isFavorite: false,
          favoriteCount: 2,
          distance: null,
        }),
      );
      expect(result).toEqual(['mapped advert']);
    });

    it('should return an empty array when no adverts are found', async () => {
      const filters = {};
      const userId = '123';

      (helper.getPagination as jest.Mock).mockReturnValue({
        limit: 10,
        offset: 0,
      });
      (helper.resolveCoordinates as jest.Mock).mockResolvedValue(null);

      prisma.$queryRaw.mockResolvedValue([]);

      const result = await service.getAll(userId, filters);

      expect(mapper.toAdvertSummaryEntity).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('getById()', () => {
    it('should return advert details mapped correctly when user is owner', async () => {
      const advert = {
        id: 'a1',
        ownerId: '123',
        owner: {
          id: '123',
          username: 'test',
          postalCode: '41001',
          createdAt: new Date(),
          _count: { adverts: 3 },
        },
        photos: [{ url: '/uploads/photo1.jpg' }],
        views: 10,
        _count: { favorites: 2 },
      };

      prisma.advert.findUniqueOrThrow.mockResolvedValue(advert);
      prisma.favorite.findUnique.mockResolvedValue(null);
      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      const result = await service.getById('a1', '123');

      expect(prisma.advert.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'a1' },
        include: expect.any(Object),
      });
      expect(prisma.advert.update).not.toHaveBeenCalled();
      expect(mapper.toAdvertDetailsEntity).toHaveBeenCalledWith(advert, {
        isOwner: true,
        isFavorite: false,
      });
      expect(result).toBe('mapped advert');
    });

    it('should increase advert views when user is not the owner', async () => {
      const advert = {
        id: 'a1',
        ownerId: '123',
        owner: {
          id: '123',
          username: 'test',
          postalCode: '41001',
          createdAt: new Date(),
          _count: { adverts: 3 },
        },
        photos: [],
        views: 5,
        _count: { favorites: 0 },
      };

      prisma.advert.findUniqueOrThrow.mockResolvedValue({ ...advert });
      prisma.favorite.findUnique.mockResolvedValue(null);
      prisma.advert.update.mockResolvedValue({});
      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      const result = await service.getById('a1', '345');

      expect(prisma.advert.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { views: { increment: 1 } },
      });
      expect(mapper.toAdvertDetailsEntity).toHaveBeenCalledWith(
        expect.objectContaining({ views: 6 }),
        expect.objectContaining({ isOwner: false }),
      );
      expect(result).toBe('mapped advert');
    });

    it('should not increase advert views when user is the owner', async () => {
      const advert = {
        id: 'a1',
        ownerId: '123',
        owner: {
          id: '123',
          username: 'test',
          postalCode: '41001',
          createdAt: new Date(),
          _count: { adverts: 3 },
        },
        photos: [],
        views: 5,
        _count: { favorites: 0 },
      };

      prisma.advert.findUniqueOrThrow.mockResolvedValue(advert);
      prisma.favorite.findUnique.mockResolvedValue(null);
      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      await service.getById('a1', '123');

      expect(prisma.advert.update).not.toHaveBeenCalled();
    });

    it('should mark advert as favorite when favorite exists', async () => {
      const advert = {
        id: 'a1',
        ownerId: '123',
        owner: {
          id: '123',
          username: 'test',
          postalCode: '41001',
          createdAt: new Date(),
          _count: { adverts: 3 },
        },
        photos: [],
        views: 5,
        _count: { favorites: 1 },
      };

      prisma.advert.findUniqueOrThrow.mockResolvedValue(advert);
      prisma.favorite.findUnique.mockResolvedValue({ id: 'f1' });
      prisma.advert.update.mockResolvedValue({});
      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      await service.getById('a1', '123');

      expect(mapper.toAdvertDetailsEntity).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ isFavorite: true }),
      );
    });

    it('should treat advert as not favorite and not owner when userId is null', async () => {
      const advert = {
        id: 'a1',
        ownerId: '123',
        owner: {
          id: '123',
          username: 'test',
          postalCode: '41001',
          createdAt: new Date(),
          _count: { adverts: 3 },
        },
        photos: [],
        views: 5,
        _count: { favorites: 0 },
      };

      prisma.advert.findUniqueOrThrow.mockResolvedValue(advert);
      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      await service.getById('a1', null);

      expect(prisma.favorite.findUnique).not.toHaveBeenCalled();
      expect(mapper.toAdvertDetailsEntity).toHaveBeenCalledWith(
        expect.any(Object),
        { isOwner: false, isFavorite: false },
      );
    });

    it('should throw if advert does not exist', async () => {
      prisma.advert.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

      await expect(service.getById('a1', '123')).rejects.toThrow('Not found');
    });
  });
});
