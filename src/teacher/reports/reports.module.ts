import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController], // 👈 Asegúrate que esté aquí
  providers: [ReportsService],
})
export class ReportsModule {}