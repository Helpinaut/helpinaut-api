import { Module } from '@nestjs/common';
import { AdvertsController } from './adverts.controller';
import { AdvertsService } from './adverts.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FavoritesService } from './services/favorites.service';
import { PhotosService } from './services/photos.service';
import { AdvertsMapper } from './adverts.mapper';

@Module({
  controllers: [AdvertsController],
  providers: [AdvertsService, FavoritesService, PhotosService, AdvertsMapper],
  imports: [PrismaModule],
})
export class AdvertsModule {}
