import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO for updating user profile information.
 * All fields are optional, and only the provided ones will be updated.
 */
export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail(undefined, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16, { message: 'Username can not be longer than 16 characters' })
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be longer than 8 characters' })
  password?: string;
}
