import { Test } from '@nestjs/testing';
import { FavoritesService } from './favorites.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdvertsMapper } from '../adverts.mapper';

const prismaMock = {
  favorite: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  advert: {
    findUniqueOrThrow: jest.fn(),
  },
};

const mapperMock = {
  toAdvertSummaryEntity: jest.fn(),
  toAdvertDetailsEntity: jest.fn(),
};

describe('FavoritesService', () => {
  let service: FavoritesService;
  let prisma: typeof prismaMock;
  let mapper: typeof mapperMock;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AdvertsMapper, useValue: mapperMock },
      ],
    }).compile();

    service = module.get(FavoritesService);
    prisma = module.get(PrismaService);
    mapper = module.get(AdvertsMapper);

    jest.resetAllMocks();
  });

  describe('getFavorites()', () => {
    it('should return mapped favorites for the user', async () => {
      const userId = '123';
      prisma.favorite.findMany.mockResolvedValue([
        {
          advert: {
            id: 'a1',
            photos: [],
            ownerId: userId,
            owner: { id: userId, username: 'test' },
            _count: { favorites: 3 },
          },
        },
      ]);

      mapper.toAdvertSummaryEntity.mockReturnValue('mapped advert');

      const result = await service.getFavorites(userId);

      expect(prisma.favorite.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(mapper.toAdvertSummaryEntity).toHaveBeenCalledWith(
        expect.any(Object),
        { isOwner: false, isFavorite: true },
      );
      expect(result).toEqual(['mapped advert']);
    });
  });

  describe('addFavorite()', () => {
    it('should add favorite and return mapped advert', async () => {
      const userId = '123';
      const advert = { id: 'a1', ownerId: '345' };

      prisma.advert.findUniqueOrThrow
        .mockResolvedValueOnce(advert)
        .mockResolvedValueOnce({ ...advert, _count: { favorites: 1 } });
      prisma.favorite.findUnique.mockResolvedValue(null);
      prisma.favorite.create.mockResolvedValue({});

      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      const result = await service.addFavorite(advert.id, userId);

      expect(prisma.favorite.create).toHaveBeenCalledWith({
        data: { userId, advertId: advert.id },
      });
      expect(mapper.toAdvertDetailsEntity).toHaveBeenCalledWith(
        expect.any(Object),
        { isOwner: false, isFavorite: true },
      );
      expect(result).toBe('mapped advert');
    });

    it('should throw if advert is already marked as favorite', async () => {
      prisma.advert.findUniqueOrThrow.mockResolvedValue({
        id: 'a1',
        ownerId: '345',
      });
      prisma.favorite.findUnique.mockResolvedValue({ id: 'f1' });

      await expect(service.addFavorite('a1', '123')).rejects.toThrow(
        'This advert is already marked as favorite',
      );
    });

    it('should throw if user is the owner', async () => {
      prisma.advert.findUniqueOrThrow.mockResolvedValue({
        id: 'a1',
        ownerId: '123',
      });

      await expect(service.addFavorite('a1', '123')).rejects.toThrow(
        'Owned adverts cannot be marked as favorite',
      );
    });
  });

  describe('deleteFavorite()', () => {
    it('should delete favorite and return mapped advert', async () => {
      const userId = '123';

      prisma.favorite.findUnique.mockResolvedValue({ userId, advertId: 'a1' });
      prisma.favorite.delete.mockResolvedValue({});
      prisma.advert.findUniqueOrThrow.mockResolvedValue({
        id: 'a1',
        photos: [],
        ownerId: '345',
        owner: {},
        _count: { favorites: 0 },
      });

      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      const result = await service.deleteFavorite('a1', userId);

      expect(prisma.favorite.delete).toHaveBeenCalledWith({
        where: { userId_advertId: { userId, advertId: 'a1' } },
      });
      expect(result).toBe('mapped advert');
    });

    it('should throw if favorite belongs to another user', async () => {
      prisma.favorite.findUnique.mockResolvedValue({
        userId: '345',
        advertId: 'a1',
      });

      await expect(service.deleteFavorite('a1', '123')).rejects.toThrow(
        'You are not authorized to modify this advert',
      );
    });

    it('should throw if advert was not marked as favorite', async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);

      await expect(service.deleteFavorite('a1', '123')).rejects.toThrow(
        'This advert was not marked as favorite',
      );
    });
  });
});
