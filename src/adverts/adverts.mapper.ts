import { Injectable } from '@nestjs/common';
import { AdvertEntity } from './entities/advert.entity';
import {
  OwnerDetailsEntity,
  OwnerSummaryEntity,
} from 'src/users/entities/owner.entity';
import { PhotoEntity } from './entities/photo.entity';

/**
 * Values derived from the request context or user identity.
 * These are not part of the raw advert records returned by the database.
 */
type DerivedValues = {
  isOwner: boolean;
  isFavorite: boolean;
  favoriteCount?: number;
  distance?: number | null;
};

@Injectable()
export class AdvertsMapper {
  /**
   * Maps raw owner record into an owner user entity with minimum information.
   * Used in list responses where only minimal owner information is required.
   * @param owner - User record
   * @returns
   */
  toOwnerSummaryEntity(owner: any) {
    return new OwnerSummaryEntity({
      id: owner.id,
      username: owner.username,
    });
  }

  /**
   * Maps raw owner record into an owner user entity with some information.
   * Used in detailed advert responses where only more owner information is required.
   * @param owner - User record
   * @returns
   */
  toOwnerDetailsEntity(owner: any) {
    return new OwnerDetailsEntity({
      id: owner.id,
      username: owner.username,
      postalCode: owner.postalCode,
      createdAt: owner.createdAt,
      advertsCount: owner._count.adverts,
    });
  }

  /**
   * Maps raw advert record into advert entity with minimum owner information.
   * This format is used for list endpoints such as:
   * - `getAll()`
   * - `getFavorites()`
   *
   * Summary characteristics:
   * - Owner is represented as `OwnerSummaryEntity`
   * - Photos contain only a single thumbnail (if available)
   * - Derived values (`isOwner`, `isFavorite`, `distance`, `favoriteCount`) are injected from the service
   * @param advert - Advert record from Prisma or SQL query.
   * @param derived - Derived values computed in the service layer.
   * @returns AdvertEntity with minimal owner data.
   */
  toAdvertSummaryEntity(advert: any, derived: DerivedValues) {
    return new AdvertEntity({
      ...advert,
      owner: this.toOwnerSummaryEntity(advert.owner),
      photos: advert.thumbnailUrl
        ? [new PhotoEntity({ url: advert.thumbnailUrl })]
        : [],
      isOwner: derived.isOwner,
      isFavorite: derived.isFavorite,
      favoriteCount: derived.favoriteCount,
      distance: derived.distance,
    });
  }

  /**
   * Maps raw advert record into advert entity with some owner information.
   * This format is used for endpoints that return a full advert:
   * - `create()`
   * - `update()`
   * - `delete()`
   * - `getById()`
   * - `uploadPhoto()`
   * - `deletePhoto()`
   * - `addFavorite()`
   * - `deleteFavorite()`
   *
   * Detailed characteristics:
   * - Owner is represented as `OwnerDetailsEntity`
   * - All photos are included
   * - Derived values (`isOwner`, `isFavorite`, `distance`) are injected from the service
   * - `favoriteCount` is taken from `_count.favorites`
   * @param advert - Advert record from Prisma or SQL query.
   * @param derived - Derived values computed in the service layer.
   * @returns AdvertEntity with some owner data.
   */
  toAdvertDetailsEntity(advert: any, derived: DerivedValues) {
    return new AdvertEntity({
      ...advert,
      owner: this.toOwnerDetailsEntity(advert.owner),
      photos: advert.photos.map((photo) => new PhotoEntity(photo)),
      isOwner: derived.isOwner,
      isFavorite: derived.isFavorite,
      favoriteCount: advert._count.favorites,
      distance: derived.distance,
    });
  }
}
