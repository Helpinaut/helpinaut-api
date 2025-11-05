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
import { CreateAdvertDto } from './dto/create-advert.dto';
import { UpdateAdvertDto } from './dto/update-advert.dto';
import { AdvertEntity } from './entities/advert.entity';
import { ImageFilePipe } from './pipes/image-file.pipe';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { DeleteFileOnErrorInterceptor } from 'src/utils/delete-file-on-error.interceptor';
import type { AuthenticatedRequest } from 'src/auth/interfaces/request-user.interface';
import { OptionalJwtAuthGuard } from 'src/auth/guard/optional-jwt-auth.guard';

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

  //TODO get categories

  @Get()
  @ApiCreatedResponse({ type: AdvertEntity, isArray: true })
  async findAll() {
    return this.advertsService.findAll();
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: AdvertEntity })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.id;
    return this.advertsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('photos', 10, { storage }),
    DeleteFileOnErrorInterceptor,
  )
  @ApiCreatedResponse({ type: AdvertEntity })
  @ApiConsumes('multipart/form-data')
  async update(
    @UploadedFiles(new ImageFilePipe()) files: Express.Multer.File[],
    @Param('id') id: string,
    @Body() updateAdvertDto: UpdateAdvertDto,
    @GetUser('id') userId: string,
  ) {
    //TODO manage photos
    return this.advertsService.update(id, userId, updateAdvertDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('photos', 10, { storage }),
    DeleteFileOnErrorInterceptor,
  )
  @ApiCreatedResponse({ type: AdvertEntity })
  async remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.advertsService.remove(id, userId);
  }
}
