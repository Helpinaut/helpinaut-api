import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(16)
  username: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ required: true })
  @IsNotEmpty({ message: 'repeated password should not be empty' })
  @IsString()
  @MinLength(8, {
    message: 'repeated password must be longer than or equal to 8 characters',
  })
  @ValidateIf((dto: SignUpDto) => dto.password !== dto.repeatedPassword)
  @Equals('password', { message: 'passwords do not match' })
  repeatedPassword: string;
}
