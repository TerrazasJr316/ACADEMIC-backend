import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

// Creamos un DTO rápido aquí mismo (o puedes hacerlo en archivo aparte)
class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // 1. Preguntamos al servicio si las credenciales son válidas
    const user = await this.authService.validateUser(
      loginDto.email, 
      loginDto.password
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    // 2. Si son válidas, generamos y entregamos el Token
    return this.authService.login(user);
  }
}