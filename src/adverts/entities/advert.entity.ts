import { ApiProperty } from '@nestjs/swagger';
import { Category, Photo, Status } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class AdvertEntity {
  constructor(partial: Partial<AdvertEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: Category })
  category: Category;

  @ApiProperty()
  offer: boolean;

  @ApiProperty({ required: false })
  photos?: Photo[];

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isOwner: boolean;

  @Exclude()
  ownerId: string;
}
