import { ApiProperty } from '@nestjs/swagger';
import { Category, Status } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';
import { PublicUserEntity } from 'src/users/entities/public-user.entity';
import { PhotoEntity } from './photo.entity';

export class AdvertEntity {
  constructor(partial: Partial<AdvertEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  price: number;

  @ApiProperty({ enum: Category })
  @Expose()
  category: Category;

  @ApiProperty()
  @Expose()
  offer: boolean;

  @ApiProperty({ required: false, type: [PhotoEntity] })
  @Expose()
  photos?: PhotoEntity[];

  @ApiProperty({ enum: Status })
  @Expose()
  status: Status;

  @ApiProperty({ type: PublicUserEntity })
  @Expose()
  owner: PublicUserEntity;

  @ApiProperty()
  @Expose()
  distance?: number | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  isOwner: boolean;

  @ApiProperty()
  @Expose()
  isFavorite: boolean;

  @ApiProperty()
  @Expose()
  favoriteCount: number;

  /**
   * Private properties
   */

  @Exclude()
  ownerId: string;
}
