// --- CONFIGURATION ---
const API_URL = 'http://localhost:5000/api';

// --- APPLICATION STATE ---
let currentUser = null;
let products = [];
let logoClickCount = 0;
let logoClickTimeout = null;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing AquaPure Full-Stack application...');
    checkLoginStatus();
    setupEventListeners();
    loadProducts();
    showSection('home');
    console.log('Application initialized successfully');
});

// --- API HELPER FUNCTIONS ---
async function apiRequest(endpoint, method = 'GET', body = null, authenticated = false) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('aquapure_token');

    if (authenticated && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'An API error occurred');
        }
        return data;
    } catch (error) {
        console.error(`API Error on ${method} ${endpoint}:`, error);
        alert(`Error: ${error.message}`);
        throw error;
    }
}

// --- AUTHENTICATION ---
function checkLoginStatus() {
    const user = localStorage.getItem('aquapure_user');
    const token = localStorage.getItem('aquapure_token');
    if (user && token) {
        currentUser = JSON.parse(user);
        updateUserNavigation();
    }
}

async function userLogin(email, password) {
    try {
        const data = await apiRequest('/auth/login', 'POST', { email, password });
        localStorage.setItem('aquapure_token', data.token);
        localStorage.setItem('aquapure_user', JSON.stringify(data.user));
        currentUser = data.user;

        updateUserNavigation();
        showSection('user-dashboard');
        showSuccessMessage('Welcome back! You have been logged in successfully.');
    } catch (error) {
        // Error is alerted in apiRequest
    }
}

async function userRegister(userData) {
    try {
        const data = await apiRequest('/auth/register', 'POST', userData);
        localStorage.setItem('aquapure_token', data.token);
        localStorage.setItem('aquapure_user', JSON.stringify(data));
        currentUser = data;

        updateUserNavigation();
        showSection('user-dashboard');
        showSuccessMessage('Registration successful! Welcome to AquaPure.');
    } catch (error) {
        // Error is alerted in apiRequest
    }
}

function userLogout() {
    currentUser = null;
    localStorage.removeItem('aquapure_token');
    localStorage.removeItem('aquapure_user');
    updateUserNavigation();
    showSection('home');
    showSuccessMessage('You have been logged out successfully.');
}

async function adminLogin(email, password) {
    try {
        // Using user login endpoint which handles admin credentials
        const data = await apiRequest('/auth/login', 'POST', { email, password });
        if (data.user.role !== 'admin') {
            alert('Not an admin account.');
            return;
        }
        localStorage.setItem('aquapure_token', data.token);
        localStorage.setItem('aquapure_user', JSON.stringify(data.user));
        currentUser = data.user;

        showAdminSection('admin-dashboard');
        loadAdminData();
        showSuccessMessage('Admin login successful! Welcome to the Admin Panel.');
    } catch (error) {
        // Error is alerted in apiRequest
    }
}

function adminLogout() {
    currentUser = null;
    localStorage.removeItem('aquapure_token');
    localStorage.removeItem('aquapure_user');
    showUserInterface();
    showSection('home');
    showSuccessMessage('Admin logged out successfully.');
}

