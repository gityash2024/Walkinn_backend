import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/responses';
import Agent from '../models/Agent';
import Event from '../models/Event';
import Booking from '../models/Booking';
import { sendEmail } from '../services/email';
import { logger } from '../utils/logger';

interface CustomRequest extends Request {
  user?: any;
  files?: any;
}

export const registerAgent = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const agentData = {
      userId: req.user?._id,
      ...req.body
    };

    const existingAgent = await Agent.findOne({ userId: req.user?._id });
    if (existingAgent) {
      return ApiResponse.badRequest(res, 'Agent profile already exists');
    }

    const agent = await Agent.create(agentData);

    if (req.files && Array.isArray(req.files)) {
      const documents = await Promise.all(
        req.files.map(async (file: any) => {
          const url = await uploadFile(file);
          return {
            type: file.fieldname,
            url,
            verifiedAt: null,
            verifiedBy: null
          };
        })
      );

      agent.documents = documents as any;
      await agent.save();
    }

    try {
      await sendEmail({
        email: process.env.ADMIN_EMAIL!,
        subject: 'New Agent Registration',
        template: 'agent-registration',
        data: {
          agentName: req.user?.firstName || req.user?.username || 'Agent',
          agentEmail: req.user?.email || '',
          agentId: agent._id
        }
      });
    } catch (error) {
      logger.error('Error sending agent registration notification:', error);
    }

    ApiResponse.created(res, { agent });
  } catch (error) {
    next(error);
  }
};

export const getAgentProfile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const agent = await Agent.findOne({ userId: req.user?._id })
      .populate('userId', 'username email firstName lastName');

    if (!agent) {
      return ApiResponse.notFound(res, 'Agent profile not found');
    }

    ApiResponse.success(res, { agent });
  } catch (error) {
    next(error);
  }
};

export const updateAgentProfile = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const agent = await Agent.findOne({ userId: req.user?._id });
    if (!agent) {
      return ApiResponse.notFound(res, 'Agent profile not found');
    }

    Object.assign(agent, req.body);

    if (req.files && Array.isArray(req.files)) {
      const newDocuments = await Promise.all(
        req.files.map(async (file: any) => {
          const url = await uploadFile(file);
          return {
            type: file.fieldname,
            url,
            verifiedAt: null,
            verifiedBy: null
          };
        })
      );

      agent.documents = [...agent.documents, ...newDocuments] as any;
    }

    await agent.save();
    ApiResponse.success(res, { agent });
  } catch (error) {
    next(error);
  }
};

export const getAgentEvents = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const agent = await Agent.findOne({ userId: req.user?._id });
    if (!agent) {
      return ApiResponse.notFound(res, 'Agent profile not found');
    }

    const { page = 1, limit = 10, status } = req.query;
    
    const query: any = {
      'eventsManaged.eventId': { $in: agent.eventsManaged.map(e => e.eventId) }
    };

    if (status) query.status = status;

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-startDate');

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

export const getAgentStats = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const agent = await Agent.findOne({ userId: req.user?._id });
    if (!agent) {
      return ApiResponse.notFound(res, 'Agent profile not found');
    }

    const stats = {
      totalEvents: agent.eventsManaged.length,
      activeEvents: agent.eventsManaged.filter(e => e.status === 'active').length,
      totalRevenue: agent.totalRevenue,
      totalCommission: agent.totalCommission,
      performance: agent.performance,
      ratings: agent.ratings
    };

    const recentBookings = await Booking.find({
      'agent.id': agent._id
    })
      .sort('-createdAt')
      .limit(5)
      .populate('eventId', 'title startDate');

    ApiResponse.success(res, { stats, recentBookings });
  } catch (error) {
    next(error);
  }
};

export const getAllAgents = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'userId.username': new RegExp(search as string, 'i') },
        { 'userId.email': new RegExp(search as string, 'i') }
      ];
    }

    const total = await Agent.countDocuments(query);
    const agents = await Agent.find(query)
      .populate('userId', 'username email firstName lastName')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort('-createdAt');

    ApiResponse.success(res, {
      agents,
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

export const updateAgentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, verificationStatus } = req.body;
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return ApiResponse.notFound(res, 'Agent not found');
    }

    if (status) agent.status = status;
    if (verificationStatus) agent.verificationStatus = verificationStatus;

    await agent.save();

    try {
      const populatedAgent = await agent.populate('userId');
      await sendEmail({
        email: (populatedAgent.userId as any).email,
        subject: 'Agent Status Update',
        template: 'agent-status-update',
        data: {
          status,
          verificationStatus
        }
      });
    } catch (error) {
      logger.error('Error sending agent status update email:', error);
    }

    ApiResponse.success(res, { agent });
  } catch (error) {
    next(error);
  }
};

async function uploadFile(file: any): Promise<string> {
  return `https://example.com/uploads/${file.filename}`;
}