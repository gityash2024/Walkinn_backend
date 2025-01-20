
import express from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import eventRoutes from './event';
import ticketRoutes from './ticket';
import bookingRoutes from './booking';
import paymentRoutes from './payment';
import agentRoutes from './agent';
import scannerRoutes from './scanner';
import analyticsRoutes from './analytics';
import venueRoutes from './venue';
import reviewRoutes from './review';
import uploadRoutes from './upload';
import couponRoutes from './coupon';

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/agents', agentRoutes);
router.use('/scanner', scannerRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/venues', venueRoutes);
router.use('/reviews', reviewRoutes);
router.use('/upload', uploadRoutes);
router.use('/coupons', couponRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

export default router;