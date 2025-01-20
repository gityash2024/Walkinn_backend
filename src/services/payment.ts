import Stripe from 'stripe';
import { logger } from '../utils/logger';

// Default test API key - DO NOT use in production
const DEFAULT_TEST_KEY = 'sk_test_dummy_key_for_development';

export class PaymentService {
  private static instance: PaymentService;
  private stripe: any;

  private constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY || DEFAULT_TEST_KEY;
    
    if (process.env.NODE_ENV === 'production' && !process.env.STRIPE_SECRET_KEY) {
      logger.error('STRIPE_SECRET_KEY is missing in production environment');
      throw new Error('Stripe secret key is required in production');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('STRIPE_SECRET_KEY not found in environment, using test key');
    }

    try {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2024-12-18.acacia' as any
      });
    } catch (error) {
      logger.error('Failed to initialize Stripe:', error);
      throw new Error('Failed to initialize payment service');
    }
  }

  public static getInstance(): PaymentService {
    try {
      if (!PaymentService.instance) {
        PaymentService.instance = new PaymentService();
      }
      return PaymentService.instance;
    } catch (error) {
      logger.error('Error getting PaymentService instance:', error);
      // In development, create a mock instance that logs operations
      if (process.env.NODE_ENV !== 'production') {
        return {
          createPaymentIntent: async (...args: any[]) => {
            logger.info('Mock createPaymentIntent called with:', args);
            return { client_secret: 'mock_client_secret', id: 'mock_intent_id' };
          },
          confirmPayment: async (...args: any[]) => {
            logger.info('Mock confirmPayment called with:', args);
            return { status: 'succeeded' };
          },
          createRefund: async (...args: any[]) => {
            logger.info('Mock createRefund called with:', args);
            return { id: 'mock_refund_id', status: 'succeeded' };
          },
          getPaymentMethods: async (...args: any[]) => {
            logger.info('Mock getPaymentMethods called with:', args);
            return { data: [] };
          },
          createCustomer: async (...args: any[]) => {
            logger.info('Mock createCustomer called with:', args);
            return { id: 'mock_customer_id' };
          },
          retrievePaymentIntent: async (...args: any[]) => {
            logger.info('Mock retrievePaymentIntent called with:', args);
            return { status: 'succeeded' };
          }
        } as any;
      }
      throw error;
    }
  }

  // Rest of the methods remain the same...
  async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: any): Promise<any> {
    try {
      return await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata
      });
    } catch (error) {
      logger.error('Payment intent creation error:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId);
    } catch (error) {
      logger.error('Payment confirmation error:', error);
      throw error;
    }
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<any> {
    try {
      const refundParams = {
        payment_intent: paymentIntentId,
        ...(amount && { amount: Math.round(amount * 100) })
      };
      return await this.stripe.refunds.create(refundParams);
    } catch (error) {
      logger.error('Refund creation error:', error);
      throw error;
    }
  }

  async getPaymentMethods(customerId: string): Promise<any> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });
      return paymentMethods.data;
    } catch (error) {
      logger.error('Get payment methods error:', error);
      throw error;
    }
  }

  async createCustomer(email: string, metadata?: any): Promise<any> {
    try {
      return await this.stripe.customers.create({
        email,
        metadata
      });
    } catch (error) {
      logger.error('Customer creation error:', error);
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      logger.error('Retrieve payment intent error:', error);
      throw error;
    }
  }
}