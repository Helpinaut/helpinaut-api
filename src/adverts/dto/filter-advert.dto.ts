import { ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for filtering adverts.
 * Used in query parameters for search and pagination.
 */
export class FilterAdvertDto {
  @ApiPropertyOptional({
    description: 'Number of results per page (max 20)',
    example: 16,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Page number (starting from 1)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Filter by title (case-insensitive, max length 50)',
    example: 'Classes',
  })
  @IsOptional()
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsString()
  @MaxLength(50)
  title?: string;

  @ApiPropertyOptional({ description: 'Minimum price', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: Category, description: 'Filter by category' })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({
    description: 'Filter by type of advert (true = offer, false = request)',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isOffer?: boolean;

  @ApiPropertyOptional({
    description: 'Use logged user location instead of manual coordinates',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  useUserLocation?: boolean;

  @ApiPropertyOptional({
    description: 'Latitude if not using user location',
    example: 37.3891,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude if not using user location',
    example: -5.9845,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Maximum distance in KM', example: 30 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @IsNumber()
  maxDistance?: number;

  @ApiPropertyOptional({
    description: 'Filter by most viewed adverts',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  popular?: boolean;
}
