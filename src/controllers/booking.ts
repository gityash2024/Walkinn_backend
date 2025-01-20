import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ApiResponse } from '../utils/responses';
import Booking from '../models/Booking';
import Event from '../models/Event';
import Ticket from '../models/Ticket';
import { generateQRCode } from '../services/qrcode';
import { sendEmail } from '../services/email';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user: {
    _id: string;
    email: string;
    username: string;
    firstName?: string;
    role: string;
  };
}

interface TicketRequest {
  tierId: string;
  quantity: number;
}

export const createBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { eventId, tickets, agentId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return ApiResponse.notFound(res, 'Event not found');
    }

    if (event.status !== 'published') {
      return ApiResponse.badRequest(res, 'Event is not available for booking');
    }

    let totalAmount = 0;
    for (const ticketRequest of tickets as TicketRequest[]) {
      const tier = event.ticketTiers.find(t => 
        t._id && Types.ObjectId.createFromHexString(t._id.toString()) 
          .equals(Types.ObjectId.createFromHexString(ticketRequest.tierId))
      );
      
      if (!tier) {
        return ApiResponse.badRequest(res, 'Invalid ticket tier');
      }

      if (tier.available < ticketRequest.quantity) {
        return ApiResponse.badRequest(res, `Not enough tickets available for ${tier.name}`);
      }

      if (ticketRequest.quantity > tier.maxPerBooking) {
        return ApiResponse.badRequest(res, `Maximum ${tier.maxPerBooking} tickets allowed per booking for ${tier.name}`);
      }

      totalAmount += tier.price * ticketRequest.quantity;
    }

    const booking = await Booking.create({
      userId: req.user._id,
      eventId,
      tickets: (tickets as TicketRequest[]).map(t => {
        const tier = event.ticketTiers.find(tier => 
          tier._id && Types.ObjectId.createFromHexString(tier._id.toString())
            .equals(Types.ObjectId.createFromHexString(t.tierId))
        );
        return {
          tierId: t.tierId,
          quantity: t.quantity,
          unitPrice: tier?.price || 0
        };
      }),
      totalAmount,
      finalAmount: totalAmount,
      status: 'pending',
      ...(agentId && {
        agent: {
          id: agentId,
          name: 'Agent Name',
          commission: 10
        }
      })
    });

    ApiResponse.created(res, { 
      booking,
      paymentDetails: {
        amount: totalAmount,
        currency: 'INR'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const confirmBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { bookingId } = req.params;
    const { paymentId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return ApiResponse.notFound(res, 'Booking not found');
    }

    const event = await Event.findById(booking.eventId);
    if (!event) {
      return ApiResponse.notFound(res, 'Event not found');
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'completed';
    booking.paymentId = paymentId;
    await booking.save();

    const ticketPromises = [];
    for (const ticketBooking of booking.tickets) {
      const tier = event.ticketTiers.find(t => 
        t._id && Types.ObjectId.createFromHexString(t._id.toString())
          .equals(Types.ObjectId.createFromHexString(String(ticketBooking.tierId)))
      );
      if (!tier) continue;

      for (let i = 0; i < ticketBooking.quantity; i++) {
        const qrCode = await generateQRCode(String(booking._id) + i);
        
        ticketPromises.push(Ticket.create({
          eventId: event._id,
          userId: booking.userId,
          bookingId: booking._id,
          tier: {
            id: tier._id,
            name: tier.name,
            price: tier.price,
            type: tier.type
          },
          qrCode,
          validUntil: event.endDate
        }));
      }

      tier.available -= ticketBooking.quantity;
    }

    const tickets = await Promise.all(ticketPromises);
    event.soldTickets += tickets.length;
    await event.save();

    try {
      await sendEmail({
        email: req.user.email,
        subject: 'Booking Confirmation',
        template: 'booking-confirmation',
        data: {
          name: req.user.firstName || req.user.username,
          eventName: event.title,
          bookingId: booking._id,
          amount: booking.finalAmount,
          ticketCount: tickets.length
        }
      });
    } catch (error) {
      logger.error('Error sending booking confirmation email:', error);
    }

    ApiResponse.success(res, { booking, tickets });
  } catch (error) {
    next(error);
  }
};

export const getBookingDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('eventId', 'title startDate venue')
      .populate('userId', 'username email');

    if (!booking) {
      return ApiResponse.notFound(res, 'Booking not found');
    }

    if (booking.userId._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' && 
        booking.agent?.id.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'You do not have permission to view this booking');
    }

    const tickets = await Ticket.find({ bookingId: booking._id });

    ApiResponse.success(res, { booking, tickets });
  } catch (error) {
    next(error);
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query: any = {
      userId: req.user._id
    };

    if (status) query.status = status;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('eventId', 'title startDate venue')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      bookings,
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

export const cancelBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return ApiResponse.notFound(res, 'Booking not found');
    }

    if (booking.userId.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have permission to cancel this booking');
    }

    if (booking.status === 'cancelled') {
      return ApiResponse.badRequest(res, 'Booking is already cancelled');
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    const event = await Event.findById(booking.eventId);
    if (event) {
      for (const ticketBooking of booking.tickets) {
        const tier = event.ticketTiers.find(t => 
          t._id && Types.ObjectId.createFromHexString(t._id.toString())
            .equals(Types.ObjectId.createFromHexString(String(ticketBooking.tierId)))
        );
        if (tier) {
          tier.available += ticketBooking.quantity;
        }
      }
      event.soldTickets -= booking.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      await event.save();
    }

    await Ticket.updateMany(
      { bookingId: booking._id },
      { status: 'cancelled' }
    );

    ApiResponse.success(res, { booking });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return ApiResponse.notFound(res, 'Booking not found');
    }

    if (req.user.role !== 'admin') {
      return ApiResponse.forbidden(res, 'Only admin can update bookings');
    }

    const { status, paymentStatus, discountAmount } = req.body;

    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    if (discountAmount !== undefined) {
      booking.discountAmount = discountAmount;
      booking.finalAmount = booking.totalAmount - discountAmount;
    }

    await booking.save();

    ApiResponse.success(res, { booking });
  } catch (error) {
    next(error);
  }
};