// --- UI & NAVIGATION ---
function showSection(sectionId) {
    document.querySelectorAll('#user-content .section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('#user-nav .nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');
    
    document.querySelector(`#user-nav .nav-btn[onclick="showSection('${sectionId}')"]`)?.classList.add('active');

    // Load content for specific sections
    const loaders = {
        'products': loadProducts,
        'user-dashboard': loadUserDashboard,
        'my-orders': loadUserOrders,
        'profile': loadUserProfile
    };
    loaders[sectionId]?.();
}

function showAdminSection(sectionId) {
    document.querySelectorAll('#admin-content .admin-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('#admin-nav .nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');

    document.querySelector(`#admin-nav .nav-btn[onclick="showAdminSection('${sectionId}')"]`)?.classList.add('active');

    const loaders = {
        'admin-dashboard': loadAdminData,
        'admin-products': loadAdminProducts,
        'admin-orders': () => loadAdminOrders(),
        'admin-users': loadAdminUsers,
    };
    loaders[sectionId]?.();
}

function updateUserNavigation() {
    const authBtns = document.querySelectorAll('.auth-btn');
    const userBtns = document.querySelectorAll('.user-btn');

    if (currentUser && currentUser.role === 'user') {
        authBtns.forEach(btn => btn.classList.add('hidden'));
        userBtns.forEach(btn => btn.classList.remove('hidden'));
    } else {
        authBtns.forEach(btn => btn.classList.remove('hidden'));
        userBtns.forEach(btn => btn.classList.add('hidden'));
    }
}

function showUserInterface() {
    document.getElementById('user-header').classList.remove('hidden');
    document.getElementById('admin-header').classList.add('hidden');
    document.getElementById('user-content').classList.remove('hidden');
    document.getElementById('admin-content').classList.add('hidden');
    window.location.hash = '';
}

function showAdminInterface() {
    document.getElementById('user-header').classList.add('hidden');
    document.getElementById('admin-header').classList.remove('hidden');
    document.getElementById('user-content').classList.add('hidden');
    document.getElementById('admin-content').classList.remove('hidden');

    if (currentUser && currentUser.role === 'admin') {
        showAdminSection('admin-dashboard');
        loadAdminData();
    } else {
        showAdminSection('admin-login');
    }
    window.location.hash = 'admin';
}

function handleLogoClick() {
    logoClickCount++;
    if (logoClickCount === 3) {
        showAdminInterface();
        logoClickCount = 0;
    }
    if (logoClickTimeout) clearTimeout(logoClickTimeout);
    logoClickTimeout = setTimeout(() => { logoClickCount = 0; }, 3000);
}


// --- PRODUCT & ORDER LOGIC ---
async function loadProducts() {
    try {
        products = await apiRequest('/products');
        renderProducts();
    } catch (error) {
        document.getElementById('products-grid').innerHTML = `<p>Error loading products.</p>`;
    }
}

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `<div class="empty-state"><h3>No Products Available</h3></div>`;
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.imageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x250';">
            <div class="product-card-content">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-price">₹${product.price}</div>
                <div class="product-stock ${getStockClass(product.stock)}">${getStockText(product.stock)}</div>
                <button class="btn btn--primary btn--full-width" onclick="openOrderModal('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Out of Stock' : 'Order Now'}
                </button>
            </div>
        </div>
    `).join('');
}

function getStockClass(stock) {
    if (stock === 0) return 'stock-out';
    if (stock <= 10) return 'stock-low';
    return 'stock-available';
}

function getStockText(stock) {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 10) return `Only ${stock} left`;
    return `${stock} in stock`;
}

function openOrderModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('order-product-id').value = product.id;
    document.getElementById('order-product-image').src = product.imageUrl;
    document.getElementById('order-product-name').textContent = product.name;
    document.getElementById('order-product-price').textContent = `₹${product.price}`;
    
    if (currentUser) {
        document.getElementById('customer-name').value = currentUser.name;
        document.getElementById('customer-email').value = currentUser.email;
        document.getElementById('customer-phone').value = currentUser.phone || '';
        document.getElementById('customer-address').value = currentUser.address || '';
    } else {
        document.getElementById('order-form').reset();
    }
    
    document.getElementById('order-quantity').value = 1;
    updateOrderTotal();
    showModal('order-modal');
}

function updateOrderTotal() {
    const productId = document.getElementById('order-product-id').value;
    const quantity = parseInt(document.getElementById('order-quantity').value) || 0;
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('total-amount').textContent = product.price * quantity;
    }
}

async function submitOrder() {
    const productId = document.getElementById('order-product-id').value;
    const quantity = parseInt(document.getElementById('order-quantity').value);
    const product = products.find(p => p.id === productId);

    if (quantity > product.stock) {
        return alert(`Sorry, only ${product.stock} items available.`);
    }

    const orderData = {
        userId: currentUser ? currentUser.id : null,
        customerName: document.getElementById('customer-name').value,
        email: document.getElementById('customer-email').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('customer-address').value,
        items: [{
            productId: product.id,
            productName: product.name,
            quantity,
            price: product.price
        }],
        totalAmount: product.price * quantity,
        specialInstructions: document.getElementById('special-instructions').value
    };

    try {
        const newOrder = await apiRequest('/orders', 'POST', orderData);
        closeModal('order-modal');
        showSuccessMessage(`Order Placed Successfully! Your Order ID is: ${newOrder.orderId}`);
        loadProducts(); // Refresh products to show updated stock
    } catch (error) {
        // Error already handled
    }
}

// --- USER DASHBOARD ---
async function loadUserDashboard() {
    if (!currentUser) return showSection('auth');
    try {
        const userOrders = await apiRequest('/orders/myorders', 'GET', null, true);
        const totalSpent = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const pendingOrders = userOrders.filter(o => o.status === 'Pending').length;

        document.getElementById('user-total-orders').textContent = userOrders.length;
        document.getElementById('user-total-spent').textContent = `₹${totalSpent}`;
        document.getElementById('user-pending-orders').textContent = pendingOrders;
        
        renderOrderList(userOrders.slice(0, 3), 'user-recent-orders');
    } catch (error) {
        userLogout(); // Token might be invalid
    }
}

async function loadUserOrders() {
    if (!currentUser) return showSection('auth');
    try {
        const userOrders = await apiRequest('/orders/myorders', 'GET', null, true);
        renderOrderList(userOrders, 'user-orders-list');
    } catch (error) {
         userLogout();
    }
}

function renderOrderList(orders, containerId) {
    const container = document.getElementById(containerId);
    if (orders.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No orders found.</p></div>`;
        return;
    }
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-card-header">
                <span class="order-id">${order.orderId}</span>
                <span class="order-date">${formatDate(order.orderDate)}</span>
            </div>
            <div class="order-details">
                ${order.items.map(item => `<div class="order-product">${item.productName} (x${item.quantity})</div>`).join('')}
            </div>
            <div class="order-card-footer">
                <span class="order-total">₹${order.totalAmount}</span>
                <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
            </div>
        </div>
    `).join('');
}

function loadUserProfile() {
    if (!currentUser) return showSection('auth');
    document.getElementById('profile-name').value = currentUser.name;
    document.getElementById('profile-email').value = currentUser.email;
    document.getElementById('profile-phone').value = currentUser.phone;
    document.getElementById('profile-address').value = currentUser.address;
}

// --- ADMIN PANEL ---
async function loadAdminData() {
    try {
        const stats = await apiRequest('/admin/stats', 'GET', null, true);
        document.getElementById('total-products').textContent = stats.totalProducts;
        document.getElementById('total-orders').textContent = stats.totalOrders;
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('total-revenue').textContent = `₹${stats.totalRevenue}`;
        renderLowStockAlerts(stats.lowStockProducts);
    } catch (error) {
        adminLogout();
    }
}

function renderLowStockAlerts(lowStockProducts) {
    const alertsContainer = document.getElementById('low-stock-alerts');
    if (lowStockProducts.length === 0) {
        alertsContainer.innerHTML = `<div class="empty-state"><p>All products are well stocked! 🎉</p></div>`;
    } else {
        alertsContainer.innerHTML = lowStockProducts.map(product => `
            <div class="low-stock-alert">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="stock-level">Stock: ${product.stock} (Reorder: ${product.reorderLevel})</div>
                </div>
                <button class="btn btn--warning btn--sm" onclick="openRestockModal('${product.id}')">Restock</button>
            </div>
        `).join('');
    }
}

async function loadAdminProducts() {
    const products = await apiRequest('/products', 'GET', null, true);
    const tbody = document.querySelector('#admin-products-table tbody');
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>₹${p.price}</td>
            <td>${p.stock}</td>
            <td><span class="stock-indicator ${getStockClass(p.stock)}">${p.stock > 0 ? (p.stock <= p.reorderLevel ? 'Low Stock' : 'In Stock') : 'Out of Stock'}</span></td>
            <td>
                <button class="btn btn--sm" onclick="openRestockModal('${p.id}')">Restock</button>
                <button class="btn btn--sm" onclick="editProduct('${p.id}')">Edit</button>
                <button class="btn btn--sm btn--danger" onclick="deleteProduct('${p.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function loadAdminOrders(statusFilter = '') {
    let allOrders = await apiRequest('/orders', 'GET', null, true);
    if(statusFilter) {
        allOrders = allOrders.filter(o => o.status === statusFilter);
    }
    const tbody = document.querySelector('#admin-orders-table tbody');
    tbody.innerHTML = allOrders.map(order => `
        <tr>
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.items[0].productName} (x${order.items[0].quantity})</td>
            <td>₹${order.totalAmount}</td>
            <td>${formatDate(order.orderDate)}</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
            <td>
                <select onchange="updateOrderStatus('${order.orderId}', this.value)">
                    <option value="">Update...</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </td>
        </tr>
    `).join('');
}

async function loadAdminUsers() {
    const users = await apiRequest('/admin/users', 'GET', null, true);
    const tbody = document.querySelector('#admin-users-table tbody');
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${formatDate(user.registeredDate)}</td>
            <td>${user.orderCount}</td>
        </tr>
    `).join('');
}

