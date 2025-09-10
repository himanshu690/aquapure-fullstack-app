import express from 'express';
import { getAdminStats, getAllUsers } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, admin, getAdminStats);
router.get('/users', protect, admin, getAllUsers);

export default router;