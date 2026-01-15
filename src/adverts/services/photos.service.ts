import { PrismaService } from 'src/prisma/prisma.service';
import { assertOwnership } from '../adverts.helper';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AdvertsMapper } from '../adverts.mapper';

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private readonly mapper: AdvertsMapper,
  ) {}

  /**
   * Adds photos to an advert owned by the authenticated user.
   * @param advertId - Advert ID.
   * @param userId - ID of the authenticated user.
   * @param photoPaths - Array of photo URLs to add.
   * @returns Updated AdvertEntity.
   * @throws UnauthorizedException if user is not the owner.
   */
  async uploadPhoto(advertId: string, userId: string, photoPaths: string[]) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id: advertId },
    });

    assertOwnership(advert, userId);

    await this.prisma.photo.createMany({
      data: photoPaths.map((url) => ({ url, advertId })),
    });

    const updatedAdvert = await this.prisma.advert.findUniqueOrThrow({
      where: { id: advertId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            postalCode: true,
            createdAt: true,
            _count: { select: { adverts: true } },
          },
        },
        photos: true,
        _count: { select: { favorites: true } },
      },
    });

    return this.mapper.toAdvertDetailsEntity(updatedAdvert, {
      isOwner: true,
      isFavorite: false,
    });
  }

  /**
   * Removes a photo from an advert owned by the authenticated user.
   * @param advertId - Advert ID.
   * @param photoId - Photo ID to remove.
   * @param userId - ID of the authenticated user.
   * @returns Updated AdvertEntity.
   * @throws UnauthorizedException if user is not the owner.
   */
  async deletePhoto(advertId: string, photoId: string, userId: string) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id: advertId },
      include: { photos: true },
    });

    assertOwnership(advert, userId);

    const photo = advert.photos.find((p) => p.id === photo?.id);

    if (!photo) {
      throw new BadRequestException('This photo does not belong to the advert');
    }

    await this.prisma.photo.delete({ where: { id: photoId } });

    const updatedAdvert = await this.prisma.advert.findUniqueOrThrow({
      where: { id: advertId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            postalCode: true,
            createdAt: true,
            _count: { select: { adverts: true } },
          },
        },
        photos: true,
        _count: { select: { favorites: true } },
      },
    });

    return this.mapper.toAdvertDetailsEntity(updatedAdvert, {
      isOwner: true,
      isFavorite: false,
    });
  }
}