async function addOrUpdateProduct() {
    const editId = document.getElementById('edit-product-id').value;
    const productData = {
        name: document.getElementById('product-name').value,
        price: document.getElementById('product-price').value,
        description: document.getElementById('product-description').value,
        imageUrl: document.getElementById('product-image').value,
        stock: document.getElementById('product-stock').value,
        category: document.getElementById('product-category').value,
    };

    try {
        if (editId) {
            await apiRequest(`/products/${editId}`, 'PUT', productData, true);
            showSuccessMessage('Product updated successfully!');
        } else {
            await apiRequest('/products', 'POST', productData, true);
            showSuccessMessage('Product added successfully!');
        }
        closeModal('add-product-modal');
        loadAdminProducts();
        loadProducts(); // Also refresh user view
    } catch(error) { /* Handled */ }
}

function showAddProductModal() {
    document.getElementById('add-product-form').reset();
    document.getElementById('edit-product-id').value = '';
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    document.getElementById('product-submit-btn').textContent = 'Add Product';
    showModal('add-product-modal');
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-description').value = product.description;
    document.getElementById('product-image').value = product.imageUrl;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-category').value = product.category;
    
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-submit-btn').textContent = 'Update Product';
    showModal('add-product-modal');
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await apiRequest(`/products/${productId}`, 'DELETE', null, true);
            showSuccessMessage('Product deleted successfully!');
            loadAdminProducts();
            loadProducts();
        } catch(error) { /* Handled */ }
    }
}

