import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Category, Prisma, Status } from '@prisma/client';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { UpdateAdvertDto } from './dto/update-advert.dto';
import { AdvertEntity } from './entities/advert.entity';
import { assertOwnership } from 'src/utils/assert-ownership.util';
import { parseEnumValue } from 'src/utils/parse-enum-value.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { PhotoEntity } from './entities/photo.entity';
import { FilterAdvertDto } from './dto/filter-advert.dto';
import {
  OwnerDetailsEntity,
  OwnerSummaryEntity,
} from 'src/users/entities/owner.entity';

@Injectable()
export class AdvertsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculates pagination parameters (limit and offset) from filter DTO.
   * @param filters - DTO containing filter pagination options
   * @returns Object with `limit` and `offset` values for SQL queries.
   */
  private getPagination(filters: FilterAdvertDto) {
    const { limit = 20, page = 1 } = filters;

    return { limit, offset: (page - 1) * limit };
  }

  /**
   * Resolves the geographic coordinates to be used for distance calculations.
   * Priority order:
   * 1. Logged user's location (if `useUserLocation` is `true`).
   * 2. Manual coordinates provided in filters.
   * 3. No coordinates (distance filtering disabled).
   * @param userId - ID of the authenticated user (nullable)
   * @param filters - Advert filter DTO
   * @throws UnauthorizedException if user location is requested but no user is logged in.
   * @throws BaqRequestException if user has no defined location.
   * @returns Coordinates object or `null` if no location should be used.
   */
  private async resolveCoordinates(
    userId: string | null,
    filters: FilterAdvertDto,
  ): Promise<{ latitude: number; longitude: number } | null> {
    if (filters.useUserLocation) {
      if (!userId) {
        throw new UnauthorizedException('Login required to use user location');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { latitude: true, longitude: true },
      });

      if (user?.latitude == null || user?.longitude == null) {
        throw new BadRequestException('User has no location set');
      }

      return { latitude: user.latitude, longitude: user.longitude };
    }

    if (filters.latitude != null && filters.longitude != null) {
      return { latitude: filters.latitude, longitude: filters.longitude };
    }

    return null;
  }

  /**
   * Builds a SQL expression to calculate distance (in Km).
   * Includes clamping to avoid NaN results by floating-point precision errors in the acos function.
   * @param lat - Origin latitude.
   * @param lon - Origin longitude.
   * @returns Prisma SQL fragment representing the distance calculation.
   */
  private buildDistanceExpression(lat: number, lon: number): Prisma.Sql {
    return Prisma.sql`
      ROUND(
      6371 * acos(
        LEAST(
          1,
          GREATEST(
            -1,
            cos(radians(${lat}))
            * cos(radians("Advert"."latitude"))
            * cos(
              radians("Advert"."longitude") - radians(${lon})
            )
            + sin(radians(${lat}))
            * sin(radians("Advert"."latitude"))
          )
        )
      )
    )
    `;
  }

  /**
   * Builds SQL WHERE conditions and distance-related expressions based on the provided filters and coordinates.
   * @param filters - Advert filter DTO
   * @param coordinates - Coordinates used for distance calculation or null
   * @returns Object containing SQL fragments for WHERE clause and distance logic.
   */
  private buildWhereConditions(
    filters: FilterAdvertDto,
    coordinates: { latitude: number; longitude: number } | null,
  ) {
    const where: Prisma.Sql[] = [Prisma.sql`"Advert"."status" = 'ACTIVE'`];

    if (filters.title) {
      where.push(
        Prisma.sql`LOWER("Advert"."title") LIKE ${`%${filters.title}%`}`,
      );
    }

    if (filters.minPrice != null) {
      where.push(Prisma.sql`"Advert"."price" >= ${filters.minPrice}`);
    }

    if (filters.maxPrice != null) {
      where.push(Prisma.sql`"Advert"."price" <= ${filters.maxPrice}`);
    }

    if (filters.category) {
      where.push(Prisma.sql`"Advert"."category" = ${filters.category}`);
    }

    if (filters.isOffer != null) {
      where.push(Prisma.sql`"Advert"."offer" = ${filters.isOffer}`);
    }

    let distanceSql: Prisma.Sql = Prisma.sql`NULL`;
    let distanceFilterSql: Prisma.Sql | null = null;

    if (coordinates) {
      distanceSql = this.buildDistanceExpression(
        coordinates.latitude,
        coordinates.longitude,
      );

      if (filters.maxDistance != null) {
        where.push(
          Prisma.sql`
            "Advert"."latitude" IS NOT NULL AND "Advert"."longitude" IS NOT NULL
          `,
        );

        distanceFilterSql = Prisma.sql`
        ${distanceSql} <= ${filters.maxDistance}
      `;
      }
    }

    const whereSql =
      where.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`
        : Prisma.empty;

    return { whereSql, distanceSql, distanceFilterSql };
  }

  /**
   * Executes the main raw SQL query to retrieve adverts with filtering, pagination, distance calculation when coordinates are provided and favorite info.
   * Applies ordering by distance, popularity and creation date.
   * @param params - Query parameters including pagination and filters
   * @returns Array of AdvertEntity objects.
   */
  private getAdvertsRaw(params: {
    userId: string | null;
    limit: number;
    offset: number;
    whereSql: Prisma.Sql;
    distanceSql: Prisma.Sql;
    distanceFilterSql: Prisma.Sql | null;
    popular: boolean;
  }) {
    const {
      userId,
      limit,
      offset,
      whereSql,
      distanceSql,
      distanceFilterSql,
      popular,
    } = params;

    return this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          "Advert".*,
          (
            SELECT "url"
            FROM "Photo"
            WHERE "Photo"."advertId" = "Advert"."id"
            ORDER BY "createdAt" ASC
            LIMIT 1
          ) AS "thumbnailUrl",
          "User"."id" AS "ownerId",
          "User"."username" AS "ownerUsername",
          ${distanceSql} AS distance,
          CASE
            WHEN "FavUser"."id" IS NULL THEN false
            ELSE true
          END AS "isFavorite",
          COUNT("FavAll"."id") AS "favoriteCount",
        FROM "Advert"
        JOIN "User" ON "Advert"."ownerId" = "User"."id"
        LEFT JOIN "Favorite" "FavAll"
          ON "FavAll"."advertId" = "Advert"."id"
        LEFT JOIN "Favorite" "FavUser"
          ON "FavUser"."advertId" = "Advert"."id"
          AND "FavUser"."userId" = ${userId}
        ${whereSql}
        ${distanceFilterSql ? Prisma.sql`AND ${distanceFilterSql}` : Prisma.empty}
        GROUP BY
          "Advert"."id",
          "User"."id",
          "FavUser"."id"
        ORDER BY
          distance NULLS LAST,
          ${popular ? Prisma.sql`"Advert"."viewCount" DESC,` : Prisma.empty}
          "Advert"."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset};
      `);
  }

  /**
   * Creates a new advert for the authenticated user.
   * @param createAdvertDto - Data transfer object containing advert details.
   * @param ownerId - ID of the user creating the advert.
   * @param photoPaths - Array og photo URLs to attach to the advert.
   * @returns AdvertEntity representing the created advert.
   * @throws BadRequestException if user has no location set.
   */
  async create(
    createAdvertDto: CreateAdvertDto,
    ownerId: string,
    photoPaths: string[],
  ) {
    const parsedCategory = parseEnumValue(createAdvertDto.category, Category);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: { latitude: true, longitude: true },
    });

    if (!user.latitude || !user.longitude) {
      throw new BadRequestException(
        'User must set location before creating adverts',
      );
    }

    const createdAdvert = await this.prisma.advert.create({
      data: {
        ...createAdvertDto,
        category: parsedCategory as Category,
        photos: {
          create: photoPaths.map((url) => ({ url })),
        },
        ownerId,
        latitude: user.latitude,
        longitude: user.longitude,
      },
      include: {
        photos: true,
        owner: {
          select: {
            id: true,
            username: true,
            postalCode: true,
            createdAt: true,
            _count: { select: { adverts: true } },
          },
        },
        _count: { select: { favorites: true } },
      },
    });

    return new AdvertEntity({
      ...createdAdvert,
      photos: createdAdvert.photos.map((photo) => new PhotoEntity(photo)),
      owner: new OwnerDetailsEntity({
        id: createdAdvert.owner.id,
        username: createdAdvert.owner.username,
        postalCode: createdAdvert.owner.postalCode,
        createdAt: createdAdvert.owner.createdAt,
        advertsCount: createdAdvert.owner._count.adverts,
      }),
      isOwner: true,
      isFavorite: false,
      favoriteCount: createdAdvert._count.favorites,
    });
  }

  /**
   * Retrieves all adverts with optional filters and pagination.
   * @param userId - ID of the authenticated user (nullable).
   * @param filters - FilterAdvertDto containing query parameters.
   * @returns Array of AdvertEntity objects.
   * @throws BadRequestException if pagination settings are invalid.
   * @throws UnauthorizedException if user location is requested without authentication.
   */
  async getAll(userId: string | null, filters: FilterAdvertDto) {
    const { limit, offset } = this.getPagination(filters);
    const coordinates = await this.resolveCoordinates(userId, filters);
    const { whereSql, distanceSql, distanceFilterSql } =
      this.buildWhereConditions(filters, coordinates);

    const adverts = await this.getAdvertsRaw({
      limit,
      offset,
      userId,
      whereSql,
      distanceSql,
      distanceFilterSql,
      popular: filters.popular ?? false,
    });

    return adverts.map((advert) => {
      new AdvertEntity({
        ...advert,
        owner: new OwnerSummaryEntity({
          id: advert.ownerId,
          username: advert.ownerUsername,
        }),
        photos: advert.thumbnailUrl
          ? [new PhotoEntity({ url: advert.thumbnail })]
          : [],
        isOwner: advert.ownerId === userId,
        isFavorite: advert.isFavorite,
        favoriteCount: Number(advert.favoriteCount),
        distance: advert.distance ?? null,
      });
    });
  }

  /**
   * Retrieves a single advert by ID.
   * @param id - Advert ID
   * @param userId - ID of the authenticated user (nullable)
   * @returns AdvertEntity with owner and photos populated.
   * @throws NotFoundException if advert does not exist.
   */
  async getById(id: string, userId: string | null) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id },
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

    const isOwner = userId === advert.ownerId;
    const isFavorite = userId
      ? await this.prisma.favorite.findUnique({
          where: { userId_advertId: { userId, advertId: advert.id } },
        })
      : null;

    if (!isOwner) {
      await this.prisma.advert.update({
        where: { id },
        data: { views: { increment: 1 } },
      });

      advert.views += 1;
    }

    return new AdvertEntity({
      ...advert,
      owner: new OwnerDetailsEntity({
        id: advert.owner.id,
        username: advert.owner.username,
        postalCode: advert.owner.postalCode,
        createdAt: advert.owner.createdAt,
        advertsCount: advert.owner._count.adverts,
      }),
      photos: advert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner,
      isFavorite: !!isFavorite,
      favoriteCount: advert._count.favorites,
    });
  }

  /**
   * Updates an existing advert owned by the authenticated user.
   * @param id - Advert ID.
   * @param userId - ID of the authenticated user.
   * @param updateAdvertDto - DTO containing fields to update.
   * @returns Updated AdvertEntity.
   * @throws UnauthorizedException if user is not the owner.
   */
  async update(id: string, userId: string, updateAdvertDto: UpdateAdvertDto) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id },
    });
    const { photos: _ignoredPhotos, ...updateDto } = updateAdvertDto;

    assertOwnership(advert, userId);

    // Normalize enums if provided
    if (updateDto.category) {
      updateAdvertDto.category = parseEnumValue(updateDto.category, Category);
    }

    if (updateDto.status) {
      updateDto.status = parseEnumValue(updateDto.status, Status);
    }

    const updatedAdvert = await this.prisma.advert.update({
      where: { id },
      data: updateDto,
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

    return new AdvertEntity({
      ...updatedAdvert,
      owner: new OwnerDetailsEntity({
        id: updatedAdvert.owner.id,
        username: updatedAdvert.owner.username,
        postalCode: updatedAdvert.owner.postalCode,
        createdAt: updatedAdvert.owner.createdAt,
        advertsCount: updatedAdvert.owner._count.adverts,
      }),
      photos: updatedAdvert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: true,
      isFavorite: false,
      favoriteCount: updatedAdvert._count.favorites,
    });
  }

  /**
   * Deletes an advert owned by the authenticated user.
   * @param id - Advert ID.
   * @param userId - ID of the authenticated user.
   * @returns Deleted AdvertEntity.
   * @throws UnauthorizedException if user is not the owner.
   */
  async delete(id: string, userId: string) {
    const advert = await this.prisma.advert.findUniqueOrThrow({
      where: { id },
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

    assertOwnership(advert, userId);

    await this.prisma.advert.delete({ where: { id } });

    return new AdvertEntity({
      ...advert,
      owner: new OwnerDetailsEntity({
        id: advert.owner.id,
        username: advert.owner.username,
        postalCode: advert.owner.postalCode,
        createdAt: advert.owner.createdAt,
        advertsCount: advert.owner._count.adverts,
      }),
      photos: advert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: true,
      isFavorite: false,
      favoriteCount: advert._count.favorites,
    });
  }

  /**
   * Retrieves all available categories for adverts.
   * @returns Array of objects with `value` and `label` for each category.
   */
  getCategories() {
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

    return new AdvertEntity({
      ...updatedAdvert,
      owner: new OwnerDetailsEntity({
        id: updatedAdvert.owner.id,
        username: updatedAdvert.owner.username,
        postalCode: updatedAdvert.owner.postalCode,
        createdAt: updatedAdvert.owner.createdAt,
        advertsCount: updatedAdvert.owner._count.adverts,
      }),
      photos: updatedAdvert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: true,
      isFavorite: false,
      favoriteCount: updatedAdvert._count.favorites,
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

    return new AdvertEntity({
      ...updatedAdvert,
      owner: new OwnerDetailsEntity({
        id: updatedAdvert.owner.id,
        username: updatedAdvert.owner.username,
        postalCode: updatedAdvert.owner.postalCode,
        createdAt: updatedAdvert.owner.createdAt,
        advertsCount: updatedAdvert.owner._count.adverts,
      }),
      photos: updatedAdvert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: true,
      isFavorite: false,
      favoriteCount: updatedAdvert._count.favorites,
    });
  }

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

    return favorites.map(
      (favorite) =>
        new AdvertEntity({
          ...favorite.advert,
          owner: new OwnerSummaryEntity({
            id: favorite.advert.owner.id,
            username: favorite.advert.owner.username,
          }),
          photos: favorite.advert.photos.map((photo) => new PhotoEntity(photo)),
          isOwner: false,
          isFavorite: true,
          favoriteCount: favorite.advert._count.favorites,
          distance: null,
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

    return new AdvertEntity({
      ...updatedAdvert,
      owner: new OwnerDetailsEntity({
        id: updatedAdvert.owner.id,
        username: updatedAdvert.owner.username,
        postalCode: updatedAdvert.owner.postalCode,
        createdAt: updatedAdvert.owner.createdAt,
        advertsCount: updatedAdvert.owner._count.adverts,
      }),
      photos: updatedAdvert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: false,
      isFavorite: true,
      favoriteCount: updatedAdvert._count.favorites,
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

    return new AdvertEntity({
      ...updatedAdvert,
      owner: new OwnerDetailsEntity({
        id: updatedAdvert.owner.id,
        username: updatedAdvert.owner.username,
        postalCode: updatedAdvert.owner.postalCode,
        createdAt: updatedAdvert.owner.createdAt,
        advertsCount: updatedAdvert.owner._count.adverts,
      }),
      photos: updatedAdvert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: false,
      isFavorite: false,
      favoriteCount: updatedAdvert._count.favorites,
    });
  }
}
