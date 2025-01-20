import { Request, Response, NextFunction } from 'express';
import Payment from '../models/Payment';
import { PaymentService } from '../services/payment';
import { ApiResponse } from '../utils/responses';

const paymentService = PaymentService.getInstance();

export const initiatePayment = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { bookingId, paymentMethod } = req.body;

    const payment: any = await Payment.create({
      userId: req.user._id,
      bookingId,
      method: paymentMethod
    });

    const paymentIntent = await paymentService.createPaymentIntent(
      payment.amount,
      'inr',
      { paymentId: payment._id.toString() }
    );

    ApiResponse.success(res, {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPayment = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { paymentIntentId } = req.body;
    const paymentIntent = await paymentService.confirmPayment(paymentIntentId);
    ApiResponse.success(res, { paymentIntent });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { paymentIntentId } = req.body;
    const payment = await Payment.findOne({ transactionId: paymentIntentId });
    ApiResponse.success(res, { payment });
  } catch (error) {
    next(error);
  }
};

export const getPaymentMethods = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const methods = await paymentService.getPaymentMethods(req.user._id);
    ApiResponse.success(res, { methods });
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('bookingId')
      .sort('-createdAt');
    ApiResponse.success(res, { payments });
  } catch (error) {
    next(error);
  }
};

export const getPaymentDetails = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId');
    
    if (!payment) {
      return ApiResponse.notFound(res, 'Payment not found');
    }
    
    ApiResponse.success(res, { payment });
  } catch (error) {
    next(error);
  }
};

export const initiateRefund = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return ApiResponse.notFound(res, 'Payment not found');
    }
    
    const refund = await paymentService.createRefund(payment.transactionId || '');
    ApiResponse.success(res, { refund });
  } catch (error) {
    next(error);
  }
};

export const handlePaymentWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const event = req.body;
    ApiResponse.success(res, { event });
  } catch (error) {
    next(error);
  }
};