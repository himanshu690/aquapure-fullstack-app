// --- CONFIGURATION ---
const API_URL = 'http://localhost:5000/api'; // Use your deployed URL

/**
 * Simplified API request helper for the receipt page.
 * It requires a token to fetch order details.
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('aquapure_token'); 
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        document.body.innerHTML = '<h1>Authorization Error: Not logged in.</h1>';
        return;
    }

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'API error');
        }
        return await response.json();
    } catch (error) {
        console.error(`API Error:`, error);
        document.body.innerHTML = `<h1>Error: ${error.message}</h1>`;
        throw error;
    }
}

/**
 * Fetches and populates the receipt with order data.
 */
async function loadReceiptData(orderId) {
    if (!orderId) {
        document.body.innerHTML = '<h1>Error: No Order ID provided.</h1>';
        return;
    }

    try {
        const order = await apiRequest(`/orders/${orderId}`);

        // Populate header and customer details
        document.getElementById('receipt-order-id').textContent = order.orderId;
        document.getElementById('receipt-order-date').textContent = new Date(order.orderDate).toLocaleDateString('en-IN');
        document.getElementById('receipt-customer-name').textContent = order.customerName;
        document.getElementById('receipt-customer-email').textContent = order.email;
        document.getElementById('receipt-customer-phone').textContent = order.phone;
        document.getElementById('receipt-customer-address').textContent = order.address;

        // Populate items table
        const itemsTbody = document.getElementById('receipt-items-tbody');
        itemsTbody.innerHTML = order.items.map(item => `
            <tr>
                <td>${item.productName}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
        `).join('');

        // Populate total
        document.getElementById('receipt-total-amount').textContent = `₹${order.totalAmount.toFixed(2)}`;

    } catch (error) {
        // Error is already displayed on the page by apiRequest
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    loadReceiptData(orderId);
});