import { ApiProperty } from '@nestjs/swagger';
import { Advert, Favorite, User } from '@prisma/client';
import { Exclude } from 'class-transformer';

type UserWithoutPassword = Omit<User, 'password'>;

export class UserEntity implements UserWithoutPassword {
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  adverts: Advert[];

  @ApiProperty()
  favorites: Favorite[];

  @ApiProperty()
  postcode: string | null;

  @ApiProperty()
  latitude: number | null;

  @ApiProperty()
  longitude: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  /**
   * Private properties
   */

  @Exclude()
  password: string;
}
