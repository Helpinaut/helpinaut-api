import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { AdvertsService } from './adverts.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/utils/authenticated-user.interface';

@Controller('adverts')
export class AdvertsController {
  constructor(private readonly advertsService: AdvertsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createAdvertDto: CreateAdvertDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.advertsService.create(createAdvertDto, req.user.id);
  }
}
