import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO used for user login.
 * Validates email format and password length.
 */
export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address with the user account',
  })
  @IsNotEmpty()
  @IsEmail(undefined, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    example: 'strong-password-123',
    minLength: 8,
    description: 'User password used for authentication',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be longer than 8 characters' })
  password: string;
}
