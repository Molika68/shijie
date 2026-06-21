import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SendCodeDto } from './dto/send-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendCode(dto.email);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto.email, dto.code);
    return { code: 200, data };
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const data = await this.authService.refresh(refreshToken);
    return { code: 200, data };
  }

  @Post('logout')
  async logout(@Headers('authorization') auth?: string) {
    const token = auth?.replace('Bearer ', '') ?? '';
    const data = await this.authService.logout(token);
    return { code: 200, data };
  }
}
