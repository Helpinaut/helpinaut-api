import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPostalCode,
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
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({ example: 'john', maxLength: 16 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16, { message: 'Username can not be longer than 16 characters' })
  username: string;

  @ApiProperty({ example: 'strong-password-123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be longer than 8 characters' })
  password: string;

  @ApiProperty({ example: 'strong-password-123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be longer than 8 characters' })
  @Match('password', { message: 'Passwords do not match' })
  repeatedPassword: string;

  @ApiProperty({
    description: 'Spanish postal code used to update the user location',
    example: '41001',
  })
  @IsString()
  @IsNotEmpty()
  @IsPostalCode('ES', { message: 'Invalid Spanish code format' })
  postalCode: string;
}
