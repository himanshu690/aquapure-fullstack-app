import express from 'express';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    getBulkRestock,
    getProductStockHistory,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, createProduct);

router.route('/:id')
    .put(protect, admin, updateProduct)
    .delete(protect, admin, deleteProduct);

router.post('/:id/restock', protect, admin, restockProduct);
router.get('/:id/history', protect, admin, getProductStockHistory);
router.post('/bulk-restock', protect, admin, getBulkRestock);

export default router;