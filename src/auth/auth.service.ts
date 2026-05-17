import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { ApiErrorsConfig } from 'src/config/api.errors.config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  /**
   * Generates a signed JWT containing the essential user identity info.
   * @param user - User entity.
   * @returns Access token.
   */
  private generateToken(user: User): string {
    return this.jwtService.sign({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  /**
   * Authenticates a user by their email and password.
   * @param user - DTO Login credentials.
   * @throws UnauthorizedException if credentials are invalid.
   * @returns Signed JWT if the credentials are valid.
   */
  async login(user: LoginDto) {
    try {
      const foundUser = await this.prisma.user.findUniqueOrThrow({
        where: { email: user.email },
      });

      const isPasswordValid = await bcrypt.compare(
        user.password,
        foundUser.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException(
          ApiErrorsConfig.AUTH_INVALID_CREDENTIALS,
        );
      }

      return { accessToken: this.generateToken(foundUser) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new UnauthorizedException(
          ApiErrorsConfig.AUTH_INVALID_CREDENTIALS,
        );
      }

      throw error;
    }
  }

  /**
   * Registers a new user.
   * @param user - User registration data.
   * @returns JWT for immediate authentication.
   */
  async signup(user: SignUpDto) {
    const newUser = await this.usersService.create({
      email: user.email,
      username: user.username,
      password: user.password,
      postalCode: user.postalCode,
    });

    return { user: newUser, accessToken: this.generateToken(newUser) };
  }
}
