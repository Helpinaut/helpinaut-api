import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPostalCode,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO used for creating a new user.
 * This is consumed by `UsersService.create()` and should not be exposed directly
 * to public API routes. Public registrations uses SignUpDto instead.
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Unique email address of the user',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    maxLength: 16,
    description: 'Public and unique username chosen by the user',
    example: 'john',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  username: string;

  @ApiProperty({
    minLength: 8,
    description: 'Raw password that will be hashed before storing',
    example: 'strong-password-123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be longer than 8 characters' })
  password: string;

  @ApiProperty({
    description: 'Spanish postal code used to update the user location',
    example: '41001',
  })
  @IsString()
  @IsNotEmpty()
  @IsPostalCode('ES')
  postalCode: string;
}
