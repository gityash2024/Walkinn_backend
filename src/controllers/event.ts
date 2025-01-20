import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/responses';
import Event from '../models/Event';
import { UploadService } from '../services/upload';
import { logger } from '../utils/logger';

const uploadService = UploadService.getInstance();

const getUserName = (user?: any): string => {
  if (!user) return 'Unknown Organizer';

  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const username = user.username || '';

  if (firstName && lastName) return `${firstName} ${lastName}`;
  return username || 'Unknown Organizer';
};

export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizerName = getUserName(req.user);

    const eventData = {
      ...req.body,
      organizer: {
        id: req.user?._id || req.user?.id,
        name: organizerName,
        email: req.user?.email,
        role: req.user?.role
      }
    };

    const event = await Event.create(eventData);

    if (req.files && Array.isArray(req.files)) {
      const imageUrls = await Promise.all(
        req.files.map(file => uploadService.uploadFile(file, 'events', event._id.toString()))
      );

      event.images = imageUrls;
      if (imageUrls.length > 0) {
        event.thumbnail = imageUrls[0];
      }

      await event.save();
    }

    ApiResponse.created(res, { event });
  } catch (error) {
    next(error);
  }
};

export const getAllEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      type,
      status,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      city,
      featured
    } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { title: new RegExp(search as string, 'i') },
        { description: new RegExp(search as string, 'i') }
      ];
    }

    if (category) query.category = category;
    if (type) query.type = type;
    if (status) query.status = status;
    if (city) query['venue.city'] = new RegExp(city as string, 'i');
    if (featured) query.isFeatured = featured === 'true';

    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate as string);
      if (endDate) query.startDate.$lte = new Date(endDate as string);
    }

    if (minPrice || maxPrice) {
      query['price.min'] = {};
      if (minPrice) query['price.min'].$gte = Number(minPrice);
      if (maxPrice) query['price.min'].$lte = Number(maxPrice);
    }

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      events,
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

export const getEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      ApiResponse.notFound(res, 'Event not found');
      return;
    }
    ApiResponse.success(res, { event });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      ApiResponse.notFound(res, 'Event not found');
      return;
    }

    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role;

    if (event.organizer.id.toString() !== userId?.toString() && userRole !== 'admin') {
      ApiResponse.forbidden(res, 'You do not have permission to update this event');
      return;
    }

    Object.assign(event, req.body);

    if (req.files && Array.isArray(req.files)) {
      const imageUrls = await Promise.all(
        req.files.map(file => uploadService.uploadFile(file, 'events', event._id.toString()))
      );

      if (req.body.keepExistingImages === 'true') {
        event.images = [...event.images, ...imageUrls];
      } else {
        event.images = imageUrls;
      }

      if (imageUrls.length > 0 && !event.thumbnail) {
        event.thumbnail = imageUrls[0];
      }
    }

    await event.save();
    ApiResponse.success(res, { event });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      ApiResponse.notFound(res, 'Event not found');
      return;
    }

    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role;

    if (event.organizer.id.toString() !== userId?.toString() && userRole !== 'admin') {
      ApiResponse.forbidden(res, 'You do not have permission to delete this event');
      return;
    }

    await event.deleteOne();
    ApiResponse.success(res, null, 'Event deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const updateEventStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      ApiResponse.notFound(res, 'Event not found');
      return;
    }

    event.status = status;
    await event.save();
    ApiResponse.success(res, { event });
  } catch (error) {
    next(error);
  }
};

export const toggleFeatureEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      ApiResponse.notFound(res, 'Event not found');
      return;
    }

    event.isFeatured = !event.isFeatured;
    await event.save();
    ApiResponse.success(res, { event });
  } catch (error) {
    next(error);
  }
};

export const getEventsByOrganizer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query: any = {
      'organizer.id': req.user?._id || req.user?.id
    };

    if (status) query.status = status;

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      events,
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

export const getFeaturedEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const events = await Event.find({ isFeatured: true, isPublished: true })
      .sort('-createdAt')
      .limit(10);
    ApiResponse.success(res, { events });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const events = await Event.find({
      startDate: { $gt: new Date() },
      isPublished: true
    })
      .sort('startDate')
      .limit(10);
    ApiResponse.success(res, { events });
  } catch (error) {
    next(error);
  }
};

export const getEventDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('venue')
      .populate('organizer', 'name email phone');
    if (!event) {
      ApiResponse.notFound(res, 'Event not found');
      return;
    }
    ApiResponse.success(res, { event });
  } catch (error) {
    next(error);
  }
};

export const getEventTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      ApiResponse.notFound(res, 'Event not found');
      return;
    }

    // Convert mongoose document to plain object and map ticket tiers
    const ticketTiers = event.ticketTiers.map(tier => ({
      ...tier.toJSON(),
      available: tier.quantity - (tier.available || 0)
    }));

    ApiResponse.success(res, { ticketTiers });
  } catch (error) {
    next(error);
  }
};