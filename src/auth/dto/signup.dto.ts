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
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(16)
  @IsNotEmpty()
  username: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ required: true })
  @IsString()
  @MinLength(8, {
    message: 'repeated password must be longer than or equal to 8 characters',
  })
  @IsNotEmpty({ message: 'repeated password should not be empty' })
  @ValidateIf((dto: SignUpDto) => dto.password !== dto.repeatedPassword)
  @Equals('password', { message: 'passwords do not match' })
  repeatedPassword: string;
}
