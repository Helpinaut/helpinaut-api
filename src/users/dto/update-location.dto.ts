import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsPostalCode, IsString } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({
    description: 'Spanish postal code used to update the user location',
    example: '41001',
  })
  @IsString()
  @IsNotEmpty()
  @IsPostalCode('ES', { message: 'Invalid Spanish code format' })
  postalCode: string;
}
