import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AdvertEntity } from 'src/adverts/entities/advert.entity';

/**
 * Minimal public representation of a user.
 * Used when embedding owner information inside adverts.
 */
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

/**
 * Detailed public representation of a user.
 * Used when viewing a user's public profile, including their adverts.
 */
@Exclude()
export class OwnerDetailsEntity {
  constructor(partial: Partial<OwnerDetailsEntity>) {
    Object.assign(this, plainToInstance(OwnerDetailsEntity, partial));
  }

  // Identifiers and basics
  @ApiProperty({ description: 'Unique identifier of the owner' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Public username of owner', example: 'john' })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'Postal code of the owner',
    example: '41001',
    required: false,
  })
  @Expose()
  postalCode: string | null;

  // Relations
  @ApiProperty({
    description: 'List of adverts published by the owner',
    type: [AdvertEntity],
    required: false,
  })
  @Expose()
  adverts?: AdvertEntity[];

  // Metadata
  @ApiProperty({ description: 'Date when the user account was created' })
  @Expose()
  createdAt: Date;

  // Derived properties
  @ApiProperty({
    description: 'Number of adverts published by the owner',
    example: 5,
  })
  @Expose()
  advertsCount?: number;
}
