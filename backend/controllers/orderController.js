import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
    const {
        userId,
        customerName,
        email,
        phone,
        address,
        items,
        totalAmount,
        specialInstructions,
    } = req.body;

    if (items && items.length === 0) {
        return res.status(400).json({ message: 'No order items' });
    }

    // Server-side check for stock
    for (const item of items) {
        const product = await Product.findOne({ id: item.productId });
        if (!product || product.stock < item.quantity) {
            return res.status(400).json({ message: `Product ${item.productName} is out of stock.` });
        }
    }

    const order = new Order({
        orderId: `ORD${Date.now().toString().slice(-6)}`,
        userId,
        customerName,
        email,
        phone,
        address,
        items,
        totalAmount,
        specialInstructions,
    });

    const createdOrder = await order.save();
    
    // Decrement stock
    for (const item of items) {
        await Product.updateOne({ id: item.productId }, { $inc: { stock: -item.quantity } });
    }

    res.status(201).json(createdOrder);
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getUserOrders = async (req, res) => {
    const orders = await Order.find({ userId: req.user.id }).sort({ orderDate: -1 });
    res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    const orders = await Order.find({}).sort({ orderDate: -1 });
    res.json(orders);
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
    const order = await Order.findOne({ orderId: req.params.id });

    if (order) {
        order.status = req.body.status;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    const order = await Order.findOne({ orderId: req.params.id });

    if (order) {
        // Simple authorization: only admin or the user who owns the order can view it
        if (req.user.role === 'admin' || order.userId === req.user.id) {
            res.json(order);
        } else {
            res.status(401).json({ message: 'Not authorized to view this order' });
        }
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
};

export {
    createOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    getOrderById,
};