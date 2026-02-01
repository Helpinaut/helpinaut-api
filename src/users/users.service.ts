import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GeocodingService } from './services/geocoding.service';
import { OwnerDetailsEntity } from './entities/owner.entity';
import { FavoriteEntity } from 'src/adverts/entities/favorite.entity';
import { AdvertEntity } from 'src/adverts/entities/advert.entity';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
  ) {}

  /**
   * Ensures thar email and username are unique before creating a user.
   * @throws BadRequestException if either already exists.
   */
  private async assertUniqueCredentials(
    email?: string,
    username?: string,
    userId?: string,
  ) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
        NOT: userId ? { id: userId } : undefined,
      },
    });

    if (existing) {
      throw new BadRequestException(
        existing.email === email
          ? 'Email is already in use'
          : 'Username is already in use',
      );
    }
  }

  /**
   * Creates a new user with hashed password.
   * Validates email and username uniqueness before creation.
   * @param createUserDto - User registration data.
   * @throws BadRequestException if email or username already exists.
   * @returns UserEntity representing the created user.
   */
  async create(createUserDto: CreateUserDto) {
    await this.assertUniqueCredentials(
      createUserDto.email,
      createUserDto.username,
    );

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const coords = await this.geocoding.fromPostalCode(
      createUserDto.postalCode,
    );
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword,
        postalCode: createUserDto.postalCode,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });

    return new UserEntity(newUser);
  }

  /**
   * Retrieves a public user profile by ID.
   * @param id - ID of the user.
   * @throws UnauthorizedException if user is not the owner.
   * @returns Limited UserEntity with full advert details.
   */
  async getById(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        adverts: {
          include: {
            photos: true,
          },
        },
      },
    });

    return new OwnerDetailsEntity({
      ...user,
      adverts: user.adverts.map((advert) => new AdvertEntity(advert)),
      advertsCount: user.adverts.length,
    });
  }

  /**
   * Retrieves the authenticated user's private profile.
   * @param id - ID of the logged user.
   * @throws UnauthorizedException if user is not the owner.
   * @returns UserEntity
   */
  async getMe(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        adverts: {
          include: {
            photos: true,
          },
        },
        favorites: {
          include: { advert: true },
        },
      },
    });

    return new UserEntity({
      ...user,
      adverts: user.adverts.map((advert) => new AdvertEntity(advert)),
      favorites: user.favorites.map((favorite) => new FavoriteEntity(favorite)),
    });
  }

  /**
   * Updates user profile.
   * If password is updated, it will be hashed before saving.
   * @param id - ID of the authenticated user.
   * @param updateUserDto - DTO containing fields to update.
   * @throws UnauthorizedException if user is not the owner.
   * @returns Updated UserEntity.
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.email || updateUserDto.username) {
      await this.assertUniqueCredentials(
        updateUserDto.email,
        updateUserDto.username,
        id,
      );
    }

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
   * Deletes a user account.
   * @param id - ID of the authenticated user.
   * @throws UnauthorizedException if user is not the owner.
   * @returns Deleted UserEntity.
   */
  async delete(id: string) {
    const deletedUser = await this.prisma.user.delete({ where: { id } });

    return new UserEntity(deletedUser);
  }

  /**
   * Updates de user's location (therefore their advert's location) based on
   * a postal code.
   * @param id - ID of the authenticated user.
   * @param updateLocationDto - DTO containing location data.
   * @throws BadRequestException if no location is found.
   * @throws ServiceUnavailableException if the geocoding service fails.
   * @returns Message of successful update.
   */
  async updateLocation(id: string, updateLocationDto: UpdateLocationDto) {
    const { postalCode } = updateLocationDto;
    const { latitude, longitude } =
      await this.geocoding.fromPostalCode(postalCode);

    await this.prisma.user.update({
      where: { id },
      data: { postalCode, latitude, longitude },
    });

    await this.prisma.advert.updateMany({
      where: { ownerId: id },
      data: { latitude, longitude },
    });

    return { message: 'Location successfully updated' };
  }
}
