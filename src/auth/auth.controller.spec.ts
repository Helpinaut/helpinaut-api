import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const authMock = {
  login: jest.fn(),
  signup: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compile();

    controller = module.get(AuthController);
    service = module.get(AuthService);

    jest.clearAllMocks();
  });

  describe('login()', () => {
    it('should call authService.login with credentials', async () => {
      const dto = { email: 'test@email.com', password: '12345678' };

      service.login.mockResolvedValue({ accessToken: 'token' });

      const result = await controller.login(dto);

      expect(service.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ accessToken: 'token' });
    });
  });

  describe('signup()', () => {
    it('should call authService.signup with correct params', async () => {
      const dto = {
        email: 'test@email.com',
        username: 'test',
        password: '12345678',
        repeatedPassword: '12345678',
        postalCode: '41001',
      };

      service.signup.mockResolvedValue({
        user: {
          ...dto,
          id: '123',
          latitude: 37.38,
          longitude: -5.99,
          createdAt: new Date('2026-02-28'),
          updatedAt: new Date('2026-02-28'),
          adverts: [],
          favorites: [],
        },
        accessToken: 'token',
      });

      const result = await controller.signup(dto);

      expect(service.signup).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        user: {
          ...dto,
          id: '123',
          latitude: 37.38,
          longitude: -5.99,
          createdAt: new Date('2026-02-28'),
          updatedAt: new Date('2026-02-28'),
          adverts: [],
          favorites: [],
        },
        accessToken: 'token',
      });
    });
  });
});
