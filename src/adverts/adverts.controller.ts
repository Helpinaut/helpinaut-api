import { randomUUID } from 'crypto';
import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
    FilesInterceptor('photos', 10, { storage }),
    DeleteFileOnErrorInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFiles(new ImageFilePipe()) files: Express.Multer.File[],
    @Body() createAdvertDto: CreateAdvertDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const photoPaths = files?.length
      ? files.map((file) => `/${process.env.UPLOAD_DIR}/${file.filename}`)
      : [];
    return this.advertsService.create(createAdvertDto, req.user.id, photoPaths);
  }
}
