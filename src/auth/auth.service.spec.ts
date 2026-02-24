jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from './auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const prismaMock = {
  user: {
    findUniqueOrThrow: jest.fn(),
  },
};

const usersMock = {
  create: jest.fn(),
};

const jwtMock = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: typeof prismaMock;
  let users: typeof usersMock;
  let jwt: typeof jwtMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: UsersService, useValue: usersMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    users = module.get(UsersService);
    jwt = module.get(JwtService);

    jest.clearAllMocks();
  });

  describe('login()', () => {
    it('should return access token when credentials are valid', async () => {
      const user = {
        id: '123',
        email: 'test@email.com',
        username: 'test',
        password: 'hashed-password',
      };

      prisma.user.findUniqueOrThrow.mockResolvedValue(user);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jwt.sign.mockReturnValue('token');

      const result = await service.login({
        email: 'test@email.com',
        password: '12345678',
      });

      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith(
        '12345678',
        'hashed-password',
      );
      expect(result).toEqual({ accessToken: 'token' });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        password: 'hashed-password',
      });

      const dto = { email: 'test@email.com', password: 'wrong-password' };

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      await expect(service.login(dto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('error', {
          code: 'P2025',
          clientVersion: '1',
        }),
      );

      await expect(
        service.login({ email: 'unknown@email.com', password: '12345678' }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw if login fails', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.login({ email: 'test@email.com', password: '12345678' }),
      ).rejects.toThrow('Database error');
    });
  });

  describe('signup()', () => {
    it('should create a user and return their access token', async () => {
      const user = { id: '123', email: 'test@email.com' };

      users.create.mockResolvedValue(user);

      jwt.sign.mockReturnValue('token');

      const result = await service.signup({
        email: 'test@email.com',
        username: 'test',
        password: '12345678',
        repeatedPassword: '12345678',
        postalCode: '41001',
      });

      expect(users.create).toHaveBeenCalled();
      expect(result).toEqual({ user, accessToken: 'token' });
    });

    it('should throw if signup fails', async () => {
      users.create.mockRejectedValue(new Error('Database error'));

      const dto = {
        email: 'test@email.com',
        username: 'test',
        password: '12345678',
        repeatedPassword: '12345678',
        postalCode: '41001',
      };

      await expect(service.signup(dto)).rejects.toThrow('Database error');
    });
  });
});
