import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GeocodingService } from './services/geocoding.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, GeocodingService],
  imports: [PrismaModule],
  exports: [GeocodingService],
})
export class UsersModule {}
