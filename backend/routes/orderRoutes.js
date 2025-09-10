import express from 'express';
import {
    createOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    getOrderById,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(createOrder)
    .get(protect, admin, getAllOrders);

router.get('/myorders', protect, getUserOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;