// --- CONFIGURATION ---
const API_URL = 'http://localhost:5000/api';

// --- APPLICATION STATE ---
let adminUser = null;
let allProducts = [];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing AquaPure Admin application...');
    checkAdminLogin();
    setupAdminEventListeners();
});

// --- API HELPER ---
async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('aquapure_admin_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'API error');
        return data;
    } catch (error) {
        console.error(`API Error on ${method} ${endpoint}:`, error);
        showSuccessMessage(`Error: ${error.message}`, true);
        throw error;
    }
}

// --- AUTHENTICATION ---
function checkAdminLogin() {
    const user = localStorage.getItem('aquapure_admin_user');
    if (user) {
        adminUser = JSON.parse(user);
        if (adminUser.role === 'admin') {
            document.getElementById('admin-login').style.display = 'none';
            showAdminSection('admin-dashboard');
            return;
        }
    }
    document.getElementById('admin-login').style.display = 'block';
    document.querySelectorAll('.admin-section:not(#admin-login)').forEach(s => s.classList.remove('active'));
}

async function adminLogin(email, password) {
    try {
        const data = await apiRequest('/auth/login', 'POST', { email, password });
        if (data.user.role !== 'admin') {
            return showSuccessMessage('Not an authorized admin account.', true);
        }
        localStorage.setItem('aquapure_admin_token', data.token);
        localStorage.setItem('aquapure_admin_user', JSON.stringify(data.user));
        adminUser = data.user;
        checkAdminLogin();
    } catch (error) { /* Handled */ }
}

function adminLogout() {
    adminUser = null;
    localStorage.removeItem('aquapure_admin_token');
    localStorage.removeItem('aquapure_admin_user');
    checkAdminLogin();
}

// --- UI & NAVIGATION ---
function showAdminSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    
    const loaders = {
        'admin-dashboard': loadAdminDashboard,
        'admin-products': loadAdminProducts,
        'admin-orders': () => loadAdminOrders(),
        'admin-users': loadAdminUsers,
    };
    loaders[sectionId]?.();
}

// --- ADMIN DASHBOARD ---
async function loadAdminDashboard() {
    try {
        const stats = await apiRequest('/admin/stats', 'GET');
        document.getElementById('total-products').textContent = stats.totalProducts;
        document.getElementById('total-orders').textContent = stats.totalOrders;
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('total-revenue').textContent = `₹${stats.totalRevenue.toFixed(2)}`;
        
        const alertsContainer = document.getElementById('low-stock-alerts');
        if (stats.lowStockProducts.length === 0) {
            alertsContainer.innerHTML = `<div class="empty-state"><p>All products are well stocked!</p></div>`;
        } else {
            alertsContainer.innerHTML = stats.lowStockProducts.map(p => `
                <div class="low-stock-alert">
                    <div class="product-info">
                        <div class="product-name">${p.name}</div>
                        <div class="stock-level">Stock: ${p.stock} (Reorder at ${p.reorderLevel})</div>
                    </div>
                    <button class="btn btn--warning btn--sm" onclick="openRestockModal('${p.id}')">Restock</button>
                </div>`).join('');
        }
    } catch (error) { /* Handled */ }
}

// --- ADMIN FEATURES (Products, Orders, Users) ---
async function loadAdminProducts() {
    try {
        allProducts = await apiRequest('/products');
        const tbody = document.querySelector('#admin-products-table tbody');
        tbody.innerHTML = allProducts.map(p => `
            <tr>
                <td>${p.id}</td><td>${p.name}</td><td>₹${p.price}</td><td>${p.stock}</td>
                <td><span class="${p.stock <= p.reorderLevel ? 'text-warning' : 'text-success'}">${p.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></td>
                <td>
                    <div class="btn-group"><button class="btn btn--sm btn--success" onclick="openRestockModal('${p.id}')">Restock</button><button class="btn btn--sm" onclick="editProduct('${p.id}')">Edit</button><button class="btn btn--sm btn--danger" onclick="deleteProduct('${p.id}')">Delete</button></div>
                </td>
            </tr>`).join('');
    } catch (error) { /* Handled */ }
}

async function loadAdminOrders(statusFilter = '') {
    try {
        let orders = await apiRequest('/orders', 'GET');
        if (statusFilter) {
            orders = orders.filter(o => o.status === statusFilter);
        }
        const tbody = document.querySelector('#admin-orders-table tbody');
        tbody.innerHTML = orders.map(o => `
            <tr>
                <td>${o.orderId}</td><td>${o.customerName}</td><td>${o.items[0].productName}</td><td>${o.items[0].quantity}</td><td>₹${o.totalAmount}</td><td>${new Date(o.orderDate).toLocaleDateString()}</td>
                <td><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
                <td><select class="form-control" onchange="updateOrderStatus('${o.orderId}', this.value)"><option>Update</option>${['Pending', 'Approved', 'Delivered', 'Rejected'].map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
            </tr>`).join('');
    } catch (error) { /* Handled */ }
}

async function loadAdminUsers() {
    try {
        const users = await apiRequest('/admin/users', 'GET');
        const tbody = document.querySelector('#admin-users-table tbody');
        tbody.innerHTML = users.map(u => `
            <tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.phone}</td><td>${new Date(u.registeredDate).toLocaleDateString()}</td><td>${u.orderCount}</td></tr>`
        ).join('');
    } catch (error) { /* Handled */ }
}

