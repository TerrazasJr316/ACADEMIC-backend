import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() credentials: { email: string; password?: string; schoolKey: string }) {
    // Llamamos al servicio para validar los datos
    return this.authService.validateUser(
      credentials.email, 
      credentials.password || '', 
      credentials.schoolKey
    );
  }
}