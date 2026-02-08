import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Category, Status } from '@prisma/client';
import { Type } from 'class-transformer';
import { CreateAdvertDto } from './create-advert.dto';

/**
 * DTO for updating an existing advert.
 * Inherits validations from CreateAdvertDto, making all fields optional.
 */
export class UpdateAdvertDto extends PartialType(CreateAdvertDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional()
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isOffer?: boolean;

  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
