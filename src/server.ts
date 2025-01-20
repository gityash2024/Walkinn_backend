import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/database';
import { errorHandler } from './middleware/error';
import { requestLogger, errorLogger } from './middleware/logger';
import { initializeRedis } from './config/redis';
import { initializeEmailTransporter } from './config/email';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import eventRoutes from './routes/event';
import ticketRoutes from './routes/ticket';
import bookingRoutes from './routes/booking';
import paymentRoutes from './routes/payment';
import agentRoutes from './routes/agent';
import venueRoutes from './routes/venue';
import reviewRoutes from './routes/review';
import couponRoutes from './routes/coupon';
import scannerRoutes from './routes/scanner';
import analyticsRoutes from './routes/analytics';
import uploadRoutes from './routes/upload';

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const port = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Initialize services
initializeRedis().catch(console.error);
initializeEmailTransporter().catch(console.error);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Static folder
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// Error logging middleware
const errorLoggingMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  errorLogger(err, req, res, next);
};
app.use(errorLoggingMiddleware);

// Error handling middleware - note the 4 parameters which is important for Express error handlers
const errorHandlingMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  errorHandler(err, req, res, next);
};
app.use(errorHandlingMiddleware);

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log('Environment:', process.env.NODE_ENV);
});

export default app;