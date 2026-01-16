import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Usamos la variable de entorno o tu clave por defecto (para desarrollo)
      secretOrKey: process.env.JWT_SECRET || '428ec0f41dd5af3c71a1964bcfb59723', 
    });
  }

  async validate(payload: any) {
    // Si el token es falso o expiró, NestJS lanza Unauthorized automáticamente antes de llegar aquí.
    if (!payload) {
        throw new UnauthorizedException();
    }
    
    // Inyectamos esto en "req.user"
    return { 
      userId: payload.sub, 
      email: payload.email, 
      rol: payload.rol,
      schoolId: payload.schoolId 
    };
  }
}