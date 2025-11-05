import { BadRequestException, Injectable } from '@nestjs/common';

import { Category, Status } from '@prisma/client';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { UpdateAdvertDto } from './dto/update-advert.dto';
import { AdvertEntity } from './entities/advert.entity';
import { checkOwnership } from 'src/utils/check-ownership.util';
import { normalizeEnum } from 'src/utils/normalize-enum.util';
import { PrismaService } from 'src/prisma/prisma.service';

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
    const normalizedCategory = createAdvertDto.category
      .toUpperCase()
      .replace(/\s+/g, '_') as keyof typeof Category;

    if (!(normalizedCategory in Category)) {
      throw new BadRequestException(
        `category must be one of the following values: ${Object.keys(Category).join(', ')}`,
      );
    }

    const newAdvert = await this.prisma.advert.create({
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

    return new AdvertEntity(newAdvert);
  }

  /**
   * This action returns all adverts.
   * @returns AdvertEntity[]
   */
  async findAll() {
    const adverts = await this.prisma.advert.findMany({
      where: { status: 'ACTIVE' },
      include: { owner: { select: { username: true } }, photos: true },
      orderBy: { createdAt: 'desc' },
    });

    return adverts.map((advert) => new AdvertEntity(advert));
  }

  /**
   * This action returns a selected advert.
   * @param id
   * @returns AdvertEntity
   */
  async findOne(id: string, userId?: string) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id },
      include: { owner: { select: { username: true } }, photos: true },
    });
    const isOwner = userId ? advert.ownerId === userId : false;

    return new AdvertEntity({ ...advert, isOwner });
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

    //TODO add/remove photos

    const updatedAdvert = await this.prisma.advert.update({
      where: { id },
      data: updateAdvertDto,
    });

    return new AdvertEntity(updatedAdvert);
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
}
