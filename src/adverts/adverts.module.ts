import { Module } from '@nestjs/common';
import { AdvertsController } from './adverts.controller';
import { AdvertsService } from './adverts.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AdvertsController],
  providers: [AdvertsService],
  imports: [PrismaModule],
})
export class AdvertsModule {}
