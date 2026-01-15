import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionCatalog } from './entities/transaction-catalog.entity';
// import { StudentPayment } from './entities/student-payment.entity'; // <--- LO QUITAMOS POR AHORA

import { FinanceService } from './finance.service'; // <--- NUEVO
import { FinanceController } from './finance.controller'; // <--- NUEVO

@Module({
  imports: [
    // Solo cargamos el Catálogo. StudentPayment volverá en la Fase 4.
    TypeOrmModule.forFeature([TransactionCatalog]) 
  ],
  controllers: [FinanceController], // <--- REGISTRADO
  providers: [FinanceService],       // <--- REGISTRADO
  exports: [FinanceService]          // <--- Exportado por si otro módulo necesita consultar precios
})
export class FinanceModule {}