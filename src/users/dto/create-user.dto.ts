import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsString()
  @MaxLength(16)
  username: string;

  @ApiProperty({ required: true })
  @IsString()
  @MinLength(8)
  password: string;
}
