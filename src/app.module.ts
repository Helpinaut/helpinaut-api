import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { AdvertsModule } from './adverts/adverts.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [],
  providers: [JwtAuthGuard],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AdvertsModule,
  ],
})
export class AppModule {}
