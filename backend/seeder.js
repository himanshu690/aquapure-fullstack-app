import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Product from './models/Product.js';
import User from './models/User.js';
import Order from './models/Order.js';
import { sampleProducts, sampleUsers, sampleOrders, adminAccount } from './utils/sampleData.js';

dotenv.config();
await connectDB();

const importData = async () => {
    try {
        // Clear existing data
        await Product.deleteMany();
        await User.deleteMany();
        await Order.deleteMany();

        console.log('Cleared existing data...');

        // Insert products and orders (they don't need special handling)
        await Product.insertMany(sampleProducts);
        await Order.insertMany(sampleOrders);
        
        console.log('Products and Orders imported...');

        // Use User.create() for users to trigger the password hashing middleware
        const usersToCreate = [...sampleUsers, adminAccount];
        await User.create(usersToCreate);
        
        console.log('Users (with hashed passwords) imported!');
        
        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error during data import: ${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Product.deleteMany();
        await User.deleteMany();
        await Order.deleteMany();
        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}