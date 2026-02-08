import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToInstance } from 'class-transformer';

@Exclude()
export class PhotoEntity {
  constructor(partial: Partial<PhotoEntity>) {
    Object.assign(this, plainToInstance(PhotoEntity, partial));
  }

  @ApiProperty({ description: 'Unique identifier of the photo' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Public URL of the photo' })
  @Expose()
  url: string;

  @ApiProperty({ description: 'Date when the photo was uploaded' })
  @Expose()
  createdAt: Date;

  // Private properties (excluded from API responses)
  @Exclude()
  advertId: string;
}
