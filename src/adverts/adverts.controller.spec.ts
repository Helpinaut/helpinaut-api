import { Test, TestingModule } from '@nestjs/testing';
import { AdvertsController } from './adverts.controller';
import { AdvertsService } from './adverts.service';
import { PhotosService } from './services/photos.service';
import { FavoritesService } from './services/favorites.service';
import { Category } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';

const advertsMock = {
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  getCategories: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const photosMock = {
  uploadPhoto: jest.fn(),
  deletePhoto: jest.fn(),
};

const favoritesMock = {
  getFavorites: jest.fn(),
  addFavorite: jest.fn(),
  deleteFavorite: jest.fn(),
};

describe('AdvertsController', () => {
  let controller: AdvertsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvertsController],
      providers: [
        { provide: AdvertsService, useValue: advertsMock },
        { provide: PhotosService, useValue: photosMock },
        { provide: FavoritesService, useValue: favoritesMock },
      ],
    }).compile();

    controller = module.get(AdvertsController);

    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('should call advertsService.create with correct params', async () => {
      const files = [{ filename: 'photo1.jpg' }, { filename: 'photo2.jpg' }];
      const dto = {
        title: 'test advert',
        description: 'lorem ipsum dolor sit',
        price: 10,
        category: Category.CARE,
        isOffer: true,
      };

      advertsMock.create.mockResolvedValue('created advert');

      const result = await controller.create(files as any, dto, '123');

      expect(advertsMock.create).toHaveBeenCalledWith(dto, '123', [
        '/uploads/photo1.jpg',
        '/uploads/photo2.jpg',
      ]);
      expect(result).toBe('created advert');
    });
  });

  describe('getAll()', () => {
    it('should call advertsService.getAll with user id and filters', async () => {
      const filters = { title: 'test' };
      const advert = {
        title: 'test advert',
        description: 'lorem ipsum dolor sit',
        price: 10,
        category: Category.CARE,
        isOffer: true,
      };

      advertsMock.getAll.mockResolvedValue([advert]);

      const result = await controller.getAll('123', filters);

      expect(advertsMock.getAll).toHaveBeenCalledWith('123', filters);
      expect(result).toEqual([advert]);
    });
  });

  describe('getById()', () => {
    it('should call advertsService.getById with the correct id and user id', async () => {
      const advert = {
        id: 'a1',
        title: 'test advert',
        description: 'lorem ipsum dolor sit',
        price: 10,
        category: Category.CARE,
        isOffer: true,
      };

      advertsMock.getById.mockResolvedValue(advert);

      const result = await controller.getById('a1', '123');

      expect(advertsMock.getById).toHaveBeenCalledWith('a1', '123');
      expect(result).toBe(advert);
    });
  });

  describe('getCategories()', () => {
    it('should call advertsService.getCategories and return the categories', async () => {
      advertsMock.getCategories.mockResolvedValue(['cat1', 'cat2']);

      const result = await controller.getCategories();

      expect(advertsMock.getCategories).toHaveBeenCalled();
      expect(result).toEqual(['cat1', 'cat2']);
    });
  });

  describe('update()', () => {
    it('should call advertsService.update with correct params', async () => {
      const dto = { title: 'updated' };
      const advert = {
        id: 'a1',
        title: 'test advert',
        description: 'lorem ipsum dolor sit',
        price: 10,
        category: Category.CARE,
        isOffer: true,
      };

      advertsMock.update.mockResolvedValue(advert);

      const result = await controller.update(dto, '123', 'a1');

      expect(advertsMock.update).toHaveBeenCalledWith('a1', '123', dto);
      expect(result).toBe(advert);
    });
  });

  describe('delete()', () => {
    it('should call advertsService.delete with correct id and user id', async () => {
      const advert = {
        id: 'a1',
        title: 'test advert',
        description: 'lorem ipsum dolor sit',
        price: 10,
        category: Category.CARE,
        isOffer: true,
      };

      advertsMock.delete.mockResolvedValue(advert);

      const result = await controller.delete('a1', '123');

      expect(advertsMock.delete).toHaveBeenCalledWith('a1', '123');
      expect(result).toBe(advert);
    });
  });

  describe('uploadPhoto()', () => {
    it('should call photosService.uploadPhoto with correct params', async () => {
      const files = [{ filename: 'new-photo.jpg' }];

      photosMock.uploadPhoto.mockResolvedValue('photo uploaded');

      const result = await controller.uploadPhoto(files as any, 'a1', '123');

      expect(photosMock.uploadPhoto).toHaveBeenCalledWith('a1', '123', [
        '/uploads/new-photo.jpg',
      ]);
      expect(result).toBe('photo uploaded');
    });
  });

  describe('deletePhoto()', () => {
    it('should call photosService.deletePhoto with correct params', async () => {
      photosMock.deletePhoto.mockResolvedValue('photo deleted');

      const result = await controller.deletePhoto('a1', 'p1', '123');

      expect(photosMock.deletePhoto).toHaveBeenCalledWith('a1', 'p1', '123');
      expect(result).toBe('photo deleted');
    });
  });

  describe('getFavorites()', () => {
    it('should call favoritesService.getFavorites with user id', async () => {
      favoritesMock.getFavorites.mockResolvedValue(['favorite advert']);

      const result = await controller.getFavorites('123');

      expect(favoritesMock.getFavorites).toHaveBeenCalledWith('123');
      expect(result).toEqual(['favorite advert']);
    });
  });

  describe('addFavorite()', () => {
    it('should call favoritesService.addFavorite with correct id and user id', async () => {
      favoritesMock.addFavorite.mockResolvedValue('advert added to favorites');

      const result = await controller.addFavorite('a1', '123');

      expect(favoritesMock.addFavorite).toHaveBeenCalledWith('a1', '123');
      expect(result).toBe('advert added to favorites');
    });
  });

  describe('deleteFavorite()', () => {
    it('should call favoritesService.deleteFavorite with correct id and user id', async () => {
      favoritesMock.deleteFavorite.mockResolvedValue(
        'advert deleted from favorites',
      );

      const result = await controller.deleteFavorite('a1', '123');

      expect(favoritesMock.deleteFavorite).toHaveBeenCalledWith('a1', '123');
      expect(result).toBe('advert deleted from favorites');
    });
  });
});
