import { Module } from '@nestjs/common';
import { AdvertsController } from './adverts.controller';
import { AdvertsService } from './adverts.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FavoritesService } from './services/favorites.service';
import { PhotosService } from './services/photos.service';

@Module({
  controllers: [AdvertsController],
  providers: [AdvertsService, FavoritesService, PhotosService],
  imports: [PrismaModule],
})
export class AdvertsModule {}
