import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, ref: 'User' },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now },
    status: { type: String, required: true, default: 'Pending' },
    specialInstructions: { type: String },
}, {
    timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order;