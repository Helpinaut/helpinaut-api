import { ApiProperty } from '@nestjs/swagger';
import { Category, Status } from '@prisma/client';
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { OwnerSummaryEntity } from 'src/users/entities/owner.entity';
import { PhotoEntity } from './photo.entity';

export class AdvertEntity {
  constructor(partial: Partial<AdvertEntity>) {
    Object.assign(this, plainToInstance(AdvertEntity, partial));
  }

  // Identifiers and basics
  @ApiProperty({ description: 'Unique identifier of the advert' })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Advert title',
    example: 'Electrician available for home repairs',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the advert',
    example: 'Certified electrician with 10 years of experience.',
  })
  @Expose()
  description: string;

  @ApiProperty({ description: 'Price of the advert', example: 50 })
  @Expose()
  price: number;

  @ApiProperty({ enum: Category, description: 'Advert category' })
  @Expose()
  category: Category;

  @ApiProperty({
    description:
      'Indicates if the advert is an offer (true) or a request (false)',
    example: true,
  })
  @Expose()
  isOffer: boolean;

  // Relations
  @ApiProperty({
    type: [PhotoEntity],
    description: 'List of advert photos',
    required: false,
  })
  @Expose()
  photos?: PhotoEntity[];

  @ApiProperty({
    type: OwnerSummaryEntity,
    description: 'Public information of the advert owner',
  })
  @Expose()
  owner: OwnerSummaryEntity;

  // Status and location
  @ApiProperty({
    enum: Status,
    description: 'Current status of the advert',
    example: Status.ACTIVE,
  })
  @Expose()
  status: Status;

  @ApiProperty({
    description: 'Distance in KM from user location (calculated)',
    example: 12.5,
    required: false,
  })
  @Expose()
  distance?: number | null;

  // Metadata
  @ApiProperty({ description: 'Date when the advert was created' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Date when the advert was last updated' })
  @Expose()
  updatedAt: Date;

  // Derived properties
  @ApiProperty({
    description: 'Indicates if the logged user is the owner of the advert',
    example: false,
  })
  @Expose()
  isOwner: boolean;

  @ApiProperty({
    description:
      'Indicates if the advert is marked as favorite by the logged user',
    example: true,
  })
  @Expose()
  isFavorite: boolean;

  @ApiProperty({
    description: 'Number of users who marked this advert as favorite',
    example: 5,
  })
  @Expose()
  favoriteCount: number;

  @ApiProperty({
    description: 'Number of times the advert has been viewed',
    example: 12,
  })
  @Expose()
  viewCount: number;

  // Private properties (excluded from API responses)
  @Exclude()
  ownerId: string;
}
