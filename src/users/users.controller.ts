import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';
import { OwnerDetailsEntity } from './entities/owner.entity';

@Controller({ path: 'users', version: '1' })
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  async getMe(@GetUser('id') id: string) {
    return this.usersService.getMe(id);
  }

  @Get(':id')
  @ApiOkResponse({ type: OwnerDetailsEntity })
  async getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  update(@Body() updateUserDto: UpdateUserDto, @GetUser('id') id: string) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  delete(@GetUser('id') id: string) {
    return this.usersService.delete(id);
  }

  @Patch('me/location')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Location successfully updated' })
  async updateLocation(
    @GetUser('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.usersService.updateLocation(id, updateLocationDto);
  }
}
