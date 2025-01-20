import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/responses';
import Scanner from '../models/Scanner';
import Ticket from '../models/Ticket';
import Event from '../models/Event';
import { Document } from 'mongoose';

interface CustomRequest extends Request {
  user?: any;
}

interface IScanner {
  userId: string;
  device: {
    deviceId: string;
    deviceType: string;
    lastLoginIp: string;
    lastLoginAt: Date;
  };
  status: string;
  location: {
    type: string;
    coordinates: number[];
  };
  assignedEvents: Array<{
    eventId: string;
    status: string;
    startTime: Date;
    endTime: Date;
  }>;
  scanStats: {
    totalScans: number;
    validScans: number;
    invalidScans: number;
    lastScanAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

type IScannerDocument = Document<unknown, {}, IScanner> & IScanner;

export const registerScanner = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceId, deviceType } = req.body;
    const scannerData = {
      userId: req.user?._id,
      device: {
        deviceId,
        deviceType,
        lastLoginIp: req.ip || '',
        lastLoginAt: new Date()
      },
      status: 'active',
      scanStats: {
        totalScans: 0,
        validScans: 0,
        invalidScans: 0,
        lastScanAt: new Date()
      },
      assignedEvents: [],
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    };

    let scanner: any = await Scanner.findOne({ userId: req.user?._id });
    if (scanner) {
      Object.assign(scanner, { 
        device: scannerData.device,
        status: 'active'
      });
      await scanner.save();
    } else {
      scanner = await Scanner.create(scannerData);
    }

    ApiResponse.success(res, { scanner });
  } catch (error) {
    next(error);
  }
};

export const getScannerProfile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const scanner = await Scanner.findOne({ userId: req.user?._id })
      .populate('userId', 'username email firstName lastName');

    if (!scanner) {
      return ApiResponse.notFound(res, 'Scanner profile not found');
    }

    ApiResponse.success(res, { scanner });
  } catch (error) {
    next(error);
  }
};

export const updateScannerLocation = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { latitude, longitude } = req.body;
    const scanner = await Scanner.findOne({ userId: req.user?._id });

    if (!scanner) {
      return ApiResponse.notFound(res, 'Scanner profile not found');
    }

    Object.assign(scanner, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    await scanner.save();
    ApiResponse.success(res, { scanner });
  } catch (error) {
    next(error);
  }
};

export const scanTicket = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { qrCode, eventId, location } = req.body;
    const scanner = await Scanner.findOne({ userId: req.user?._id });

    if (!scanner) {
      return ApiResponse.notFound(res, 'Scanner profile not found');
    }

    const doc: any = scanner;
    const assignedEvent = doc.assignedEvents.find(
      (e: any) => e.eventId.toString() === eventId && e.status === 'active'
    );

    if (!assignedEvent) {
      return ApiResponse.forbidden(res, 'Scanner not assigned to this event');
    }

    const ticket = await Ticket.findOne({ qrCode })
      .populate('eventId')
      .populate('userId', 'username email');

    if (!ticket) {
      doc.scanStats.invalidScans += 1;
      await scanner.save();
      return ApiResponse.notFound(res, 'Invalid ticket');
    }

    if (ticket.status !== 'active') {
      doc.scanStats.invalidScans += 1;
      await scanner.save();
      return ApiResponse.badRequest(res, `Ticket is ${ticket.status}`);
    }

    if ((ticket.eventId as any)._id.toString() !== eventId) {
      doc.scanStats.invalidScans += 1;
      await scanner.save();
      return ApiResponse.badRequest(res, 'Ticket is for a different event');
    }

    ticket.scanHistory.push({
      scannedBy: req.user?._id,
      scannedAt: new Date(),
      location
    });

    ticket.status = 'used';
    ticket.usedAt = new Date();
    await ticket.save();

    doc.scanStats.totalScans += 1;
    doc.scanStats.validScans += 1;
    doc.scanStats.lastScanAt = new Date();
    await scanner.save();

    ApiResponse.success(res, { 
      ticket,
      attendee: ticket.userId,
      validScan: true
    });
  } catch (error) {
    next(error);
  }
};

export const getScannerStats = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const scanner = await Scanner.findOne({ userId: req.user?._id });
    if (!scanner) {
      return ApiResponse.notFound(res, 'Scanner profile not found');
    }

    const doc: any = scanner;
    const stats = {
      totalScans: doc.scanStats.totalScans,
      validScans: doc.scanStats.validScans,
      invalidScans: doc.scanStats.invalidScans,
      lastScanAt: doc.scanStats.lastScanAt,
      accuracy: doc.scanStats.totalScans > 0
        ? (doc.scanStats.validScans / doc.scanStats.totalScans) * 100
        : 0
    };

    const activeAssignments = await Promise.all(
      doc.assignedEvents
        .filter((e: any) => e.status === 'active')
        .map(async (assignment: any) => {
          const event = await Event.findById(assignment.eventId)
            .select('title startDate venue');
          return {
            ...assignment,
            event
          };
        })
    );

    ApiResponse.success(res, { stats, activeAssignments });
  } catch (error) {
    next(error);
  }
};

export const assignScannerToEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scannerId } = req.params;
    const { eventId, startTime, endTime } = req.body;

    const scanner = await Scanner.findById(scannerId);
    if (!scanner) {
      return ApiResponse.notFound(res, 'Scanner not found');
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return ApiResponse.notFound(res, 'Event not found');
    }

    const doc: any = scanner;
    doc.assignedEvents.push({
      eventId,
      status: 'active',
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });

    await scanner.save();
    ApiResponse.success(res, { scanner });
  } catch (error) {
    next(error);
  }
};