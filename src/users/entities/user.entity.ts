import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { AdvertEntity } from 'src/adverts/entities/advert.entity';
import { FavoriteEntity } from 'src/adverts/entities/favorite.entity';

export class UserEntity {
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, plainToInstance(UserEntity, partial));
  }

  // Identifiers and basics
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
    description: 'Postal code of the user',
    example: '41001',
  })
  @Expose()
  postalCode: string;

  // Relations
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

  // Location
  @ApiProperty({ description: 'Latitude of the user', required: false })
  latitude: number;

  @ApiProperty({ description: 'Longitude of the user', required: false })
  longitude: number;

  // Metadata
  @ApiProperty({ description: 'Date when the user account was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the user account was last updated' })
  updatedAt: Date;

  // Private properties (excluded from API responses)
  @Exclude()
  password: string;
}
