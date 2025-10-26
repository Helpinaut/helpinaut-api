import { ApiProperty } from '@nestjs/swagger';
import { Advert, Favorite, User } from '@prisma/client';

type UserWithoutPassword = Omit<User, 'password'>;

export class UserEntity implements UserWithoutPassword {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  adverts: Advert[] | null;

  @ApiProperty()
  favorites: Favorite[] | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
