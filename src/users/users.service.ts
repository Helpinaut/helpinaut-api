import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GeocodingService } from './services/geocoding.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
  ) {}

  /**
   * This action adds a new user with hashed password. UserEntity prevents excluded properties from being shown.
   * @param createUserDto
   * @returns UserEntity
   */
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const newUser = await this.prisma.user.create({
      data: { ...createUserDto, password: hashedPassword },
    });

    return new UserEntity(newUser);
  }

  /**
   * This action returns all users. UserEntity prevents excluded properties from being shown.
   * @returns UserEntity[]
   */
  async findAll() {
    const users = await this.prisma.user.findMany();

    return users.map((user) => new UserEntity(user));
  }

  /**
   * This action returns a selected user. UserEntity prevents excluded properties from being shown.
   * @param id
   * @returns UserEntity
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        adverts: {
          include: {
            photos: true,
            owner: { select: { username: true } },
          },
        },
      },
    });

    return new UserEntity(user);
  }

  /**
   * This action updates a selected user. UserEntity prevents excluded properties from being shown.
   * @param id
   * @param updateUserDto
   * @returns UserEntity
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return new UserEntity(updatedUser);
  }

  /**
   * This action removes a selected user. UserEntity prevents excluded properties from being shown.
   * @param id
   * @returns UserEntity
   */
  async remove(id: string) {
    const deletedUser = await this.prisma.user.delete({ where: { id } });

    return new UserEntity(deletedUser);
  }

  async updateLocation(id: string, updateLocationDto: UpdateLocationDto) {
    const { postcode } = updateLocationDto;
    const { latitude, longitude } =
      await this.geocoding.fromPostalCode(postcode);

    if (!latitude || !longitude) {
      throw new BadRequestException('unable to find location');
    }

    await this.prisma.user.update({
      where: { id },
      data: { postcode, latitude, longitude },
    });

    return { message: 'location successfully updated' };
  }
}
