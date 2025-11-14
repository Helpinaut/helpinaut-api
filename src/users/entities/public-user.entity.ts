import { Exclude, Expose } from 'class-transformer';
import { Advert, Favorite, User } from '@prisma/client';

@Exclude()
export class PublicUserEntity implements User {
  constructor(partial: Partial<PublicUserEntity>) {
    Object.assign(this, partial);
  }

  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  adverts: Advert[];

  @Expose()
  postcode: string | null;

  @Expose()
  createdAt: Date;

  /**
   * Private properties
   */

  @Exclude()
  email: string;

  @Exclude()
  password: string;

  @Exclude()
  favorites: Favorite[];

  @Exclude()
  latitude: number | null;

  @Exclude()
  longitude: number | null;

  @Exclude()
  updatedAt: Date;
}
