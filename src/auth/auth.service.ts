import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity'; // Tu entidad real
import * as bcrypt from 'bcrypt'; // Para leer la contraseña encriptada
import { JwtService } from '@nestjs/jwt'; // El que pone el sello

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Conexión a la BD
    private readonly jwtService: JwtService // Máquina de sellos
  ) {}

  // ESTA FUNCIÓN VALIDA SI EL USUARIO EXISTE Y LA CONTRASEÑA ES REAL
  async validateUser(email: string, pass: string): Promise<any> {
    // 1. Buscamos en la Base de Datos real
    // (Pedimos que traiga también la contraseña oculta para compararla)
    const user = await this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'fullName', 'rol', 'school'], // Traemos datos clave
      relations: ['school'] // Traemos a qué escuela pertenece
    });

    // 2. Si el usuario existe, comparamos la contraseña
    if (user && (await bcrypt.compare(pass, user.password))) {
      // 3. Quitamos la contraseña del objeto para no retornarla por seguridad
      const { password, ...result } = user;
      return result;
    }

    return null; // Si no existe o pass incorrecto
  }

  // ESTA FUNCIÓN GENERA EL "TOKEN" (EL SELLO PARA ENTRAR)
  async login(user: any) {
    // Esto es lo que guardamos ENCRIPTADO dentro del token
    const payload = { 
      email: user.email, 
      sub: user.id, 
      rol: user.rol,
      schoolId: user.school?.id // Importante para saber de qué escuela es
    };

    return {
      access_token: this.jwtService.sign(payload), // Generamos el string largo
      user: { // Devolvemos info básica para el Frontend
        fullName: user.fullName,
        rol: user.rol
      }
    };
  }
}