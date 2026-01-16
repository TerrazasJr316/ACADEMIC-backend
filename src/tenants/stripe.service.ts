import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    // Inicializamos Stripe con la clave del .env
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20' as any,
    });
  }

  // 1. Crear Cliente
  async createCustomer(email: string, name: string, tokenPago: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: email,
        name: name,
        source: tokenPago, // Asocia la tarjeta (token) al cliente
        description: 'Cliente registrado desde Academic SaaS',
      });
      return customer;
    } catch (error) {
      console.error('Error creando cliente Stripe:', error);
      throw new InternalServerErrorException(`Error Stripe Customer: ${error.message}`);
    }
  }

  // 2. Crear Suscripción (Cobro recurrente)
  async createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }], // El ID del precio ($999) que configuraste en Dashboard
        expand: ['latest_invoice.payment_intent'], // Para ver el estado del primer pago
      });
      return subscription;
    } catch (error) {
      console.error('Error creando suscripción Stripe:', error);
      throw new InternalServerErrorException(`Error Stripe Subscription: ${error.message}`);
    }
  }

  // 3. 🔥 NUEVO: Cancelar Suscripción
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      // Esto cancela la renovación automática al final del periodo
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Error Cancelando Suscripción:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
  
  get stripeClient() {
    return this.stripe;
  }
}