async function updateOrderStatus(orderId, status) {
    if (!status) return;
    try {
        await apiRequest(`/orders/${orderId}/status`, 'PUT', { status }, true);
        showSuccessMessage(`Order ${orderId} status updated to ${status}`);
        loadAdminOrders();
    } catch(error) { /* Handled */ }
}

function openRestockModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('restock-product-id').value = product.id;
    document.getElementById('restock-product-name').textContent = product.name;
    document.getElementById('restock-current-stock').textContent = product.stock;
    document.getElementById('restock-quantity').value = '';
    updateNewStockLevel();
    showModal('restock-modal');
}

async function submitRestock() {
    const productId = document.getElementById('restock-product-id').value;
    const restockData = {
        quantity: parseInt(document.getElementById('restock-quantity').value),
        reason: document.getElementById('restock-reason').value
    };

    if (!restockData.quantity || restockData.quantity <= 0) {
        return alert('Please enter a valid quantity.');
    }
    
    try {
        await apiRequest(`/products/${productId}/restock`, 'POST', restockData, true);
        showSuccessMessage('Product restocked successfully!');
        closeModal('restock-modal');
        await loadProducts(); // Refresh global products array
        loadAdminProducts(); // Rerender admin table
        loadAdminData(); // Refresh dashboard alerts
    } catch(error) { /* Handled */ }
}

