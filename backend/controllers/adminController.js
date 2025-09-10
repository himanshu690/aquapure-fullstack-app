import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });

        const revenueResult = await Order.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
        
        const lowStockProducts = await Product.find({ $expr: { $lte: ["$stock", "$reorderLevel"] } });

        res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue,
            lowStockProducts,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password');
        
        // Bonus: add order count for each user
        const usersWithOrderCount = await Promise.all(users.map(async user => {
            const orderCount = await Order.countDocuments({ userId: user.id });
            return { ...user.toObject(), orderCount };
        }));

        res.json(usersWithOrderCount);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export { getAdminStats, getAllUsers };