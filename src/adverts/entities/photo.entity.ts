// src/adverts/entities/photo.entity.ts
import { Exclude, Expose } from 'class-transformer';
import { Photo } from '@prisma/client';

@Exclude()
export class PhotoEntity implements Photo {
  constructor(partial: Partial<PhotoEntity>) {
    Object.assign(this, partial);
  }

  @Expose()
  id: string;

  @Expose()
  url: string;

  @Expose()
  createdAt: Date;

  /**
   * Private properties
   */

  @Exclude()
  advertId: string;
}
