import Product from '../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    const products = await Product.find({});
    res.json(products);
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    const { name, price, description, imageUrl, stock, category } = req.body;

    const product = new Product({
        id: `WB${Date.now().toString().slice(-4)}`,
        name,
        price,
        description,
        imageUrl,
        stock,
        category,
        reorderLevel: 10, // Default value
        restockHistory: [{
            date: new Date(),
            quantity: stock,
            reason: 'Initial stock',
        }],
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    const { name, price, description, imageUrl, stock, category } = req.body;
    const product = await Product.findOne({ id: req.params.id });

    if (product) {
        product.name = name;
        product.price = price;
        product.description = description;
        product.imageUrl = imageUrl;
        product.stock = stock;
        product.category = category;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    const product = await Product.findOneAndDelete({ id: req.params.id });

    if (product) {
        res.json({ message: 'Product removed' });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
};

// @desc    Restock a product
// @route   POST /api/products/:id/restock
// @access  Private/Admin
const restockProduct = async (req, res) => {
    const { quantity, reason } = req.body;
    const product = await Product.findOne({ id: req.params.id });

    if (product) {
        product.stock += Number(quantity);
        product.restockHistory.unshift({
            date: new Date(),
            quantity: Number(quantity),
            reason,
        });
        await product.save();
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
};

// @desc    Bulk restock all products
// @route   POST /api/products/bulk-restock
// @access  Private/Admin
const getBulkRestock = async (req, res) => {
    const { quantity, reason } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
    }
    
    const updatedProducts = await Product.updateMany({}, {
        $inc: { stock: Number(quantity) },
        $push: {
            restockHistory: {
                $each: [{ date: new Date(), quantity: Number(quantity), reason }],
                $position: 0
            }
        }
    });

    res.json({ message: `${updatedProducts.modifiedCount} products updated successfully.` });
};

// @desc    Get a product's stock history
// @route   GET /api/products/:id/history
// @access  Private/Admin
const getProductStockHistory = async (req, res) => {
    const product = await Product.findOne({ id: req.params.id });
    if (product) {
        res.json(product.restockHistory);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
};

export {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    getBulkRestock,
    getProductStockHistory,
};