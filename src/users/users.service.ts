import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { unlink } from 'fs/promises';
import path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdvertEntity } from 'src/adverts/entities/advert.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GeocodingService } from './services/geocoding.service';
import { FavoriteEntity } from 'src/adverts/entities/favorite.entity';
import { UserEntity } from './entities/user.entity';
import { OwnerDetailsEntity } from './entities/owner.entity';

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
            _count: { select: { favorites: true } },
          },
        },
      },
    });

    return new OwnerDetailsEntity({
      ...user,
      adverts: user.adverts.map(
        (advert) =>
          new AdvertEntity({
            ...advert,
            favoriteCount: advert._count.favorites ?? 0,
          }),
      ),
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
            _count: { select: { favorites: true } },
          },
        },
        favorites: true,
      },
    });

    return new UserEntity({
      ...user,
      adverts: user.adverts.map(
        (advert) =>
          new AdvertEntity({
            ...advert,
            favoriteCount: advert._count.favorites ?? 0,
          }),
      ),
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
    const user = await this.prisma.user.findFirstOrThrow({
      where: { id },
      include: {
        adverts: {
          include: {
            photos: true,
            favorites: true,
          },
        },
        favorites: true,
      },
    });

    await this.prisma.favorite.deleteMany({ where: { userId: id } });
    await this.prisma.favorite.deleteMany({
      where: { advertId: { in: user.adverts.map((advert) => advert.id) } },
    });

    for (const advert of user.adverts) {
      for (const photo of advert.photos) {
        const filePath = path.join(
          process.cwd(),
          'uploads',
          photo.url.replace('/uploads/', ''),
        );

        try {
          await unlink(filePath);
        } catch (error) {
          console.log(`Failed to delete file: ${filePath}`, error);
        }
      }

      await this.prisma.photo.deleteMany({ where: { advertId: advert.id } });
    }

    await this.prisma.advert.deleteMany({ where: { ownerId: id } });

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