async function addOrUpdateProduct() {
    const editId = document.getElementById('edit-product-id').value;
    const productData = {
        name: document.getElementById('product-name').value, price: document.getElementById('product-price').value, description: document.getElementById('product-description').value, imageUrl: document.getElementById('product-image').value, stock: document.getElementById('product-stock').value, category: document.getElementById('product-category').value,
    };
    try {
        await apiRequest(`/products${editId ? `/${editId}` : ''}`, editId ? 'PUT' : 'POST', productData);
        showSuccessMessage(`Product ${editId ? 'updated' : 'added'} successfully!`);
        closeModal('add-product-modal');
        loadAdminProducts();
    } catch (error) { /* Handled */ }
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await apiRequest(`/products/${productId}`, 'DELETE');
            showSuccessMessage('Product deleted successfully!');
            loadAdminProducts();
        } catch(error) { /* Handled */ }
    }
}

async function updateOrderStatus(orderId, status) {
    if (!status) return;
    try {
        await apiRequest(`/orders/${orderId}/status`, 'PUT', { status });
        showSuccessMessage(`Order ${orderId} updated to ${status}`);
        loadAdminOrders(document.getElementById('status-filter').value);
    } catch(error) { /* Handled */ }
}

async function submitRestock() {
    const productId = document.getElementById('restock-product-id').value;
    const restockData = { quantity: parseInt(document.getElementById('restock-quantity').value), reason: document.getElementById('restock-reason').value, };
    try {
        await apiRequest(`/products/${productId}/restock`, 'POST', restockData);
        showSuccessMessage('Product restocked!');
        closeModal('restock-modal');
        loadAdminProducts();
        loadAdminDashboard();
    } catch(error) { /* Handled */ }
}

async function submitBulkRestock() {
    const bulkData = { quantity: parseInt(document.getElementById('bulk-quantity').value), reason: document.getElementById('bulk-reason').value, };
    try {
        await apiRequest('/products/bulk-restock', 'POST', bulkData);
        showSuccessMessage('All products restocked!');
        closeModal('bulk-restock-modal');
        loadAdminProducts();
        loadAdminDashboard();
    } catch(error) { /* Handled */ }
}

// --- MODAL & HELPER FUNCTIONS ---
function setupAdminEventListeners() {
    document.getElementById('admin-login-form').addEventListener('submit', e => { e.preventDefault(); adminLogin(e.target.elements['admin-email'].value, e.target.elements['admin-password'].value); });
    document.getElementById('add-product-form').addEventListener('submit', e => { e.preventDefault(); addOrUpdateProduct(); });
    document.getElementById('restock-form').addEventListener('submit', e => { e.preventDefault(); submitRestock(); });
    document.getElementById('bulk-restock-form').addEventListener('submit', e => { e.preventDefault(); submitBulkRestock(); });
    document.getElementById('status-filter').addEventListener('change', e => loadAdminOrders(e.target.value));
    document.getElementById('restock-quantity').addEventListener('input', updateNewStockLevel);
}

function showAddProductModal() {
    document.getElementById('add-product-form').reset();
    document.getElementById('edit-product-id').value = '';
    document.getElementById('product-modal-title').textContent = 'Add Product';
    showModal('add-product-modal');
}

function editProduct(productId) {
    const p = allProducts.find(prod => prod.id === productId);
    if (!p) return;
    document.getElementById('edit-product-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-price').value = p.price;
    document.getElementById('product-description').value = p.description;
    document.getElementById('product-image').value = p.imageUrl;
    document.getElementById('product-stock').value = p.stock;
    document.getElementById('product-category').value = p.category;
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    showModal('add-product-modal');
}

function openRestockModal(productId) {
    const p = allProducts.find(prod => prod.id === productId);
    if (!p) return;
    document.getElementById('restock-product-id').value = p.id;
    document.getElementById('restock-product-name').textContent = p.name;
    document.getElementById('restock-current-stock').textContent = p.stock;
    document.getElementById('restock-quantity').value = '';
    updateNewStockLevel();
    showModal('restock-modal');
}

function openBulkRestockModal() { showModal('bulk-restock-modal'); }

function updateNewStockLevel() {
    const pId = document.getElementById('restock-product-id').value;
    const qty = parseInt(document.getElementById('restock-quantity').value) || 0;
    const p = allProducts.find(prod => prod.id === pId);
    if (p) document.getElementById('new-stock-level').textContent = p.stock + qty;
}

function showModal(modalId) { document.getElementById(modalId)?.classList.remove('hidden'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.add('hidden'); }
function showSuccessMessage(message, isError = false) {
    const modal = document.getElementById('success-modal');
    modal.querySelector('h3').textContent = isError ? 'Error' : 'Success!';
    modal.querySelector('#success-message').innerHTML = `<p>${message}</p>`;
    showModal('success-modal');
}

// --- GLOBAL SCOPE ---
window.showAdminSection = showAdminSection;
window.adminLogout = adminLogout;
window.closeModal = closeModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.openRestockModal = openRestockModal;
window.openBulkRestockModal = openBulkRestockModal;
window.showAddProductModal = showAddProductModal;