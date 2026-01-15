import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. Le decimos de dónde sacar el token (del encabezado 'Authorization')
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Si el token venció, no lo dejes pasar
      secretOrKey: 'MI_SECRETO_SUPER_SECRETO', // ⚠️ DEBE SER EL MISMO QUE EN AUTH.MODULE
    });
  }

  // 2. Si el token es válido, NestJS ejecuta esto automáticamente
  async validate(payload: any) {
    // "payload" es lo que guardamos dentro del token (id, email, schoolId)
    // Lo que retornemos aquí, NestJS lo pegará en "req.user"
    return { 
      userId: payload.sub, 
      email: payload.email, 
      rol: payload.rol,
      schoolId: payload.schoolId // ¡Importante para el Multi-tenant!
    };
  }
}