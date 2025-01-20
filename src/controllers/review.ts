import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/responses';
import Review from '../models/Review';
import Event from '../models/Event';
import Ticket from '../models/Ticket';

interface CustomRequest extends Request {
  user?: any;
  files?: any[];
}

export const createReview = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { eventId, rating, title, review } = req.body;

    const ticket = await Ticket.findOne({
      eventId,
      userId: req.user?._id,
      status: 'used'
    });

    if (!ticket) {
      return ApiResponse.badRequest(res, 'You must attend the event to leave a review');
    }

    const existingReview = await Review.findOne({
      eventId,
      userId: req.user?._id
    });

    if (existingReview) {
      return ApiResponse.badRequest(res, 'You have already reviewed this event');
    }

    const reviewData = {
      userId: req.user?._id,
      eventId,
      rating,
      title,
      review
    };

    const newReview = await Review.create(reviewData);

    if (req.files && Array.isArray(req.files)) {
      const imageUrls = await Promise.all(
        req.files.map(file => uploadFile(file))
      );
      newReview.images = imageUrls as any;
      await newReview.save();
    }

    const eventReviews = await Review.find({ eventId, status: 'approved' });
    const averageRating = eventReviews.reduce((sum, r) => sum + r.rating, 0) / eventReviews.length;

    await Event.findByIdAndUpdate(eventId, {
      'ratings.average': averageRating,
      'ratings.count': eventReviews.length
    });

    ApiResponse.created(res, { review: newReview });
  } catch (error) {
    next(error);
  }
};

export const getEventReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    const query: any = {
      eventId,
      status: 'approved'
    };

    if (rating) query.rating = Number(rating);

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('userId', 'username firstName lastName avatar')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      reviews,
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

export const updateReviewStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return ApiResponse.notFound(res, 'Review not found');
    }

    review.status = status;
    await review.save();

    if (status === 'approved' || status === 'rejected') {
      const approvedReviews = await Review.find({ 
        eventId: review.eventId,
        status: 'approved'
      });

      const averageRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;

      await Event.findByIdAndUpdate(review.eventId, {
        'ratings.average': averageRating || 0,
        'ratings.count': approvedReviews.length
      });
    }

    ApiResponse.success(res, { review });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return ApiResponse.notFound(res, 'Review not found');
    }

    if (review.userId.toString() !== req.user?._id.toString() && req.user?.role !== 'admin') {
      return ApiResponse.forbidden(res, 'You do not have permission to delete this review');
    }

    await review.deleteOne();

    const approvedReviews = await Review.find({
      eventId: review.eventId,
      status: 'approved'
    });

    const averageRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;

    await Event.findByIdAndUpdate(review.eventId, {
      'ratings.average': averageRating || 0,
      'ratings.count': approvedReviews.length
    });

    ApiResponse.success(res, null, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getUserReviews = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = { userId: req.user?._id };

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('eventId', 'title startDate venue')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      reviews,
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

async function uploadFile(file: any): Promise<string> {
  return `https://example.com/uploads/${file.filename}`;
}