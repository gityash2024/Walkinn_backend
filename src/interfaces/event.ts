import { Document, Types } from 'mongoose';

interface ITicketTier {
  name: string;
  description: string;
  price: number;
  quantity: number;
  maxPerBooking: number;
  type: 'single' | 'couple' | 'group';
  available: number;
}

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  type: 'online' | 'offline' | 'hybrid';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  startDate: Date;
  endDate: Date;
  registrationStartDate: Date;
  registrationEndDate: Date;
  thumbnail?: string;
  images: string[];
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    capacity: number;
    amenities: string[];
  };
  organizer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'agent';
  };
  ticketTiers: Array<ITicketTier & Document>;
  minTickets: number;
  maxTickets: number;
  totalTickets: number;
  soldTickets: number;
  price: {
    min: number;
    max: number;
  };
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
}