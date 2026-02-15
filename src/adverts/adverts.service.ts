import { BadRequestException, Injectable } from '@nestjs/common';
import { Category, Prisma, Status } from '@prisma/client';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { UpdateAdvertDto } from './dto/update-advert.dto';
import {
  assertOwnership,
  getPagination,
  resolveCoordinates,
  parseEnumValue,
} from './adverts.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterAdvertDto } from './dto/filter-advert.dto';
import { AdvertsMapper } from './adverts.mapper';
import path from 'path';
import { unlink } from 'fs/promises';

@Injectable()
export class AdvertsService {
  constructor(
    private prisma: PrismaService,
    private readonly mapper: AdvertsMapper,
  ) {}

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
      where.push(
        Prisma.sql`"Advert"."category" = ${Prisma.sql`${filters.category}::"Category"`}`,
      );
    }

    if (filters.isOffer != null) {
      where.push(
        Prisma.sql`"Advert"."isOffer" = ${Prisma.sql`${filters.isOffer}::boolean`}`,
      );
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

    const advertsRaw = this.prisma.$queryRaw<any[]>(Prisma.sql`
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
          CASE
            WHEN "Advert"."ownerId" = ${userId} THEN NULL
            ELSE ${distanceSql}
          END AS distance,
          CASE
            WHEN "FavUser"."id" IS NULL THEN false
            ELSE true
          END AS "isFavorite",
          COUNT("FavAll"."id") AS "favoriteCount"
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

    return advertsRaw;
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

    if (user.latitude == null || user.longitude == null) {
      throw new BadRequestException('User has no location set');
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

    return this.mapper.toAdvertDetailsEntity(createdAdvert, {
      isOwner: true,
      isFavorite: false,
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
    const { limit, offset } = getPagination(filters);
    const coordinates = await resolveCoordinates(userId, filters, this.prisma);
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

    return adverts.map((advert) =>
      this.mapper.toAdvertSummaryEntity(advert, {
        isOwner: advert.ownerId === userId,
        isFavorite: advert.isFavorite,
        favoriteCount: Number(advert.favoriteCount) ?? 0,
        distance: advert.distance,
      }),
    );
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
      ? (await this.prisma.favorite.findUnique({
          where: { userId_advertId: { userId, advertId: advert.id } },
        })) !== null
      : false;

    if (!isOwner) {
      await this.prisma.advert.update({
        where: { id },
        data: { views: { increment: 1 } },
      });

      advert.views += 1;
    }

    return this.mapper.toAdvertDetailsEntity(advert, {
      isOwner,
      isFavorite,
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

    return this.mapper.toAdvertDetailsEntity(updatedAdvert, {
      isOwner: true,
      isFavorite: false,
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

    if (advert.photos) {
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

    await this.prisma.favorite.deleteMany({ where: { advertId: advert.id } });

    await this.prisma.advert.delete({ where: { id } });

    return this.mapper.toAdvertDetailsEntity(advert, {
      isOwner: true,
      isFavorite: false,
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
}
