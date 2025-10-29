import { ApiProperty } from '@nestjs/swagger';
import { Category } from '@prisma/client';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAdvertDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({ required: true })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(9999.99)
  price: number;

  @ApiProperty({ required: true, enum: Category })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ required: true })
  @IsBoolean()
  offer: boolean;
}
