import { PrismaService } from 'src/prisma/prisma.service';
import { PhotosService } from './photos.service';
import { Test } from '@nestjs/testing';
import { AdvertsMapper } from '../adverts.mapper';
import { assertOwnership } from '../adverts.helper';
import { unlink } from 'fs/promises';

const prismaMock = {
  photo: {
    createMany: jest.fn(),
    delete: jest.fn(),
  },
  advert: {
    findUniqueOrThrow: jest.fn(),
  },
};

const mapperMock = {
  toAdvertDetailsEntity: jest.fn(),
};

jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));
jest.mock('../adverts.helper', () => ({
  assertOwnership: jest.fn(),
}));

describe('PhotosService', () => {
  let service: PhotosService;
  let prisma: typeof prismaMock;
  let mapper: typeof mapperMock;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PhotosService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AdvertsMapper, useValue: mapperMock },
      ],
    }).compile();

    service = module.get(PhotosService);
    prisma = module.get(PrismaService);
    mapper = module.get(AdvertsMapper);

    jest.resetAllMocks();
  });

  describe('uploadPhoto()', () => {
    it('should upload photos and return mapped advert', async () => {
      prisma.advert.findUniqueOrThrow
        .mockResolvedValueOnce({
          id: 'a1',
          ownerId: '123',
        })
        .mockResolvedValueOnce({
          id: 'a1',
          photos: [{ url: '/uploads/photo1.jpg' }],
          ownerId: '123',
          owner: {},
          _count: { favorites: 0 },
        });

      prisma.photo.createMany.mockResolvedValue({});

      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      const result = await service.uploadPhoto('a1', '123', [
        '/uploads/photo1.jpg',
      ]);

      expect(prisma.photo.createMany).toHaveBeenCalledWith({
        data: [
          {
            url: '/uploads/photo1.jpg',
            advertId: 'a1',
          },
        ],
      });
      expect(result).toBe('mapped advert');
    });

    it('should throw if user is not the owner', async () => {
      prisma.advert.findUniqueOrThrow.mockResolvedValue({
        id: 'a1',
        ownerId: '123',
      });

      (assertOwnership as jest.Mock).mockImplementation(() => {
        throw new Error('Not owner');
      });

      await expect(
        service.uploadPhoto('a1', '123', ['/uploads/photo1.jpg']),
      ).rejects.toThrow('Not owner');
      expect(prisma.photo.createMany).not.toHaveBeenCalled();
    });

    it('should throw if photo upload fails', async () => {
      prisma.advert.findUniqueOrThrow.mockResolvedValue({
        id: 'a1',
        ownerId: '123',
      });

      prisma.photo.createMany.mockRejectedValue(new Error('Database error'));

      await expect(
        service.uploadPhoto('a1', '123', ['/uploads/photo1.jpg']),
      ).rejects.toThrow('Database error');
    });
  });

  describe('deletePhoto()', () => {
    it('should delete photo and return mapped advert', async () => {
      prisma.advert.findUniqueOrThrow
        .mockResolvedValueOnce({
          id: 'a1',
          photos: [{ id: 'p1', url: '/uploads/photo1.jpg' }],
          ownerId: '123',
        })
        .mockResolvedValueOnce({
          id: 'a1',
          photos: [],
          ownerId: '123',
          owner: {},
          _count: { favorites: 0 },
        });

      prisma.photo.delete.mockResolvedValue({});

      (unlink as jest.Mock).mockResolvedValue({});

      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      const result = await service.deletePhoto('a1', 'p1', '123');

      expect(unlink).toHaveBeenCalledTimes(1);
      expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(result).toBe('mapped advert');
    });

    it('should continue even if unlink fails', async () => {
      prisma.advert.findUniqueOrThrow
        .mockResolvedValueOnce({
          id: 'a1',
          photos: [{ id: 'p1', url: '/uploads/photo1.jpg' }],
          ownerId: '123',
        })
        .mockResolvedValueOnce({
          id: 'a1',
          photos: [],
          ownerId: '123',
          owner: {},
          _count: { favorites: 0 },
        });

      (unlink as jest.Mock).mockRejectedValue(
        new Error('Failed to delete file'),
      );

      prisma.photo.delete.mockResolvedValue({});

      mapper.toAdvertDetailsEntity.mockReturnValue('mapped advert');

      const result = await service.deletePhoto('a1', 'p1', '123');

      expect(unlink).toHaveBeenCalledTimes(1);
      expect(result).toBe('mapped advert');
    });

    it('should throw if photo does not belong to advert', async () => {
      prisma.advert.findUniqueOrThrow.mockResolvedValue({
        id: 'a1',
        photos: [],
        ownerId: '123',
      });

      await expect(service.deletePhoto('a1', 'p1', '123')).rejects.toThrow(
        'This photo does not belong to the advert',
      );
    });

    it('should throw if user is not the owner', async () => {
      prisma.advert.findUniqueOrThrow.mockResolvedValue({
        id: 'a1',
        photos: [],
        ownerId: '123',
      });

      (assertOwnership as jest.Mock).mockImplementation(() => {
        throw new Error('Not owner');
      });

      await expect(service.deletePhoto('a1', 'p1', '123')).rejects.toThrow(
        'Not owner',
      );
      expect(prisma.photo.delete).not.toHaveBeenCalled();
    });
  });
});
