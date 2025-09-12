import express from 'express';
import { createFeedback, getFeedback } from '../controllers/feedbackController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for anyone to submit feedback
router.route('/').post(createFeedback);

// Admin-only route to view all feedback
router.route('/').get(protect, admin, getFeedback);

export default router;