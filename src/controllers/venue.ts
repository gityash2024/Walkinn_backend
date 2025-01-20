import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/responses';
import Venue from '../models/Venue';
import Event from '../models/Event';

interface CustomRequest extends Request {
  files?: any[];
}

export const createVenue = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const venue = await Venue.create(req.body);

    if (req.files && Array.isArray(req.files)) {
      const imageUrls = await Promise.all(
        req.files.map(file => uploadFile(file))
      );
      venue.images = imageUrls as any;
      await venue.save();
    }

    ApiResponse.created(res, { venue });
  } catch (error) {
    next(error);
  }
};

export const getVenues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search, city, capacity } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search as string, 'i') },
        { city: new RegExp(search as string, 'i') }
      ];
    }

    if (city) query.city = new RegExp(city as string, 'i');
    if (capacity) query.capacity = { $gte: Number(capacity) };

    const total = await Venue.countDocuments(query);
    const venues = await Venue.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      venues,
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

export const getVenueById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return ApiResponse.notFound(res, 'Venue not found');
    }

    ApiResponse.success(res, { venue });
  } catch (error) {
    next(error);
  }
};

export const updateVenue = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return ApiResponse.notFound(res, 'Venue not found');
    }

    Object.assign(venue, req.body);

    if (req.files && Array.isArray(req.files)) {
      const imageUrls = await Promise.all(
        req.files.map(file => uploadFile(file))
      );
      venue.images = req.body.keepExistingImages === 'true'
        ? [...venue.images, ...imageUrls] as any
        : imageUrls as any;
    }

    await venue.save();
    ApiResponse.success(res, { venue });
  } catch (error) {
    next(error);
  }
};

export const deleteVenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return ApiResponse.notFound(res, 'Venue not found');
    }

    await venue.deleteOne();
    ApiResponse.success(res, null, 'Venue deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const checkVenueAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { venueId } = req.params;
    const { startDate, endDate } = req.query;

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return ApiResponse.notFound(res, 'Venue not found');
    }

    const conflictingEvents = await Event.find({
      'venue.id': venueId,
      $or: [
        {
          startDate: { $lte: new Date(endDate as string) },
          endDate: { $gte: new Date(startDate as string) }
        }
      ]
    }).select('title startDate endDate');

    ApiResponse.success(res, {
      available: conflictingEvents.length === 0,
      conflictingEvents
    });
  } catch (error) {
    next(error);
  }
};

async function uploadFile(file: any): Promise<string> {
  return `https://example.com/uploads/${file.filename}`;
}