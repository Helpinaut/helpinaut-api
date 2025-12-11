import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * DTO for creating a new advert.
 * Includes validation rules and Swagger documentation.
 */
export class CreateAdvertDto {
  @ApiProperty({
    required: true,
    maxLength: 50,
    description: 'Title of the advert (max length 50 characters)',
    example: 'Electrician available for home repairs',
  })
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  title: string;

  @ApiProperty({
    required: true,
    maxLength: 500,
    description: 'Detailed description (max length 500 characters)',
    example: 'Certified electrician with 10 years of experience.',
  })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  @MaxLength(500)
  description: string;

  @ApiProperty({
    required: true,
    minimum: 1,
    maximum: 9999,
    description: 'Price of the advert (from 1 to 9999)',
    example: 50,
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(9999)
  price: number;

  @ApiProperty({ required: true, enum: Category })
  @IsNotEmpty()
  @IsEnum(Category)
  category: Category;

  @ApiProperty({
    required: true,
    description:
      'Indicates if the advert is an offer (true) or a request (false)',
    example: true,
  })
  @Type(() => Boolean)
  @IsNotEmpty()
  @IsBoolean()
  isOffer: boolean;

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
