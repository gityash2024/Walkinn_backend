import express from 'express';
import {
  createCoupon,
  getAllCoupons,
  getCouponByCode,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon
} from '../controllers/coupon';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect as any);

router.get('/validate', validateCoupon as any);
router.get('/code/:code', getCouponByCode as any);
router.post('/apply', applyCoupon as any);

router.use(authorize('admin') as any);
router.post('/',  createCoupon as any);
router.get('/', getAllCoupons as any);
router.put('/:id',  updateCoupon as any);
router.delete('/:id', deleteCoupon as any);

export default router;