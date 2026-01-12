import { randomUUID } from 'crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
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
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
} from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { DeleteFileOnErrorInterceptor } from 'src/utils/delete-file-on-error.interceptor';
import { FilterAdvertDto } from './dto/filter-advert.dto';
import { ImageValidationPipe } from './pipes/image-validation.pipe';

const storage = diskStorage({
  destination: join(process.cwd(), String(process.env.UPLOAD_DIR)),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`),
});

@Controller('adverts')
@ApiTags('adverts')
export class AdvertsController {
  constructor(private readonly advertsService: AdvertsService) {}

  private buildPhotoPaths(files: Express.Multer.File[]): string[] {
    return files?.length
      ? files.map((file) => `/${process.env.UPLOAD_DIR}/${file.filename}`)
      : [];
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('photos', 10, { storage }),
    DeleteFileOnErrorInterceptor,
  )
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        category: { type: 'string' },
        photos: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({ type: AdvertEntity })
  async create(
    @UploadedFiles(new ImageValidationPipe()) files: Express.Multer.File[],
    @Body() createAdvertDto: CreateAdvertDto,
    @GetUser('id') userId: string,
  ) {
    return this.advertsService.create(
      createAdvertDto,
      userId,
      this.buildPhotoPaths(files),
    );
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity, isArray: true })
  async getAll(
    @GetUser('id') userId: string | null,
    @Query() filters: FilterAdvertDto,
  ) {
    return this.advertsService.getAll(userId, filters);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async getById(@Param('id') id: string, @GetUser('id') userId: string | null) {
    return this.advertsService.getById(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: AdvertEntity })
  async update(
    @Body() updateAdvertDto: UpdateAdvertDto,
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.advertsService.update(id, userId, updateAdvertDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async delete(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.advertsService.delete(id, userId);
  }

  @Get('categories')
  @ApiOkResponse({ type: String, isArray: true })
  async getCategories() {
    return this.advertsService.getCategories();
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('photos', 10, { storage }),
    DeleteFileOnErrorInterceptor,
  )
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        category: { type: 'string' },
        photos: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: AdvertEntity })
  async uploadPhoto(
    @UploadedFiles(new ImageValidationPipe()) files: Express.Multer.File[],
    @Body() addPhotoDto: AddPhotoDto,
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.advertsService.uploadPhoto(
      id,
      userId,
      this.buildPhotoPaths(files),
    );
  }

  @Delete(':id/photos/:photoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @GetUser('id') userId: string,
  ) {
    return this.advertsService.deletePhoto(id, photoId, userId);
  }

  @Get('favorites/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity, isArray: true })
  async getFavorites(@GetUser('id') userId: string) {
    return this.advertsService.getFavorites(userId);
  }

  @Post(':id/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async addFavorite(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.advertsService.addFavorite(id, userId);
  }

  @Delete(':id/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async deleteFavorite(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.advertsService.deleteFavorite(id, userId);
  }
}
