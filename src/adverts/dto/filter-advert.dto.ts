import { ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class FilterAdvertDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsString()
  @MaxLength(50)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @ApiPropertyOptional({ enum: Category })
  @IsOptional()
  category?: Category;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  offer?: string;

  @ApiPropertyOptional({ description: 'use user location' })
  @IsOptional()
  @IsBooleanString()
  useUserLocation?: string;

  @ApiPropertyOptional({ description: 'latitude if not using user location' })
  @IsOptional()
  latitude?: string;

  @ApiPropertyOptional({ description: 'longitude if not using user location' })
  @IsOptional()
  longitude?: string;

  @ApiPropertyOptional({ description: 'maximum distance in KM' })
  @IsOptional()
  @IsNumberString()
  maxDistance?: string;
}
