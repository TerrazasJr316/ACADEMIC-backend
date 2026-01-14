import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionCatalog } from './entities/transaction-catalog.entity';
import { StudentPayment } from './entities/student-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionCatalog, StudentPayment])
  ],
  controllers: [],
  providers: [],
})
export class FinanceModule {}