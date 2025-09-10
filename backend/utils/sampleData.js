export const sampleProducts = [
    {
        id: "WB001", name: "Premium Steel Water Bottle 1L", price: 299, description: "Stainless steel, BPA-free, keeps drinks cold for 24 hours", imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=300&fit=crop", stock: 5, category: "Premium", reorderLevel: 10, restockHistory: [{"date": "2025-09-01T10:00:00", "quantity": 50, "reason": "Initial stock"}, {"date": "2025-09-05T14:30:00", "quantity": 25, "reason": "Restocked due to high demand"}]
    },
    {
        id: "WB002", name: "Eco Glass Water Bottle 750ml", price: 199, description: "Borosilicate glass, eco-friendly, dishwasher safe", imageUrl: "https://images.unsplash.com/photo-1594736797933-d0f06ba42c4e?w=300&h=300&fit=crop", stock: 30, category: "Eco-Friendly", reorderLevel: 15, restockHistory: [{"date": "2025-08-28T09:00:00", "quantity": 40, "reason": "Initial stock"}]
    },
    {
        id: "WB003", name: "Sports Water Bottle 500ml",  price: 149, description: "Leak-proof, lightweight, perfect for workouts", imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop", stock: 75, category: "Sports", reorderLevel: 20, restockHistory: [{"date": "2025-08-25T11:00:00", "quantity": 100, "reason": "Initial stock"}]
    },
    {
        id: "WB004", name: "Kids Colorful Water Bottle 350ml", price: 99, description: "Fun designs, easy grip, spill-proof for children", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop", stock: 8, category: "Kids", reorderLevel: 12, restockHistory: [{"date": "2025-08-20T16:00:00", "quantity": 50, "reason": "Initial stock"}]
    }
];

export const sampleUsers = [
    {
        id: "USR001", name: "Rahul Sharma", email: "rahul@example.com", password: "password123", phone: "9876543210", address: "123 MG Road, Bangalore, Karnataka 560001", registeredDate: "2025-09-01T10:00:00", role: "user"
    },
    {
        id: "USR002", name: "Priya Singh", email: "priya@example.com", password: "password123", phone: "8765432109", address: "456 Park Street, Delhi, Delhi 110001", registeredDate: "2025-09-05T15:30:00", role: "user"
    },
    {
        id: "USR003", name: "Amit Kumar", email: "amit@example.com", password: "password123", phone: "7654321098", address: "789 Ring Road, Mumbai, Maharashtra 400001", registeredDate: "2025-09-08T09:15:00", role: "user"
    }
];

export const adminAccount = {
    id: "ADMIN001", name: "AquaPure Admin", email: "admin@aquapure.com", password: "admin123", phone: "0000000000", address: "Admin Address", role: "admin"
};

export const sampleOrders = [
    {
        orderId: "ORD001", userId: "USR001", customerName: "Rahul Sharma", email: "rahul@example.com", phone: "9876543210", address: "123 MG Road, Bangalore, Karnataka 560001", items: [{ productId: "WB001", productName: "Premium Steel Water Bottle 1L", quantity: 2, price: 299}], totalAmount: 598, orderDate: "2025-09-09T10:30:00", status: "Pending", specialInstructions: "Please deliver before evening"
    },
    {
        orderId: "ORD002", userId: "USR002",  customerName: "Priya Singh", email: "priya@example.com", phone: "8765432109", address: "456 Park Street, Delhi, Delhi 110001", items: [{ productId: "WB002", productName: "Eco Glass Water Bottle 750ml", quantity: 1, price: 199 }], totalAmount: 199, orderDate: "2025-09-08T15:45:00", status: "Approved", specialInstructions: ""
    },
    {
        orderId: "ORD003", userId: "USR003", customerName: "Amit Kumar", email: "amit@example.com", phone: "7654321098", address: "789 Ring Road, Mumbai, Maharashtra 400001", items: [{ productId: "WB003", productName: "Sports Water Bottle 500ml", quantity: 3, price: 149 }], totalAmount: 447, orderDate: "2025-09-07T12:20:00", status: "Delivered", specialInstructions: "Call before delivery"
    }
];