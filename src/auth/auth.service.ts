import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
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

  // --- VALIDACIÓN DE LOGIN (CORREGIDA PARA DOMINIO INSTITUCIONAL) ---
  async validateUser(email: string, pass: string): Promise<any> {
    // 1. Normalizamos el email a minúsculas y quitamos espacios
    const cleanEmail = email.toLowerCase().trim();
    
    // DEBUG: Verás esto en tu terminal de VS Code
    console.log(`[AUTH] Intentando validar: ${cleanEmail}`);

    const user = await this.userRepository.findOne({ 
      where: { email: cleanEmail },
      select: ['id', 'email', 'password', 'fullName', 'rol', 'school'], 
      relations: ['school'] 
    });

    // Si el usuario existe, comparamos la contraseña
    if (user) {
      const isMatch = await bcrypt.compare(pass.trim(), user.password);
      
      if (isMatch) {
        console.log(`[AUTH] Credenciales correctas para: ${user.email}`);
        const { password, ...result } = user;
        return result;
      } else {
        console.log(`[AUTH] Contraseña incorrecta para: ${user.email}`);
      }
    } else {
      console.log(`[AUTH] Usuario no encontrado: ${cleanEmail}`);
    }

    return null; 
  }

  // --- GENERAR TOKEN DE ACCESO ---
  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      rol: user.rol,
      schoolId: user.school?.id 
    };

    return {
      access_token: this.jwtService.sign(payload), 
      user: { 
        fullName: user.fullName,
        rol: user.rol
      }
    };
  }

  // --- LÓGICA DE RECUPERACIÓN DE CONTRASEÑA ---

  async requestPasswordReset(email: string) {
    const user = await this.userRepository.findOne({ where: { email: email.toLowerCase().trim() } });
    
    if (!user) throw new NotFoundException('No existe un usuario con ese correo.');

    const payload = { sub: user.id, type: 'recovery' };
    
    const token = this.jwtService.sign(payload, { 
      expiresIn: '15m', 
      secret: process.env.JWT_SECRET || 'SECRET_KEY_POR_DEFECTO' 
    });

    const recoveryLink = `http://localhost:5173/recovery?token=${token}`;

    return { 
      message: 'Correo de recuperación generado (Modo Dev)', 
      link: recoveryLink 
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET || 'SECRET_KEY_POR_DEFECTO' });
      
      if (payload.type !== 'recovery') throw new BadRequestException('Token inválido');

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword.trim(), salt);
      
      await this.userRepository.save(user);

      return { message: 'Contraseña actualizada correctamente.' };

    } catch (error) {
      throw new BadRequestException('El enlace ha expirado o no es válido.');
    }
  }
}