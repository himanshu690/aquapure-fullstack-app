import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
    try {
        const { userId, customerName, email, phone, address, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        // 1. Get product details from the database to ensure prices are correct
        const productIds = items.map(item => item.productId);
        const productsFromDB = await Product.find({ id: { $in: productIds } });

        if (productsFromDB.length !== productIds.length) {
            return res.status(404).json({ message: 'One or more products not found' });
        }

        let totalAmount = 0;
        const orderItems = items.map(cartItem => {
            const product = productsFromDB.find(p => p.id === cartItem.productId);
            
            // Check for sufficient stock
            if (product.stock < cartItem.quantity) {
                throw new Error(`Not enough stock for ${product.name}. Only ${product.stock} available.`);
            }
            
            totalAmount += product.price * cartItem.quantity;
            return {
                productId: product.id,
                productName: product.name,
                quantity: cartItem.quantity,
                price: product.price,
            };
        });
        
        const order = new Order({
            orderId: `ORD${Date.now().toString().slice(-6)}`,
            userId, customerName, email, phone, address,
            items: orderItems,
            totalAmount,
        });

        const createdOrder = await order.save();

        // 3. Update stock for each product
        for (const item of orderItems) {
            await Product.updateOne({ id: item.productId }, { $inc: { stock: -item.quantity } });
        }

        res.status(201).json(createdOrder);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// Keep the rest of the functions (getUserOrders, getAllOrders, etc.) the same
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
        if (req.user.role === 'admin' || (order.userId && order.userId === req.user.id)) {
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