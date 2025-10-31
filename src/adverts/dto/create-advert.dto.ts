import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAdvertDto {
  @ApiProperty({ required: true, maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;

  @ApiProperty({ required: true, maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({ required: true, minimum: 1, maximum: 9999.99 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(9999.99)
  price: number;

  @ApiProperty({ required: true, enum: Category })
  @IsString()
  @IsEnum(Category)
  category: string;

  @ApiProperty({ required: true })
  @Type(() => Boolean)
  @IsBoolean()
  offer: boolean;

  @ApiPropertyOptional({ required: false, type: 'string', format: 'binary' })
  @IsOptional()
  photo?: any;
}
