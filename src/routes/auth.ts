import express, { Request, Response, NextFunction } from 'express';
import { 
  register, 
  login, 
  forgotPassword, 
  resetPassword,
  refreshToken,
  logout 
} from '../controllers/auth';
import { validateRegister, validateLogin, validateResetPassword } from '../validations/auth';

const router = express.Router();

const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/register', validateRegister, asyncHandler(register));

router.post('/login', validateLogin, asyncHandler(login));

router.post('/forgot-password', asyncHandler(forgotPassword));

router.post('/reset-password/:token', validateResetPassword, asyncHandler(resetPassword));

router.post('/refresh-token', asyncHandler(refreshToken));

router.post('/logout', asyncHandler(logout));

export default router;