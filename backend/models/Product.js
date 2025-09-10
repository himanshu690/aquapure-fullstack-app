import mongoose from 'mongoose';

const restockHistorySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
});

const productSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, required: true },
    reorderLevel: { type: Number, required: true, default: 10 },
    restockHistory: [restockHistorySchema],
}, {
    timestamps: true,
});

const Product = mongoose.model('Product', productSchema);
export default Product;