
import twilio from 'twilio';
import { logger } from '../utils/logger';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export const twilioClient = twilio(accountSid, authToken);

export const smsConfig = {
  from: process.env.TWILIO_PHONE_NUMBER,
  templates: {
    booking: 'Your booking {{bookingId}} is confirmed for {{eventName}}',
    otp: 'Your OTP for EMS is {{otp}}. Valid for {{validityMinutes}} minutes.',
    ticket: 'Your ticket for {{eventName}} has been generated. Ticket ID: {{ticketId}}',
    reminder: 'Reminder: Your event {{eventName}} is scheduled for {{eventDate}}'
  },
  defaultCountryCode: '+1',
  otpValidityMinutes: 10
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic phone number validation
  const phoneRegex = /^\+?[\d\s-]+$/;
  return phoneRegex.test(phoneNumber);
};