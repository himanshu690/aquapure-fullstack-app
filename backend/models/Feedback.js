import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    email: { type: String, required: true },
    message: { type: String, required: true },
    isArchived: { type: Boolean, required: true, default: false },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;