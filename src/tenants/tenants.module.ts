import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { StripeService } from './stripe.service';
import { TenantsController } from './tenants.controller';
import { School } from './entities/school.entity';
import { BillingInfo } from './entities/billing-info.entity';
import { StripeWebhookController } from './stripe-webhook.controller';


@Module({
  // 3. REGISTRARLAS AQUÍ:
  imports: [TypeOrmModule.forFeature([School, BillingInfo])], 
  controllers: [TenantsController, StripeWebhookController],
  providers: [TenantsService, StripeService],
  exports: [TenantsService, TypeOrmModule] // Opcional, por si otros módulos necesitan usarlo
})
export class TenantsModule {}