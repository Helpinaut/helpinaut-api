import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { Advert, Favorite } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { AdvertEntity } from 'src/adverts/entities/advert.entity';

@Exclude()
export class OwnerSummaryEntity {
  constructor(partial: Partial<OwnerSummaryEntity>) {
    Object.assign(this, plainToInstance(OwnerSummaryEntity, partial));
  }

  @ApiProperty({ description: 'Unique identifier of the owner' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Public username of owner', example: 'john' })
  @Expose()
  username: string;
}

@Exclude()
export class OwnerDetailsEntity {
  constructor(partial: Partial<OwnerDetailsEntity>) {
    Object.assign(this, plainToInstance(OwnerDetailsEntity, partial));
  }

  @ApiProperty({ description: 'Unique identifier of the owner' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Public username of owner', example: 'john' })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'Postal code of the owner',
    example: '41011',
    required: false,
  })
  @Expose()
  postalCode: string | null;

  @ApiProperty({ description: 'Date when the user account was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Number of adverts published by the owner',
    example: 5,
  })
  @Expose()
  advertsCount?: number;
}

@Exclude()
export class PublicUserEntity {
  constructor(partial: Partial<PublicUserEntity>) {
    Object.assign(this, plainToInstance(PublicUserEntity, partial));
  }

  @ApiProperty({
    description: 'Unique identifier of the user',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Public username of the user', example: 'john' })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'List of adverts published by the user',
    type: [AdvertEntity],
    required: false,
  })
  @Expose()
  adverts: Advert[];

  @ApiProperty({
    description: 'Postal code of the user (optional)',
    example: '41011',
    required: false,
  })
  @Expose()
  postalCode: string | null;

  @ApiProperty({ description: 'Date when the user account was created' })
  @Expose()
  createdAt: Date;

  // Private properties (excluded from API responses)
  @Exclude()
  email: string;

  @Exclude()
  password: string;

  @Exclude()
  favorites: any[];

  @Exclude()
  latitude: number | null;

  @Exclude()
  longitude: number | null;

  @Exclude()
  updatedAt: Date;
}
