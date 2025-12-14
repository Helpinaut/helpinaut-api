import { ApiProperty } from '@nestjs/swagger';
import { Advert, Favorite } from '@prisma/client';
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { AdvertEntity } from 'src/adverts/entities/advert.entity';
import { FavoriteEntity } from 'src/adverts/entities/favorite.entity';

export class UserEntity {
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, plainToInstance(UserEntity, partial));
  }

  @ApiProperty({ description: 'Unique identifier of the user' })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'user@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Username of the user', example: 'john' })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'List of adverts created by the user',
    type: [AdvertEntity],
  })
  @Expose()
  adverts: AdvertEntity[];

  @ApiProperty({
    description: 'List of favorite adverts marked by the user',
    type: [FavoriteEntity],
  })
  favorites: FavoriteEntity[];

  @ApiProperty({
    description: 'Postal code of the user',
    example: '41011',
    required: false,
  })
  postalCode: string | null;

  @ApiProperty({ description: 'Latitude of the user', required: false })
  latitude: number | null;

  @ApiProperty({ description: 'Longitude of the user', required: false })
  longitude: number | null;

  @ApiProperty({ description: 'Date when the user account was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the user account was last updated' })
  updatedAt: Date;

  // Private properties (excluded from API responses)
  @Exclude()
  password: string;
}
