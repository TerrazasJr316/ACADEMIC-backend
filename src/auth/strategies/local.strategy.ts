import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      // Configuramos para que espere 'email' en lugar de 'username'
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  // Esta función se activa automáticamente al hacer POST /auth/login
  async validate(email: string, pass: string): Promise<any> {
    const user = await this.authService.validateUser(email, pass);
    
    if (!user) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    
    return user;
  }
}