import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../decorators/match.decorator';

/**
 * DTO used for user registration.
 * Validates email, username, password strength, and password confirmation.
 */
export class SignUpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'john', maxLength: 16 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  username: string;

  @ApiProperty({ example: 'strong-password-123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'strong-password-123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Match('password', { message: 'Passwords do not match' })
  repeatedPassword: string;
}
