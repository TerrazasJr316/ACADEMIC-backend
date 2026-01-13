import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getHello(): string {
    return '¡Hola Administrador! El backend te escucha.';
  }
}