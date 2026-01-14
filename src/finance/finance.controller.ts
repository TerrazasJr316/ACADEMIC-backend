import { Controller, Get, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get(':id/payments')
  getPayments(@Param('id') id: string) {
    return this.financeService.getPayments(id);
  }
}
