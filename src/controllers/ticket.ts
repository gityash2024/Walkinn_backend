import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ApiResponse } from '../utils/responses';
import Ticket from '../models/Ticket';
import Booking from '../models/Booking';
import User from '../models/User';  
import Event from '../models/Event';
import { generateQRCode, generateTicketQR } from '../services/qrcode';
import { generateTicketPDF } from '../services/pdf';
import { sendEmail } from '../services/email';
import { logger } from '../utils/logger';
import { IUser } from '../interfaces/user';
import { ITicket } from '../interfaces/ticket';

const extractUserId = (user?: any): string | undefined => {
  if (!user) return undefined;
  return user._id?.toString() || user.id || user._id;
};

const extractUserRole = (user?: any): string | undefined => {
  return user?.role;
};

export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('eventId', 'title startDate venue')
      .populate('userId', 'username email');

    if (!ticket) {
      return ApiResponse.notFound(res, 'Ticket not found');
    }

    // Check if user has permission to view ticket
    const ticketUserId = ticket.userId instanceof Types.ObjectId 
      ? ticket.userId.toString() 
      : (ticket.userId as any)?._id?.toString();
    
    const currentUserId = extractUserId(req.user);
    const currentUserRole = extractUserRole(req.user);

    if (!currentUserId || 
        ticketUserId !== currentUserId && 
        currentUserRole !== 'admin' && 
        currentUserRole !== 'agent') {
      return ApiResponse.forbidden(res, 'You do not have permission to view this ticket');
    }

    ApiResponse.success(res, { ticket });
  } catch (error) {
    next(error);
  }
};

export const getUserTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = extractUserId(req.user);

    if (!userId) {
      return ApiResponse.unauthorized(res, 'User not authenticated');
    }

    const query: any = { userId };

    if (status) query.status = status;

    const total = await Ticket.countDocuments(query);
    const tickets = await Ticket.find(query)
      .populate('eventId', 'title startDate venue')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      tickets,
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

export const verifyTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { qrCode } = req.body;
    const ticket = await Ticket.findOne({ qrCode })
      .populate('eventId', 'title startDate endDate venue')
      .populate('userId', 'username email');

    if (!ticket) {
      return ApiResponse.notFound(res, 'Invalid ticket');
    }

    // Check if ticket is valid
    if (ticket.status !== 'active') {
      return ApiResponse.badRequest(res, `Ticket is ${ticket.status}`);
    }

    // Check if event is still valid
    const event = ticket.eventId as any;
    if (new Date() > new Date(event.endDate)) {
      return ApiResponse.badRequest(res, 'Event has ended');
    }

    // Record scan
    const scannedById = extractUserId(req.user);
    const scannerObjectId = scannedById 
      ? Types.ObjectId.createFromHexString(scannedById) 
      : new Types.ObjectId();

    ticket.scanHistory.push({
      scannedBy: scannerObjectId,
      scannedAt: new Date(),
      location: req.body.location
    });

    ticket.status = 'used';
    ticket.usedAt = new Date();
    await ticket.save();

    ApiResponse.success(res, { ticket });
  } catch (error) {
    next(error);
  }
};

export const generateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('eventId', 'title startDate venue')
      .populate('userId', 'username email');

    if (!ticket) {
      return ApiResponse.notFound(res, 'Ticket not found');
    }

    // Safely convert IDs to strings
    const ticketId = ticket._id instanceof Types.ObjectId 
      ? ticket._id.toString() 
      : String(ticket._id);

    const eventId = ticket.eventId instanceof Types.ObjectId
      ? ticket.eventId.toString()
      : String((ticket.eventId as any)._id);

    // Generate QR code if not exists
    if (!ticket.qrCode) {
      ticket.qrCode = await generateTicketQR(ticketId, eventId);
      await ticket.save();
    }

    // Generate PDF
    const pdfBuffer = await generateTicketPDF(ticket);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticketId}.pdf"`);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const resendTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('eventId', 'title startDate venue')
      .populate('userId', 'username email');

    if (!ticket) {
      return ApiResponse.notFound(res, 'Ticket not found');
    }

    // Generate PDF
    const pdfBuffer = await generateTicketPDF(ticket);

    // Send email with ticket
    await sendEmail({
      email: (ticket.userId as any).email,
      subject: 'Your Event Ticket',
      template: 'ticket',
      data: {
        eventName: (ticket.eventId as any).title,
        ticketId: ticket._id
      },
      attachments: [{
        filename: `ticket-${ticket._id}.pdf`,
        content: pdfBuffer
      }]
    });

    ApiResponse.success(res, null, 'Ticket sent successfully');
  } catch (error) {
    next(error);
  }
};