function bulkRestock() {
    showModal('bulk-restock-modal');
}

async function submitBulkRestock() {
    const bulkData = {
        quantity: parseInt(document.getElementById('bulk-quantity').value),
        reason: document.getElementById('bulk-reason').value
    };
    if (!bulkData.quantity || bulkData.quantity <= 0) {
        return alert('Please enter a valid quantity.');
    }
    
    try {
        await apiRequest('/products/bulk-restock', 'POST', bulkData, true);
        showSuccessMessage('All products have been restocked!');
        closeModal('bulk-restock-modal');
        await loadProducts(); // Refresh global products array
        loadAdminProducts(); // Rerender admin table
        loadAdminData(); // Refresh dashboard alerts
    } catch(error) { /* Handled */ }
}

// --- UTILITY & EVENT LISTENERS ---
function setupEventListeners() {
    // Auth forms
    document.getElementById('user-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        userLogin(e.target.elements['login-email'].value, e.target.elements['login-password'].value);
    });
    document.getElementById('user-register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const userData = {
            name: e.target.elements['register-name'].value,
            email: e.target.elements['register-email'].value,
            password: e.target.elements['register-password'].value,
            phone: e.target.elements['register-phone'].value,
            address: e.target.elements['register-address'].value,
        };
        userRegister(userData);
    });
    document.getElementById('admin-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        adminLogin(e.target.elements['admin-email'].value, e.target.elements['admin-password'].value);
    });
    
    // Modals forms
    document.getElementById('order-form').addEventListener('submit', (e) => { e.preventDefault(); submitOrder(); });
    document.getElementById('add-product-form').addEventListener('submit', (e) => { e.preventDefault(); addOrUpdateProduct(); });
    document.getElementById('restock-form').addEventListener('submit', (e) => { e.preventDefault(); submitRestock(); });
    document.getElementById('bulk-restock-form').addEventListener('submit', (e) => { e.preventDefault(); submitBulkRestock(); });
    
    // Dynamic inputs
    document.getElementById('order-quantity').addEventListener('input', updateOrderTotal);
    document.getElementById('restock-quantity').addEventListener('input', updateNewStockLevel);
    document.getElementById('status-filter').addEventListener('change', (e) => loadAdminOrders(e.target.value));
}

function showModal(modalId) { document.getElementById(modalId).classList.remove('hidden'); }
function closeModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }
function showLogin() { document.getElementById('login-form').classList.add('active'); document.getElementById('register-form').classList.remove('active'); }
function showRegister() { document.getElementById('login-form').classList.remove('active'); document.getElementById('register-form').classList.add('active'); }
function formatDate(dateString) { return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
function showSuccessMessage(message) { document.getElementById('success-message').innerHTML = message; showModal('success-modal'); }
function updateNewStockLevel() {
    const productId = document.getElementById('restock-product-id').value;
    const quantity = parseInt(document.getElementById('restock-quantity').value) || 0;
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('new-stock-level').textContent = product.stock + quantity;
    }
}
function setRestockQuantity(quantity) {
    document.getElementById('restock-quantity').value = quantity;
    updateNewStockLevel();
}

// Make functions globally available
window.showSection = showSection;
window.showAdminSection = showAdminSection;
window.handleLogoClick = handleLogoClick;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.userLogout = userLogout;
window.adminLogout = adminLogout;
window.showUserInterface = showUserInterface;
window.openOrderModal = openOrderModal;
window.closeModal = closeModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.openRestockModal = openRestockModal;
window.setRestockQuantity = setRestockQuantity;
window.bulkRestock = bulkRestock;
window.showAddProductModal = showAddProductModal;