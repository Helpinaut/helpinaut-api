import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAdvertDto } from './dto/create-advert.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Category } from '@prisma/client';

@Injectable()
export class AdvertsService {
  constructor(private prisma: PrismaService) {}

  /**
   * This action adds a new advert assigned to authenticated user.
   * @param createAdvertDto
   * @returns
   */
  async create(
    createAdvertDto: CreateAdvertDto,
    ownerId: string,
    photoPath?: string,
  ) {
    const normalizedCategory = createAdvertDto.category
      .toUpperCase()
      .replace(/\s+/g, '_') as keyof typeof Category;

    if (!(normalizedCategory in Category)) {
      throw new BadRequestException(
        `category must be one of the following values: ${Object.keys(Category).join(', ')}`,
      );
    }

    const advert = await this.prisma.advert.create({
      data: {
        ...createAdvertDto,
        category: normalizedCategory as Category,
        photo: photoPath,
        ownerId,
      },
    });

    return advert;
  }
}
