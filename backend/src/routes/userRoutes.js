import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes anyone logged in can access
router.route('/:id').put(protect, updateUser);

// Admin-only routes below
router.use(protect, authorize('admin'));

router.route('/').get(getUsers);
router.route('/:id')
  .get(getUser)
  .delete(deleteUser);

export default router;
