import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity'; 
import * as bcrypt from 'bcrypt'; 
import { JwtService } from '@nestjs/jwt'; 

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, 
    private readonly jwtService: JwtService 
  ) {}

  // 1. VALIDAR USUARIO Y ESTADO DE LA ESCUELA 🛡️
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { email },
      // 🔥 CRÍTICO: Traemos la relación 'school' para verificar su estado
      relations: ['school'], 
      // Seleccionamos password explícitamente (por defecto suele estar oculta)
      select: ['id', 'email', 'password', 'fullName', 'rol', 'school'], 
    });

    // A) Si el usuario no existe
    if (!user) return null;

    // B) Validar contraseña encriptada
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) return null;

    // C) 🔒 VALIDACIÓN SAAS: ¿La escuela pagó?
    // Si tiene escuela asignada Y la escuela está desactivada... ¡BLOQUEO!
    if (user.school && user.school.isActive === false) {
       throw new ForbiddenException('ACCESO DENEGADO: La suscripción de tu escuela está inactiva o hay un pago pendiente.');
    }

    // D) Si pasa todo, retornamos el usuario SIN la contraseña
    const { password, ...result } = user;
    return result;
  }

  // 2. GENERAR EL TOKEN (LOGIN EXITOSO) 🎟️
  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      rol: user.rol,
      schoolId: user.school?.id // Dato vital para filtrar alumnos/maestros después
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: { 
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        rol: user.rol,
        schoolName: user.school?.nombreEscuela,
        isActive: user.school?.isActive // Dato útil para el front
      }
    };
  }
}