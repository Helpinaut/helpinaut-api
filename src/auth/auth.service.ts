import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(user: LoginDto) {
    try {
      const foundUser = await this.prisma.user.findUniqueOrThrow({
        where: { email: user.email },
      });

      if (!(await bcrypt.compare(user.password, foundUser.password))) {
        throw new UnauthorizedException('Invalid email or password');
      }

      return {
        accessToken: this.jwtService.sign({
          id: foundUser.id,
          email: foundUser.email,
          username: foundUser.username,
        }),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new UnauthorizedException('Invalid email or password');
      }

      throw error;
    }
  }
}
