import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin') // Esto define que todas las rutas empezarán con /admin
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('hola') // Ruta: GET /admin/hola
  saludar() {
    return this.adminService.getHello();
  }
}