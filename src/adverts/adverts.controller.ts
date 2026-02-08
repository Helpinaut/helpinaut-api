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
import { FavoritesService } from './services/favorites.service';
import { PhotosService } from './services/photos.service';
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
import { UploadConfig } from 'src/config/upload.config';
import { Category } from '@prisma/client';

const storage = diskStorage({
  destination: join(process.cwd(), String(UploadConfig.DIR)),
  filename: (_, file, cb) =>
    cb(null, `${Date.now()}-${randomUUID()}${path.extname(file.originalname)}`),
});

@Controller('adverts')
@ApiTags('adverts')
export class AdvertsController {
  constructor(
    private readonly advertsService: AdvertsService,
    private readonly favoritesService: FavoritesService,
    private readonly photosService: PhotosService,
  ) {}

  private buildPhotoPaths(files: Express.Multer.File[]): string[] {
    return files?.length
      ? files.map((file) => `/${UploadConfig.DIR}/${file.filename}`)
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
        category: { type: 'string', enum: Object.values(Category) },
        isOffer: { type: 'boolean' },
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          maxItems: 10,
        },
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

  @Get('categories')
  @ApiOkResponse({ type: String, isArray: true })
  async getCategories() {
    return this.advertsService.getCategories();
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
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: AdvertEntity })
  async uploadPhoto(
    @UploadedFiles(new ImageValidationPipe()) files: Express.Multer.File[],
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.photosService.uploadPhoto(
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
    return this.photosService.deletePhoto(id, photoId, userId);
  }

  @Get('favorites/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity, isArray: true })
  async getFavorites(@GetUser('id') userId: string) {
    return this.favoritesService.getFavorites(userId);
  }

  @Post(':id/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async addFavorite(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.favoritesService.addFavorite(id, userId);
  }

  @Delete(':id/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async deleteFavorite(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.favoritesService.deleteFavorite(id, userId);
  }
}
