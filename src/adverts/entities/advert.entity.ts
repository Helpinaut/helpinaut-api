import { ApiProperty } from '@nestjs/swagger';
import { Category, Status } from '@prisma/client';

export class AdvertEntity {
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
  photo?: string | null;

  @ApiProperty({ required: false })
  isFavorite?: boolean;

  @ApiProperty({ enum: Status })
  status: Status;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
