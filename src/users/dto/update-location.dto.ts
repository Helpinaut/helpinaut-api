import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPostalCode, IsString } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsPostalCode('ES')
  postcode: string;
}
