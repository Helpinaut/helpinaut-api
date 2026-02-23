import { AdvertsMapper } from './adverts.mapper';
import { AdvertEntity } from './entities/advert.entity';
import { PhotoEntity } from './entities/photo.entity';

describe('AdvertsMapper', () => {
  let mapper: AdvertsMapper;

  beforeEach(() => {
    mapper = new AdvertsMapper();
  });

  describe('toOwnerSummaryEntity()', () => {
    it('should map owner to summary entity', () => {
      const owner = { id: '123', username: 'test' };

      const result = mapper.toOwnerSummaryEntity(owner);

      expect(result).toEqual({ id: '123', username: 'test' });
    });
  });

  describe('toOwnerDetailsEntity()', () => {
    it('should map owner to details entity', () => {
      const owner = {
        id: '123',
        username: 'test',
        postalCode: '41001',
        createdAt: new Date('2026-02-23'),
        _count: { adverts: 2 },
      };

      const result = mapper.toOwnerDetailsEntity(owner);

      expect(result).toEqual({
        id: '123',
        username: 'test',
        postalCode: '41001',
        createdAt: new Date('2026-02-23'),
        advertsCount: 2,
      });
    });
  });

  describe('toAdvertSummaryEntity()', () => {
    it('should map advert to summary entity with thumbnail and summary owner', () => {
      const advert = {
        id: 'a1',
        title: 'test advert',
        ownerId: '123',
        ownerUsername: 'test',
        thumbnailUrl: '/uploads/photo1.jpg',
      };
      const derivedValues = {
        isOwner: false,
        isFavorite: true,
        favoriteCount: 3,
        distance: 12.5,
      };

      const result = mapper.toAdvertSummaryEntity(advert, derivedValues);

      expect(result).toEqual({
        id: 'a1',
        title: 'test advert',
        photos: [{ url: '/uploads/photo1.jpg' }],
        owner: {
          id: '123',
          username: 'test',
        },
        isOwner: false,
        isFavorite: true,
        favoriteCount: 3,
        distance: 12.5,
      });
    });

    it('should return empty photos when thumbnail does not exist', () => {
      const advert = {
        id: 'a1',
        ownerId: '123',
        ownerUsername: 'test',
        thumbnailUrl: null,
      };
      const derivedValues = { isOwner: false, isFavorite: false };

      const result = mapper.toAdvertSummaryEntity(advert, derivedValues);

      expect(result.photos).toEqual([]);
    });
  });

  describe('toAdvertDetailsEntity()', () => {
    it('should map advert to details entity with full owner and photos', () => {
      const advert = {
        id: 'a1',
        title: 'test advert',
        photos: [
          { url: '/uploads/photo1.jpg' },
          { url: '/uploads/photo2.jpg' },
        ],
        owner: {
          id: '123',
          username: 'test',
          postalCode: '41001',
          createdAt: new Date('2026-02-23'),
          _count: { adverts: 2 },
        },
        _count: { favorites: 3 },
      };
      const derivedValues = {
        isOwner: true,
        isFavorite: false,
        distance: null,
      };

      const result = mapper.toAdvertDetailsEntity(advert, derivedValues);

      expect(result).toBeInstanceOf(AdvertEntity);
      expect(result.owner).toEqual({
        id: '123',
        username: 'test',
        postalCode: '41001',
        createdAt: new Date('2026-02-23'),
        advertsCount: 2,
      });
      expect(result.photos).toEqual([
        new PhotoEntity({ url: '/uploads/photo1.jpg' }),
        new PhotoEntity({ url: '/uploads/photo2.jpg' }),
      ]);
      expect(result.favoriteCount).toBe(3);
      expect(result.isOwner).toBe(true);
      expect(result.isFavorite).toBe(false);
      expect(result.distance).toBe(null);
    });
  });
});
