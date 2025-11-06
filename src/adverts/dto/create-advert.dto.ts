import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
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
  @ApiProperty({
    required: true,
    maxLength: 50,
    description: 'max length 50 characters',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  title: string;

  @ApiProperty({
    required: true,
    maxLength: 500,
    description: 'max length 500 characters',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    required: true,
    minimum: 1,
    maximum: 9999.99,
    description: 'from 1.00 to 9999.99',
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(9999.99)
  price: number;

  @ApiProperty({ required: true, enum: Category })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.toUpperCase().replace(/\s+/g, '_')
      : value,
  )
  @IsNotEmpty()
  @IsString()
  @IsEnum(Category)
  category: string;

  @ApiProperty({ required: true })
  @Type(() => Boolean)
  @IsNotEmpty()
  @IsBoolean()
  offer: boolean;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'up to 10 image files',
  })
  @IsOptional()
  photos?: any[];
}
