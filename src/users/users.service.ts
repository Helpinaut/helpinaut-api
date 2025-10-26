import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * This action adds a new user.
   * @param createUserDto
   * @returns
   */
  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  /**
   * This action returns all users.
   * @returns
   */
  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        // adverts: true,
        // favorites: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * This action returns a #id user.
   * @param id
   * @returns
   */
  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        adverts: true,
        favorites: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * This action updates a #id user.
   * @param id
   * @param updateUserDto
   * @returns
   */
  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  /**
   * This action removes a #id user.
   * @param id
   * @returns
   */
  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
