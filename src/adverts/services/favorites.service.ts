import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AdvertsMapper } from '../adverts.mapper';

@Injectable()
export class FavoritesService {
  constructor(
    private prisma: PrismaService,
    private readonly mapper: AdvertsMapper,
  ) {}
  /**
   * Retrieves all adverts marked as favorite by the authenticated user.
   * @param userId - ID of the authenticated user (nullable).
   * @returns Array of AdvertEntity objects.
   * @throws UnauthorizedException if user is not authenticated.
   */
  async getFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        advert: {
          include: {
            owner: { select: { id: true, username: true } },
            photos: true,
            _count: { select: { favorites: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((favorite) =>
      this.mapper.toAdvertSummaryEntity(favorite.advert, {
        isOwner: false,
        isFavorite: true,
      }),
    );
  }

  /**
   * Marks an advert as favorite for the authenticated user.
   * @param advertId - Advert ID.
   * @param userId - ID of the authenticated user.
   * @returns Updated AdvertEntity with `isFavorite` set to `true`.
   * @throws ForbiddenException if user owns the advert or already marked it as favorite.
   */
  async addFavorite(advertId: string, userId: string) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
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

    if (advert.ownerId === userId) {
      throw new ForbiddenException(
        'Owned adverts cannot be marked as favorite',
      );
    }

    const favoriteAdvert = await this.prisma.favorite.findUnique({
      where: { userId_advertId: { userId, advertId } },
    });

    if (favoriteAdvert) {
      throw new ForbiddenException('This advert is already marked as favorite');
    }

    await this.prisma.favorite.create({ data: { userId, advertId } });

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
      isOwner: false,
      isFavorite: true,
    });
  }

  /**
   * Removes an advert marked as favorite from the authenticated user.
   * @param advertId - Advert ID.
   * @param userId - ID of the authenticated user.
   * @returns Updated AdvertEntity with `isFavorite` set to `false`.
   * @throws UnauthorizedException if user is not authenticated.
   */
  async deleteFavorite(advertId: string, userId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { userId_advertId: { userId, advertId } },
    });

    if (!favorite) {
      throw new BadRequestException('This advert was not marked as favorite');
    }

    if (favorite.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to modify this advert',
      );
    }

    await this.prisma.favorite.delete({
      where: { userId_advertId: { userId, advertId } },
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
      isOwner: false,
      isFavorite: false,
    });
  }
}
