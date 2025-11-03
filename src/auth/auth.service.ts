import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  async login(user: LoginDto) {
    try {
      const foundUser = await this.prisma.user.findUniqueOrThrow({
        where: { email: user.email },
      });

      if (!(await bcrypt.compare(user.password, foundUser.password))) {
        throw new UnauthorizedException('invalid email or password');
      }

      const accessToken = this.jwtService.sign({
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
      });

      return { accessToken };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new UnauthorizedException('invalid email or password');
      }

      throw error;
    }
  }

  async signup(user: SignUpDto) {
    try {
      const newUser = await this.usersService.create({
        email: user.email,
        username: user.username,
        password: user.password,
      });

      const accessToken = this.jwtService.sign({
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      });

      return { user: newUser, accessToken };
    } catch (error) {
      throw error;
    }
  }
}
