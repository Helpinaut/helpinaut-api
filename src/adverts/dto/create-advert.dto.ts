import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
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
import { AdvertConfig } from 'src/config/advert.config';

/**
 * DTO for creating a new advert.
 * Includes validation rules and Swagger documentation.
 */
export class CreateAdvertDto {
  @ApiProperty({
    required: true,
    maxLength: AdvertConfig.MAX_TITLE,
    description: `Title of the advert (max length ${AdvertConfig.MAX_TITLE} characters)`,
    example: 'Electrician available for home repairs',
  })
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(AdvertConfig.MAX_TITLE)
  title: string;

  @ApiProperty({
    required: true,
    maxLength: AdvertConfig.MAX_DESCRIPTION,
    description: `Detailed description (max length ${AdvertConfig.MAX_DESCRIPTION} characters)`,
    example: 'Certified electrician with 10 years of experience.',
  })
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  @MaxLength(AdvertConfig.MAX_DESCRIPTION)
  description: string;

  @ApiProperty({
    required: true,
    minimum: AdvertConfig.MIN_PRICE,
    maximum: AdvertConfig.MAX_PRICE,
    description: `Price of the advert (from ${AdvertConfig.MIN_PAGE} to ${AdvertConfig.MAX_PRICE})`,
    example: 50,
  })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Advert must have a price' })
  @IsNumber()
  @Min(AdvertConfig.MIN_PRICE, {
    message: `Price value can not be less than ${AdvertConfig.MIN_PRICE}`,
  })
  @Max(AdvertConfig.MAX_PRICE, {
    message: `Price value can not be more than ${AdvertConfig.MAX_PRICE}`,
  })
  price: number;

  @ApiProperty({ required: true, enum: Category })
  @IsNotEmpty({ message: 'Advert must have a category' })
  @IsEnum(Category, { message: 'Advert must have a valid category value' })
  category: Category;

  @ApiProperty({
    required: true,
    description:
      'Indicates if the advert is an offer (true) or a request (false)',
    example: true,
  })
  @Type(() => Boolean)
  @IsNotEmpty({ message: 'Advert must have a type' })
  @IsBoolean()
  isOffer: boolean;

  @ApiHideProperty()
  @IsOptional()
  photos?: any;
}
