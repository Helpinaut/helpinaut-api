import { randomUUID } from 'crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import path, { join } from 'path';

import { AdvertsService } from './adverts.service';
import { AddPhotoDto } from './dto/add-photo.dto';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { UpdateAdvertDto } from './dto/update-advert.dto';
import { AdvertEntity } from './entities/advert.entity';
import { ImageFilePipe } from './pipes/image-file.pipe';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
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
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: AdvertEntity })
  async create(
    @UploadedFiles(new ImageFilePipe()) files: Express.Multer.File[],
    @Body() createAdvertDto: CreateAdvertDto,
    @GetUser('id') userId: string,
  ) {
    const photoPaths = files?.length
      ? files.map((file) => `/${process.env.UPLOAD_DIR}/${file.filename}`)
      : [];
    return this.advertsService.create(createAdvertDto, userId, photoPaths);
  }

  @Get('categories')
  @ApiOkResponse({ type: String, isArray: true })
  async findCategories() {
    return this.advertsService.findCategories();
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity, isArray: true })
  async findAll(@GetUser('id') userId: string | null) {
    return this.advertsService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async findOne(@Param('id') id: string, @GetUser('id') userId: string | null) {
    return this.advertsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('photos', 10, { storage }),
    DeleteFileOnErrorInterceptor,
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: AdvertEntity })
  async update(
    @Body() updateAdvertDto: UpdateAdvertDto,
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.advertsService.update(id, userId, updateAdvertDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.advertsService.remove(id, userId);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('photos', 10, { storage }),
    DeleteFileOnErrorInterceptor,
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: AdvertEntity })
  async addPhoto(
    @UploadedFiles(new ImageFilePipe()) files: Express.Multer.File[],
    @Body() addPhotoDto: AddPhotoDto,
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    const photoPaths = files?.length
      ? files.map((file) => `/${process.env.UPLOAD_DIR}/${file.filename}`)
      : [];
    return this.advertsService.addPhoto(id, userId, photoPaths);
  }

  @Delete(':id/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async removePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @GetUser('id') userId: string,
  ) {
    return this.advertsService.removePhoto(id, photoId, userId);
  }
}
