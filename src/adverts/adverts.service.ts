import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Category, Status } from '@prisma/client';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { UpdateAdvertDto } from './dto/update-advert.dto';
import { AdvertEntity } from './entities/advert.entity';
import { checkOwnership } from 'src/utils/check-ownership.util';
import { normalizeEnum } from 'src/utils/normalize-enum.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicUserEntity } from 'src/users/entities/public-user.entity';
import { PhotoEntity } from './entities/photo.entity';
import { FilterAdvertDto } from './dto/filter-advert.dto';

@Injectable()
export class AdvertsService {
  constructor(private prisma: PrismaService) {}

  /**
   * This action adds a new advert assigned to authenticated user.
   * @param createAdvertDto
   * @returns AdvertEntity
   */
  async create(
    createAdvertDto: CreateAdvertDto,
    ownerId: string,
    photoPaths: string[],
  ) {
    const normalizedCategory = normalizeEnum(
      createAdvertDto.category,
      Category,
    );

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: { latitude: true, longitude: true },
    });

    if (!user.latitude || !user.longitude) {
      throw new BadRequestException(
        'must set location before creating adverts',
      );
    }

    const createdAdvert = await this.prisma.advert.create({
      data: {
        ...createAdvertDto,
        category: normalizedCategory as Category,
        photos: {
          create: photoPaths.map((url) => ({ url })),
        },
        ownerId,
        latitude: user.latitude,
        longitude: user.longitude,
      },
      include: { photos: true },
    });

    return new AdvertEntity(createdAdvert);
  }

  findCategories() {
    const advertCategories = Object.values(Category).sort();
    const formattedCategories = advertCategories.map((category) => ({
      value: category,
      label: category
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    }));

    return formattedCategories;
  }

  /**
   * This action returns all adverts.
   * @returns AdvertEntity[]
   */
  async findAll(userId: string | null, filters: FilterAdvertDto) {
    const {
      page = '1',
      limit = '20',
      title,
      minPrice,
      maxPrice,
      category,
      offer,
    } = filters;
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;
    const where: any = { status: 'ACTIVE' };

    if (Number(page) < 1 || take < 1 || take > 20) {
      throw new BadRequestException('invalid pagination parameters');
    }
    if (title) {
      where.title = { contains: title, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }
    if (minPrice) {
      where.price = { ...(where.price ?? {}), gte: Number(minPrice) };
    }
    if (maxPrice) {
      where.price = { ...(where.price ?? {}), lte: Number(maxPrice) };
    }
    if (offer) {
      where.offer = offer === 'true';
    }

    const adverts = await this.prisma.advert.findMany({
      where,
      take,
      skip,
      include: { owner: { select: { username: true } }, photos: true },
      orderBy: { createdAt: 'desc' },
    });

    const result = await Promise.all(
      adverts.map(async (advert) => {
        const favorite = userId
          ? await this.prisma.favorite.findUnique({
              where: { userId_advertId: { userId, advertId: advert.id } },
            })
          : null;
        return new AdvertEntity({
          ...advert,
          owner: new PublicUserEntity(advert.owner),
          isOwner: userId ? advert.ownerId === userId : false,
          isFavorite: !!favorite,
        });
      }),
    );

    return result;
  }

  /**
   * This action returns a selected advert.
   * @param id
   * @returns AdvertEntity
   */
  async findOne(id: string, userId: string | null) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id },
      include: { owner: { select: { username: true } }, photos: true },
    });

    return new AdvertEntity({
      ...advert,
      owner: new PublicUserEntity(advert.owner),
      photos: advert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: userId ? advert.ownerId === userId : false,
      isFavorite: userId
        ? this.prisma.favorite.findUnique({
            where: { userId_advertId: { userId, advertId: advert.id } },
          }) !== null
        : false,
    });
  }

  /**
   * This action updated a selected advert.
   * @param id
   * @param updateAdvertDto
   * @returns AdvertEntity
   */
  async update(id: string, userId: string, updateAdvertDto: UpdateAdvertDto) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id },
    });

    checkOwnership(advert, userId);

    if (updateAdvertDto.category) {
      const normalizedCategory = normalizeEnum(
        updateAdvertDto.category,
        Category,
      );
      updateAdvertDto.category = normalizedCategory as Category;
    }

    if (updateAdvertDto.status) {
      const normalizedStatus = normalizeEnum(updateAdvertDto.status, Status);
      updateAdvertDto.status = normalizedStatus;
    }

    const updatedAdvert = await this.prisma.advert.update({
      where: { id },
      include: { owner: { select: { username: true } }, photos: true },
      data: updateAdvertDto,
    });

    return new AdvertEntity({
      ...updatedAdvert,
      owner: new PublicUserEntity(updatedAdvert.owner),
      photos: updatedAdvert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: true,
    });
  }

  /**
   * This action removes a selected advert.
   * @param id
   * @returns
   */
  async remove(id: string, userId: string) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id },
    });

    checkOwnership(advert, userId);

    const deletedAdvert = await this.prisma.advert.delete({ where: { id } });

    return new AdvertEntity(deletedAdvert);
  }

  /**
   * This action adds photo objects to a selected advert photo array property.
   * @param advertId
   * @param userId
   * @param photoPaths
   * @returns
   */
  async addPhoto(advertId: string, userId: string, photoPaths: string[]) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id: advertId },
    });

    checkOwnership(advert, userId);

    await this.prisma.photo.createMany({
      data: photoPaths.map((url) => ({ url, advertId })),
    });

    const updatedAdvert = await this.prisma.advert.findUniqueOrThrow({
      where: { id: advertId },
      include: { owner: { select: { username: true } }, photos: true },
    });

    return new AdvertEntity({
      ...updatedAdvert,
      owner: new PublicUserEntity(updatedAdvert.owner),
      photos: updatedAdvert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: true,
    });
  }

  /**
   * This action removes photo object to a selected advert photo array property.
   * @param advertId
   * @param photoId
   * @param userId
   * @returns
   */
  async removePhoto(advertId: string, photoId: string, userId: string) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id: advertId },
      include: { photos: true },
    });

    checkOwnership(advert, userId);

    await this.prisma.photo.delete({ where: { id: photoId } });

    const updatedAdvert = await this.prisma.advert.findUniqueOrThrow({
      where: { id: advertId },
      include: { owner: { select: { username: true } }, photos: true },
    });

    return new AdvertEntity({
      ...updatedAdvert,
      owner: new PublicUserEntity(updatedAdvert.owner),
      photos: updatedAdvert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: true,
    });
  }

  /**
   * This action adds a selected advert to favorite list.
   * @param advertId
   * @param userId
   * @returns
   */
  async addFavorite(advertId: string, userId: string) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id: advertId },
    });

    if (advert.ownerId === userId) {
      throw new ForbiddenException(
        'owned adverts cannot be marked as favorite',
      );
    }

    if (
      await this.prisma.favorite.findUnique({
        where: { userId_advertId: { userId, advertId } },
      })
    ) {
      throw new ForbiddenException('this advert is already marked as favorite');
    }

    await this.prisma.favorite.create({ data: { userId, advertId } });

    return { message: 'advert added to favorites' };
  }

  /**
   * This action removes a selected advert from favorite list.
   * @param advertId
   * @param userId
   * @returns
   */
  async removeFavorite(advertId: string, userId: string) {
    const favorite = await this.prisma.favorite.findUniqueOrThrow({
      where: { userId_advertId: { userId, advertId } },
    });

    if (favorite.userId !== userId) {
      throw new UnauthorizedException('unauthorized to modify this advert');
    }

    await this.prisma.favorite.delete({
      where: { userId_advertId: { userId, advertId } },
    });

    return { message: 'advert removed from favorites' };
  }

  async findFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        advert: {
          include: {
            photos: true,
            owner: { select: { username: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map(
      (favorite) =>
        new AdvertEntity({
          ...favorite.advert,
          owner: new PublicUserEntity(favorite.advert.owner),
          photos: favorite.advert.photos.map((photo) => new PhotoEntity(photo)),
          isOwner: false,
          isFavorite: true,
        }),
    );
  }
}
