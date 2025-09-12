import Feedback from '../models/Feedback.js';

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  Public
const createFeedback = async (req, res) => {
    try {
        const { email, message } = req.body;
        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }
        const feedback = await Feedback.create({ email, message });
        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Server error while submitting feedback' });
    }
};

// @desc    Get all feedback for admin
// @route   GET /api/feedback
// @access  Private/Admin
const getFeedback = async (req, res) => {
    try {
        // Fetch newest feedback first
        const feedbackEntries = await Feedback.find({}).sort({ createdAt: -1 });
        res.json(feedbackEntries);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching feedback' });
    }
};

export { createFeedback, getFeedback };