import express from 'express';
import { protect, authorize } from '../middleware/auth';
import { validateUpdateProfile, validateChangePassword } from '../validations/user';
import { upload } from '../middleware/upload';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/user';

const router = express.Router();

const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

router.use(asyncHandler(protect));

router.get('/profile', asyncHandler(getProfile));
router.put('/profile', validateUpdateProfile, asyncHandler(updateProfile));
router.put('/avatar', upload.single('avatar'), asyncHandler(updateAvatar));
router.put('/password', validateChangePassword, asyncHandler(changePassword));

router.use(asyncHandler(authorize('admin')));

router.get('/', asyncHandler(getAllUsers));
router.get('/:id', asyncHandler(getUserById));
router.put('/:id', asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));

export default router;