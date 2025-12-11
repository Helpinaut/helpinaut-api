import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional } from 'class-validator';

/**
 * DTO for adding images to an advert.
 * Accepts up to 10 image files.
 */
export class AddPhotoDto {
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Up to 10 image files',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  photos?: Express.Multer.File[];
}
