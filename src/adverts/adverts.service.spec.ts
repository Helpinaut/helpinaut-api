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

jest.spyOn(helper, 'assertOwnership').mockImplementation(() => {});
jest
  .spyOn(helper, 'getPagination')
  .mockImplementation(() => ({ limit: 10, offset: 0 }));
jest.spyOn(helper, 'parseEnumValue').mockImplementation((value) => value);
jest.spyOn(helper, 'resolveCoordinates').mockImplementation(async () => null);

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
});
