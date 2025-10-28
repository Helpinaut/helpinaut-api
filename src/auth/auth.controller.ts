import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ description: 'Returns a JWT access token' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
