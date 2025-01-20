import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/responses';
import Analysis from '../models/Analysis';
import Event from '../models/Event';
import Booking from '../models/Booking';
import Ticket from '../models/Ticket';
import Agent from '../models/Agent';

export const generateEventAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      return ApiResponse.notFound(res, 'Event not found');
    }

    const bookings = await Booking.find({ eventId, status: 'confirmed' });
    const tickets = await Ticket.find({ eventId });

    const ticketSales = {
      total: tickets.length,
      byTier: event.ticketTiers.map(tier => ({
        tierId: tier._id,
        count: tickets.filter(t => t.tier.id.toString() === tier._id?.toString()).length,
        revenue: tickets.filter(t => t.tier.id.toString() === tier._id?.toString())
          .reduce((sum, t) => sum + t.tier.price, 0)
      })),
      byTimeSlot: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: bookings.filter(b => new Date(b.createdAt).getHours() === hour).length,
        revenue: bookings.filter(b => new Date(b.createdAt).getHours() === hour)
          .reduce((sum, b) => sum + b.finalAmount, 0)
      }))
    };

    const attendance = {
      total: tickets.length,
      checkedIn: tickets.filter(t => t.status === 'used').length,
      noShow: tickets.filter(t => t.status === 'active').length,
      byHour: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: tickets.filter(t => t.usedAt && new Date(t.usedAt).getHours() === hour).length
      }))
    };

    const revenue = {
      total: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
      tickets: bookings.reduce((sum, b) => sum + b.finalAmount, 0),
      addOns: 0,
      refunds: bookings.filter(b => b.refundStatus === 'completed')
        .reduce((sum, b) => sum + b.finalAmount, 0),
      netRevenue: bookings.reduce((sum, b) => sum + (b.refundStatus === 'completed' ? 0 : b.finalAmount), 0)
    };

    const agents = await Agent.find({
      'eventsManaged.eventId': eventId
    });

    const agentPerformance = agents.map(agent => ({
      agentId: agent._id,
      ticketsSold: bookings.filter(b => b.agent?.id.toString() === agent._id.toString()).length,
      revenue: bookings.filter(b => b.agent?.id.toString() === agent._id.toString())
        .reduce((sum, b) => sum + b.finalAmount, 0),
      commission: bookings.filter(b => b.agent?.id.toString() === agent._id.toString())
        .reduce((sum, b) => sum + (b.agent?.commission || 0), 0)
    }));

    const analysis = await Analysis.create({
      eventId,
      date: new Date(),
      ticketSales,
      attendance,
      revenue,
      agentPerformance
    });

    ApiResponse.success(res, { analysis });
  } catch (error) {
    next(error);
  }
};

export const getEventAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const analysis = await Analysis.findOne({ eventId })
      .sort('-date')
      .populate('eventId', 'title startDate venue');

    if (!analysis) {
      return ApiResponse.notFound(res, 'Analytics not found');
    }

    ApiResponse.success(res, { analysis });
  } catch (error) {
    next(error);
  }
};

export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const dateQuery: any = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate as string);
    }

    const eventStats = {
      total: await Event.countDocuments(dateQuery),
      published: await Event.countDocuments({ ...dateQuery, status: 'published' }),
      upcoming: await Event.countDocuments({ 
        ...dateQuery, 
        status: 'published',
        startDate: { $gt: new Date() }
      }),
      completed: await Event.countDocuments({ ...dateQuery, status: 'completed' })
    };

    const bookingStats = {
      total: await Booking.countDocuments(dateQuery),
      confirmed: await Booking.countDocuments({ ...dateQuery, status: 'confirmed' }),
      pending: await Booking.countDocuments({ ...dateQuery, status: 'pending' }),
      cancelled: await Booking.countDocuments({ ...dateQuery, status: 'cancelled' })
    };

    const bookings = await Booking.find(dateQuery);
    const revenueStats = {
      total: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
      net: bookings.reduce((sum, b) => sum + (b.refundStatus === 'completed' ? 0 : b.finalAmount), 0),
      refunded: bookings.filter(b => b.refundStatus === 'completed')
        .reduce((sum, b) => sum + b.finalAmount, 0)
    };

    const popularEvents = await Event.aggregate([
      { $match: dateQuery },
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'eventId',
          as: 'tickets'
        }
      },
      {
        $project: {
          title: 1,
          soldTickets: { $size: '$tickets' },
          revenue: { $sum: '$tickets.tier.price' }
        }
      },
      { $sort: { soldTickets: -1 } },
      { $limit: 5 }
    ]);

    ApiResponse.success(res, {
      eventStats,
      bookingStats,
      revenueStats,
      popularEvents
    });
  } catch (error) {
    next(error);
  }
};