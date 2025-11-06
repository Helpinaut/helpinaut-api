import { BadRequestException, Injectable } from '@nestjs/common';

import { Category, Status } from '@prisma/client';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { UpdateAdvertDto } from './dto/update-advert.dto';
import { AdvertEntity } from './entities/advert.entity';
import { checkOwnership } from 'src/utils/check-ownership.util';
import { normalizeEnum } from 'src/utils/normalize-enum.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { PublicUserEntity } from 'src/users/entities/public-user.entity';
import { PhotoEntity } from './entities/photo.entity';

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

    const createdAdvert = await this.prisma.advert.create({
      data: {
        ...createAdvertDto,
        category: normalizedCategory as Category,
        photos: {
          create: photoPaths.map((url) => ({ url })),
        },
        ownerId,
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
  async findAll(userId: string | null) {
    const adverts = await this.prisma.advert.findMany({
      where: { status: 'ACTIVE' },
      include: { owner: { select: { username: true } }, photos: true },
      orderBy: { createdAt: 'desc' },
    });

    return adverts.map(
      (advert) =>
        new AdvertEntity({
          ...advert,
          owner: new PublicUserEntity(advert.owner),
          isOwner: userId ? advert.ownerId === userId : false,
        }),
    );
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
}
