import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/responses';
import Coupon from '../models/Coupon';
import Booking from '../models/Booking';
import Event from '../models/Event';

interface CustomRequest extends Request {
  user?: any;
}

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.create(req.body);
    ApiResponse.created(res, { coupon });
  } catch (error) {
    next(error);
  }
};

export const getAllCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;

    const query: any = {};
    if (typeof isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    }

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      coupons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCouponByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return ApiResponse.notFound(res, 'Coupon not found');
    }

    ApiResponse.success(res, { coupon });
  } catch (error) {
    next(error);
  }
};

interface ValidateCouponResult {
  valid: boolean;
  discountAmount: number;
  finalAmount: number;
}

export const validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<ValidateCouponResult | undefined> => {
  try {
    const { code, eventId, totalAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      ApiResponse.notFound(res, 'Invalid coupon code');
      return undefined;
    }

    if (!coupon.isActive) {
      ApiResponse.badRequest(res, 'Coupon is inactive');
      return undefined;
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      ApiResponse.badRequest(res, 'Coupon has expired');
      return undefined;
    }

    if (coupon.usageCount >= coupon.maxUsage) {
      ApiResponse.badRequest(res, 'Coupon usage limit exceeded');
      return undefined;
    }

    if (coupon.minPurchase && totalAmount < coupon.minPurchase) {
      ApiResponse.badRequest(res, `Minimum purchase amount is ${coupon.minPurchase}`);
      return undefined;
    }

    if (coupon.applicableEvents?.length > 0 && !coupon.applicableEvents.includes(eventId)) {
      ApiResponse.badRequest(res, 'Coupon not applicable for this event');
      return undefined;
    }

    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (totalAmount * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.value;
    }

    const result: ValidateCouponResult = {
      valid: true,
      discountAmount,
      finalAmount: totalAmount - discountAmount
    };

    ApiResponse.success(res, result);
    return result;
  } catch (error) {
    next(error);
    return undefined;
  }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return ApiResponse.notFound(res, 'Coupon not found');
    }

    Object.assign(coupon, req.body);
    await coupon.save();

    ApiResponse.success(res, { coupon });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return ApiResponse.notFound(res, 'Coupon not found');
    }

    await coupon.deleteOne();
    ApiResponse.success(res, null, 'Coupon deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const applyCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return ApiResponse.notFound(res, 'Booking not found');
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return ApiResponse.notFound(res, 'Invalid coupon code');
    }

    const validationResult = await validateCoupon({
      body: {
        code,
        eventId: booking.eventId,
        totalAmount: booking.totalAmount
      }
    } as Request, res, next);

    if (validationResult) {
      booking.discountAmount = validationResult.discountAmount;
      booking.finalAmount = validationResult.finalAmount;
      await booking.save();

      coupon.usageCount += 1;
      await coupon.save();
    }

    ApiResponse.success(res, { booking });
  } catch (error) {
    next(error);
  }
};