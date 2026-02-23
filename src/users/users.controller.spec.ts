import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getMe: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            updateLocation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  describe('getMe()', () => {
    it('should call usersService.getMe with the authenticated user id', async () => {
      const user = {
        id: '123',
        email: 'test@email.com',
        username: 'test',
        password: '12345678',
        postalCode: '41001',
        latitude: 37.38,
        longitude: -5.99,
        adverts: [],
        favorites: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.getMe.mockResolvedValue(user);

      const result = await controller.getMe('123');

      expect(service.getMe).toHaveBeenCalledWith('123');
      expect(result).toBe(user);
    });
  });

  describe('getById()', () => {
    it('should call usersService.getById with the correct id', async () => {
      const owner = {
        id: '123',
        username: 'test',
        postalCode: '41001',
        adverts: [],
        createdAt: new Date(),
      };

      service.getById.mockResolvedValue(owner);

      const result = await controller.getById('123');

      expect(service.getById).toHaveBeenCalledWith('123');
      expect(result).toBe(owner);
    });
  });

  describe('update()', () => {
    it('should call usersService.update with correct params', async () => {
      const dto = { email: 'new@email.com' };
      const user = {
        id: '123',
        email: 'test@email.com',
        username: 'test',
        password: '12345678',
        postalCode: '41001',
        latitude: 37.38,
        longitude: -5.99,
        adverts: [],
        favorites: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.update.mockResolvedValue(user);

      const result = await controller.update(dto, '123');

      expect(service.update).toHaveBeenCalledWith('123', dto);
      expect(result).toBe(user);
    });
  });

  describe('delete()', () => {
    it('should call usersService.delete with the correct id', async () => {
      const user = {
        id: '123',
        email: 'test@email.com',
        username: 'test',
        password: '12345678',
        postalCode: '41001',
        latitude: 37.38,
        longitude: -5.99,
        adverts: [],
        favorites: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.delete.mockResolvedValue(user);

      const result = await controller.delete('123');

      expect(service.delete).toHaveBeenCalledWith('123');
      expect(result).toBe(user);
    });
  });

  describe('updateLocation()', () => {
    it('should call usersService.updateLocation with correct params', async () => {
      const dto = { postalCode: '28008' };
      const response = { message: 'Location successfully updated' };

      service.updateLocation.mockResolvedValue(response);

      const result = await controller.updateLocation('123', dto);

      expect(service.updateLocation).toHaveBeenCalledWith('123', dto);
      expect(result).toBe(response);
    });
  });
});
