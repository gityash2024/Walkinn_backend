import express from 'express';
import { body } from 'express-validator';
import { register, login } from '../controllers/auth';

const router = express.Router();

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['admin', 'user', 'agent', 'scanner']),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').exists(),
  ],
  login
);

export default router;
