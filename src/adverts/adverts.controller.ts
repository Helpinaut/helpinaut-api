import { randomUUID } from 'crypto';
import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import path, { join } from 'path';

import { AdvertsService } from './adverts.service';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { ImageFilePipe } from './pipes/image-file.pipe';
import type { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { DeleteFileOnErrorInterceptor } from 'src/utils/delete-file-on-error.interceptor';

const storage = diskStorage({
  destination: join(process.cwd(), String(process.env.UPLOAD_DIR)),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`),
});

@Controller('adverts')
@ApiTags('adverts')
export class AdvertsController {
  constructor(private readonly advertsService: AdvertsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('photo', { storage }),
    DeleteFileOnErrorInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFile(new ImageFilePipe()) file: Express.Multer.File,
    @Body() createAdvertDto: CreateAdvertDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const photoPath = file
      ? `/${process.env.UPLOAD_DIR}/${file.filename}`
      : undefined;
    return this.advertsService.create(createAdvertDto, req.user.id, photoPath);
  }
}