export const getBookingHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await Booking.find({ 
      userId: req.user._id 
    })
    .populate('eventId', 'title startDate venue')
    .sort('-createdAt');

    ApiResponse.success(res, { bookings });
  } catch (error) {
    next(error);
  }
};

export const getAgentBookings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query: any = {
      'agent.id': req.user._id
    };

    if (status) query.status = status;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('eventId', 'title startDate venue')
      .populate('userId', 'username email')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      bookings,
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

export const applyDiscount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return ApiResponse.notFound(res, 'Booking not found');
    }

    const { discountAmount, discountCode } = req.body;

    if (discountAmount <= 0) {
      return ApiResponse.badRequest(res, 'Invalid discount amount');
    }

    if (discountAmount > booking.totalAmount) {
      return ApiResponse.badRequest(res, 'Discount cannot exceed total amount');
    }

    booking.discountAmount = discountAmount;
    booking.finalAmount = booking.totalAmount - discountAmount;

    if (discountCode) {
      booking.discountCode = discountCode;
    }

    await booking.save();

    ApiResponse.success(res, { booking });
  } catch (error) {
    next(error);
  }
};

export const validateBookingAvailability = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { eventId, tickets } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return ApiResponse.notFound(res, 'Event not found');
    }

    const availabilityResults = [];
    for (const ticketRequest of tickets as TicketRequest[]) {
      const tier = event.ticketTiers.find(t => 
        t._id && Types.ObjectId.createFromHexString(t._id.toString())
          .equals(Types.ObjectId.createFromHexString(ticketRequest.tierId))
      );
      
      if (!tier) {
        availabilityResults.push({
          tierId: ticketRequest.tierId,
          available: false,
          reason: 'Invalid ticket tier'
        });
        continue;
      }

      const isAvailable = 
        tier.available >= ticketRequest.quantity && 
        ticketRequest.quantity <= tier.maxPerBooking;

      availabilityResults.push({
        tierId: ticketRequest.tierId,
        available: isAvailable,
        availableQuantity: tier.available,
        maxPerBooking: tier.maxPerBooking,
        reason: !isAvailable 
          ? (tier.available < ticketRequest.quantity 
              ? 'Not enough tickets available' 
              : 'Exceeds maximum tickets per booking')
          : null
      });
    }

    ApiResponse.success(res, { 
      eventAvailable: availabilityResults.every(result => result.available),
      tickets: availabilityResults 
    });
  } catch (error) {
    next(error);
  }
};