export const cancelTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return ApiResponse.notFound(res, 'Ticket not found');
    }

    // Check if ticket can be cancelled
    if (ticket.status !== 'active') {
      return ApiResponse.badRequest(res, 'Ticket cannot be cancelled');
    }

    ticket.status = 'cancelled';
    await ticket.save();

    // Update booking if needed
    await Booking.findOneAndUpdate(
      { _id: ticket.bookingId },
      { $inc: { cancelledTickets: 1 } }
    );

    // Update event tickets count
    await Event.findOneAndUpdate(
      { _id: ticket.eventId },
      { $inc: { soldTickets: -1, availableTickets: 1 } }
    );

    ApiResponse.success(res, { ticket });
  } catch (error) {
    next(error);
  }
};

export const transferTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { receiverEmail } = req.body;
    const ticket = await Ticket.findById(req.params.id) as ITicket;

    if (!ticket) {
      return ApiResponse.notFound(res, 'Ticket not found');
    }

    if (ticket.status !== 'active') {
      return ApiResponse.badRequest(res, 'Only active tickets can be transferred');
    }

    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) {
      return ApiResponse.notFound(res, 'Receiver not found');
    }

    ticket.userId = receiver._id;
    await ticket.save();

    ApiResponse.success(res, { ticket });
  } catch (error) {
    next(error);
  }
};

export const validateTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ticketId, eventId } = req.body;
    const ticket = await Ticket.findOne({ _id: ticketId, eventId });

    if (!ticket) {
      return ApiResponse.notFound(res, 'Invalid ticket');
    }

    ApiResponse.success(res, { 
      valid: ticket.status === 'active',
      ticket 
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tickets = await Ticket.find({ userId: extractUserId(req.user) }) 
      .populate('eventId', 'title startDate venue')
      .sort('-createdAt');

    ApiResponse.success(res, { tickets });
  } catch (error) {
    next(error);
  }
};

export const downloadTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('eventId', 'title startDate venue')
      .populate('userId', 'username email');

    if (!ticket) {
      return ApiResponse.notFound(res, 'Ticket not found');
    }

    const pdfBuffer = await generateTicketPDF(ticket);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticket._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const bulkGenerateTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId, quantity, tierId } = req.body;
    const tickets = [];

    for (let i = 0; i < quantity; i++) {
      const qrCode = await generateQRCode(`${eventId}-${Date.now()}-${i}`);
      const ticket = await Ticket.create({
        eventId,
        tierId,
        qrCode,
        status: 'active'
      });
      tickets.push(ticket);
    }

    ApiResponse.success(res, { tickets });
  } catch (error) {
    next(error);
  }
};

export const getEventTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const tickets = await Ticket.find({ eventId })
      .populate([
        { path: 'userId', select: 'username email' },
        { path: 'eventId', select: 'title startDate venue' }
      ])
      .sort('-createdAt');

    if (!tickets.length) {
      return ApiResponse.success(res, { 
        tickets: [],
        message: 'No tickets found for this event' 
      });
    }

    // Group tickets by status
    const ticketStats = {
      total: tickets.length,
      active: tickets.filter(t => t.status === 'active').length,
      used: tickets.filter(t => t.status === 'used').length,
      cancelled: tickets.filter(t => t.status === 'cancelled').length,
      expired: tickets.filter(t => t.status === 'expired').length
    };

    ApiResponse.success(res, { 
      tickets,
      stats: ticketStats 
    });
  } catch (error) {
    next(error);
  }
};