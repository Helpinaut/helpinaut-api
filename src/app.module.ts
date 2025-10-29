import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';

@Module({
  controllers: [],
  providers: [JwtAuthGuard],
  imports: [PrismaModule, AuthModule, UsersModule],
})
export class AppModule {}
