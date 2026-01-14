import { Injectable } from '@nestjs/common';

@Injectable()
export class FinanceService {
  getPayments(studentId: string) {
    // Mock data based on the screenshot
    return {
      monto: 1092.00,
      fecha: new Date().toISOString().split('T')[0], // Current Date
      concepto: 'Consulta adeudos de Documentos Solicitados',
    };
  }
}
