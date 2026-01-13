import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller'; // <--- Importar
import { AdminService } from './admin.service';       // <--- Importar

@Module({
  controllers: [AdminController], // Aquí registras las rutas
  providers: [AdminService],      // Aquí registras la lógica
  exports: [AdminService]         // (Opcional) Por si otro módulo necesita usar este servicio
})
export class AdminModule {}