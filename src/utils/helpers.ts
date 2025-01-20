
import crypto from 'crypto';
import { Response } from 'express';
import { APP_CONSTANTS } from './constants';

export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateOTP = (length: number = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
};

export const generateRefCode = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
};

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculatePagination = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^0-9+]/g, '');
};

export const calculateEventDuration = (startDate: Date, endDate: Date): number => {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)); // Duration in hours
};

export const isDatePast = (date: Date): boolean => {
  return new Date(date) < new Date();
};

export const calculatePrice = (basePrice: number, discount: number = 0, tax: number = 0): number => {
  const priceAfterDiscount = basePrice - (basePrice * (discount / 100));
  const finalPrice = priceAfterDiscount + (priceAfterDiscount * (tax / 100));
  return Number(finalPrice.toFixed(2));
};