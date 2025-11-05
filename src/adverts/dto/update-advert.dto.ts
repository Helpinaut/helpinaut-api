import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { Category, Status } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class UpdateAdvertDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(9999.99)
  price?: number;

  @ApiPropertyOptional({ enum: Category })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.toUpperCase().replace(/\s+/g, '_')
      : value,
  )
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  offer?: boolean;

  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.toUpperCase().replace(/\s+/g, '_')
      : value,
  )
  @IsEnum(Status)
  status?: Status;

  //TODO photos
}
