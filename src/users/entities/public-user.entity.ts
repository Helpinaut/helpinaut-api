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
  updatedAt: Date;
}
