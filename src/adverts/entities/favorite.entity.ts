import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, plainToInstance } from 'class-transformer';

@Exclude()
export class FavoriteEntity {
  constructor(partial: Partial<FavoriteEntity>) {
    Object.assign(this, plainToInstance(FavoriteEntity, partial));
  }

  @ApiProperty({ description: 'Unique identifier of the favorite' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Identifier of the advert marked as favorite' })
  @Expose()
  advertId: string;

  @ApiProperty({
    description: 'Identifier of the user who marked the advert as favorite',
  })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Date when the advert was marked as favorite' })
  @Expose()
  createdAt: Date;
}
