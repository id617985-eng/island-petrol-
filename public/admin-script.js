// =============== ADMIN AUTH CHECK ===============
const API_BASE_URL = "https://aifoodies.up.railway.app/api";

// Check for admin token
if(!localStorage.getItem("adminToken")) {
    window.location.href = "admin-login.html";
}

let editingId = null;
let allProducts = [];

// =============== API HELPER ===============
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: data ? JSON.stringify(data) : null
        });
        
        // For 401 responses, redirect to login
        if (response.status === 401) {
            localStorage.removeItem('adminToken');
            window.location.href = 'admin-login.html';
            throw new Error('Unauthorized');
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.msg || result.error || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message || 'API request failed', 'error');
        throw error;
    }
}

// =============== PAGE NAVIGATION ===============
async function showSection(id){
    // Hide all sections
    document.querySelectorAll(".admin-section").forEach(section => {
        section.classList.remove("active");
    });
    
    // Show selected section
    const section = document.getElementById(id);
    if (section) {
        section.classList.add("active");
    }

    // Load section data
    if(id === "products") await loadProducts();
    if(id === "dashboard") await loadDashboard();
    if(id === "availability") await loadAvailability();
    if(id === "slideshow") loadSlides();
    if(id === "orders") await loadOrders();
}

// =============== DASHBOARD ===============
async function loadDashboard(){
    try {
        // Load products and orders
        const products = await apiRequest('/menu-items');
        const orders = await apiRequest('/orders');
        
        // Update dashboard stats
        const statsContainer = document.querySelector('.dashboard-stats');
        if (statsContainer) {
            const nachosCount = products.filter(p => p.category === 'nachos').length;
            const dessertsCount = products.filter(p => p.category === 'desserts').length;
            const drinksCount = products.filter(p => p.category === 'drinks').length;
            const specialsCount = products.filter(p => p.category === 'specials').length;
            
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon">📦</div>
                    <div class="stat-content">
                        <h3 id="stat-products">${products.length}</h3>
                        <p>Total Products</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🌮</div>
                    <div class="stat-content">
                        <h3 id="stat-nachos">${nachosCount}</h3>
                        <p>Nachos Items</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🍰</div>
                    <div class="stat-content">
                        <h3 id="stat-desserts">${dessertsCount}</h3>
                        <p>Dessert Items</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <h3 id="stat-orders">${orders.length}</h3>
                        <p>Total Orders</p>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}

// =============== PRODUCTS MANAGER ===============
async function loadProducts(){
    const list = document.getElementById("product-list");
    
    try {
        const products = await apiRequest('/menu-items');
        allProducts = products;
        
        if (products.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No products found. Click "Add Product" to create your first item.</p></div>';
            return;
        }
        
        // Group by category
        const categories = {
            nachos: products.filter(p => p.category === 'nachos'),
            desserts: products.filter(p => p.category === 'desserts'),
            drinks: products.filter(p => p.category === 'drinks'),
            specials: products.filter(p => p.category === 'specials')
        };
        
        let html = '';
        
        // Add each category section if it has items
        for (const [categoryName, categoryProducts] of Object.entries(categories)) {
            if (categoryProducts.length > 0) {
                const icon = getCategoryIcon(categoryName);
                html += `
                    <div class="category-section">
                        <h3>${icon} ${capitalizeFirst(categoryName)} (${categoryProducts.length} items)</h3>
                        <div class="products-grid">
                            ${categoryProducts.map(p => createProductCard(p)).join('')}
                        </div>
                    </div>
                `;
            }
        }
        
        list.innerHTML = html || '<div class="empty-state"><p>No products found</p></div>';
        
    } catch (error) {
        console.error("Error loading products:", error);
        list.innerHTML = '<div class="empty-state"><p>Error loading products</p></div>';
    }
}

function getCategoryIcon(category) {
    const icons = {
        nachos: '<i class="fas fa-utensils"></i>',
        desserts: '<i class="fas fa-ice-cream"></i>',
        drinks: '<i class="fas fa-wine-glass"></i>',
        specials: '<i class="fas fa-star"></i>'
    };
    return icons[category] || '<i class="fas fa-box"></i>';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function createProductCard(product) {
    return `
        <div class="product-item-card ${product.featured ? 'featured' : ''}" data-id="${product._id}">
            <div class="product-item-image">
                <img src="${product.image || 'https://via.placeholder.com/300x140'}" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/300x140'">
            </div>
            <div class="product-item-info">
                <div class="product-item-header">
                    <h4>${product.name}</h4>
                    <div class="product-item-price">₱${product.price}</div>
                </div>
                <div class="product-item-meta">
                    <span class="product-item-category">${product.category}</span>
                    <span class="product-item-status ${product.available ? 'available' : 'unavailable'}">
                        <i class="fas fa-circle"></i> ${product.available ? 'Available' : 'Unavailable'}
                    </span>
                </div>
                <p class="product-item-description">${product.description || 'No description available'}</p>
                ${product.ingredients ? `<p class="product-item-ingredients">${product.ingredients}</p>` : ''}
                <div class="product-item-actions">
                    <button class="action-btn small primary" onclick="editProduct('${product._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn small danger" onclick="deleteProduct('${product._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// =============== PRODUCT MODAL FUNCTIONS ===============
function openProductModal(){
    editingId = null;
    document.getElementById("modal-title").textContent = "Add New Product";
    document.getElementById("p-name").value = "";
    document.getElementById("p-price").value = "";
    document.getElementById("p-image").value = "";
    document.getElementById("p-desc").value = "";
    document.getElementById("p-ingredients").value = "";
    document.getElementById("p-avail").checked = true;
    document.getElementById("p-featured").checked = false;
    document.getElementById("p-category").value = "nachos";
    document.getElementById("product-modal").style.display = "flex";
}

function closeProductModal(){
    document.getElementById("product-modal").style.display = "none";
}

async function saveProduct(){
    const name = document.getElementById("p-name").value;
    const price = document.getElementById("p-price").value;
    const image = document.getElementById("p-image").value;
    const description = document.getElementById("p-desc").value;
    const ingredients = document.getElementById("p-ingredients").value;
    const available = document.getElementById("p-avail").checked;
    const featured = document.getElementById("p-featured").checked;
    const category = document.getElementById("p-category").value;

    if (!name || !price || !category) {
        showNotification("Name, price, and category are required!", "error");
        return;
    }

    const productData = {
        name,
        price: parseFloat(price),
        image: image || undefined,
        description: description || undefined,
        ingredients: ingredients || undefined,
        available,
        featured,
        category
    };

    try {
        if (editingId) {
            // Update existing product
            await apiRequest(`/products/${editingId}`, 'PUT', productData);
            showNotification("Product updated successfully!", "success");
        } else {
            // Add new product
            await apiRequest('/products', 'POST', productData);
            showNotification("Product created successfully!", "success");
        }
        
        closeProductModal();
        await loadProducts();
        await loadAvailability();
    } catch (error) {
        console.error("Error saving product:", error);
        showNotification("Error saving product!", "error");
    }
}

async function editProduct(id){
    try {
        const products = await apiRequest('/menu-items');
        const product = products.find(p => p._id === id);
        
        if (!product) {
            showNotification("Product not found!", "error");
            return;
        }

        editingId = id;
        document.getElementById("modal-title").textContent = "Edit Product";
        document.getElementById("p-name").value = product.name || '';
        document.getElementById("p-price").value = product.price || '';
        document.getElementById("p-image").value = product.image || '';
        document.getElementById("p-desc").value = product.description || '';
        document.getElementById("p-ingredients").value = product.ingredients || '';
        document.getElementById("p-avail").checked = product.available !== false;
        document.getElementById("p-featured").checked = product.featured || false;
        document.getElementById("p-category").value = product.category || 'nachos';
        
        document.getElementById("product-modal").style.display = "flex";
    } catch (error) {
        console.error("Error loading product:", error);
        showNotification("Error loading product!", "error");
    }
}

async function deleteProduct(id){
    if(!confirm("Are you sure you want to delete this product?")) return;
    
    try {
        await apiRequest(`/products/${id}`, 'DELETE');
        showNotification("Product deleted successfully!", "success");
        await loadProducts();
        await loadAvailability();
    } catch (error) {
        console.error("Error deleting product:", error);
        showNotification("Error deleting product!", "error");
    }
}

// =============== AVAILABILITY MANAGEMENT ===============
async function loadAvailability(){
    const table = document.getElementById("availability-table");
    
    try {
        const products = await apiRequest('/menu-items');
        
        if (products.length === 0) {
            table.innerHTML = '<tr><td colspan="4" class="empty-state">No products found</td></tr>';
            return;
        }
        
        // Group by category
        const categories = {
            nachos: products.filter(p => p.category === 'nachos'),
            desserts: products.filter(p => p.category === 'desserts'),
            drinks: products.filter(p => p.category === 'drinks'),
            specials: products.filter(p => p.category === 'specials')
        };
        
        let html = '';
        
        // Add each category section if it has items
        for (const [categoryName, categoryProducts] of Object.entries(categories)) {
            if (categoryProducts.length > 0) {
                const icon = getCategoryIcon(categoryName).replace('<i', '<i style="margin-right: 8px;"');
                html += `
                    <tr>
                        <th colspan="4" class="category-header">${icon} ${capitalizeFirst(categoryName)} (${categoryProducts.length} items)</th>
                    </tr>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Available</th>
                        <th>Actions</th>
                    </tr>
                    ${categoryProducts.map(p => createAvailabilityRow(p)).join('')}
                `;
            }
        }
        
        table.innerHTML = html || '<tr><td colspan="4" class="empty-state">No products found</td></tr>';
    } catch (error) {
        console.error("Error loading availability:", error);
        table.innerHTML = '<tr><td colspan="4">Error loading data</td></tr>';
    }
}

function createAvailabilityRow(product) {
    return `
        <tr>
            <td>
                <div class="availability-item-info">
                    <img src="${product.image || 'https://via.placeholder.com/40'}" 
                         alt="${product.name}"
                         class="availability-item-image"
                         onerror="this.src='https://via.placeholder.com/40'">
                    <span>${product.name}</span>
                </div>
            </td>
            <td class="price-cell">₱${product.price}</td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" ${product.available ? 'checked' : ''} 
                           onchange="setAvailability('${product._id}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td>
                <button class="action-btn small" onclick="editProduct('${product._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </td>
        </tr>
    `;
}

async function setAvailability(id, isAvailable){
    try {
        await apiRequest(`/products/${id}/availability`, 'PUT', { available: isAvailable });
        showNotification(`Product ${isAvailable ? 'enabled' : 'disabled'} successfully!`, "success");
    } catch (error) {
        console.error("Error setting availability:", error);
        showNotification("Error updating availability!", "error");
    }
}

async function enableAllItems() {
    if(!confirm("Enable all items?")) return;
    
    try {
        const products = await apiRequest('/menu-items');
        for (const product of products) {
            await apiRequest(`/products/${product._id}/availability`, 'PUT', { available: true });
        }
        showNotification("All items enabled!", "success");
        await loadAvailability();
    } catch (error) {
        console.error("Error enabling all items:", error);
        showNotification("Error enabling items!", "error");
    }
}

async function disableAllItems() {
    if(!confirm("Disable all items?")) return;
    
    try {
        const products = await apiRequest('/menu-items');
        for (const product of products) {
            await apiRequest(`/products/${product._id}/availability`, 'PUT', { available: false });
        }
        showNotification("All items disabled!", "success");
        await loadAvailability();
    } catch (error) {
        console.error("Error disabling all items:", error);
        showNotification("Error disabling items!", "error");
    }
}

async function saveAvailability() {
    // This function is called when clicking "Save Changes" button
    showNotification("Changes saved automatically!", "success");
}

// =============== ORDERS MANAGEMENT ===============
async function loadOrders() {
    const container = document.getElementById('orders-list');
    
    try {
        const orders = await apiRequest('/orders');
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No orders found</p></div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h4>Order #${order._id?.substring(0, 8) || order.id?.substring(0, 8) || 'N/A'}</h4>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="order-details">
                    <p><strong>Customer:</strong> ${order.customerName || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                    <p><strong>Total:</strong> ₱${order.total || 0}</p>
                    <p><strong>Payment:</strong> ${order.paymentMethod || 'N/A'}</p>
                    <p><strong>Pickup:</strong> ${order.pickupTime || 'N/A'}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt || order.timestamp).toLocaleString()}</p>
                </div>
                <div class="order-items">
                    <h5>Items (${order.items?.length || 0}):</h5>
                    <ul>
                        ${(order.items || []).map(item => `
                            <li>${item.name} x${item.quantity} - ₱${(item.price || 0) * (item.quantity || 1)}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="order-actions">
                    <select onchange="updateOrderStatus('${order._id || order.id}', this.value)" class="status-select">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Error loading orders:", error);
        container.innerHTML = '<div class="empty-state"><p>Error loading orders</p></div>';
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await apiRequest(`/orders/${orderId}/status`, 'PUT', { status });
        showNotification(`Order status updated to ${status}`, "success");
        await loadOrders();
    } catch (error) {
        console.error("Error updating order status:", error);
        showNotification("Error updating order status", "error");
    }
}

// =============== SLIDESHOW MANAGER ===============
function loadSlides(){
    // This uses localStorage for slides since it's frontend-only
    const container = document.getElementById("slide-list");
    
    try {
        const slides = JSON.parse(localStorage.getItem("slideshowSlides") || "[]");

        if(slides.length === 0){
            container.innerHTML = '<div class="empty-state"><p>No slides yet. Add your first slide!</p></div>';
            return;
        }

        container.innerHTML = slides.map((slide, index) => `
            <div class="slide-card ${slide.active ? 'active' : ''}">
                <img src="${slide.imageUrl || 'https://via.placeholder.com/180x120'}" 
                     class="slide-image" 
                     alt="${slide.title}"
                     onerror="this.src='https://via.placeholder.com/180x120'">
                <div class="slide-info">
                    <h4>${slide.title || 'Untitled Slide'}</h4>
                    <p>${slide.description || 'No description'}</p>
                    <div class="slide-meta">
                        <span class="slide-order">Order: ${index + 1}</span>
                        <span class="slide-status">${slide.active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div class="slide-actions">
                        <button class="action-btn small primary" onclick="editSlide(${index})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn small danger" onclick="deleteSlide(${index})">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error loading slides:", error);
        container.innerHTML = '<div class="empty-state"><p>Error loading slides</p></div>';
    }
}

// =============== LOGOUT ===============
function logoutAdmin(){
    if(confirm("Are you sure you want to logout?")){
        localStorage.removeItem("adminToken");
        window.location.href = "admin-login.html";
    }
}

// =============== HELPER FUNCTIONS ===============
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Add CSS for notifications
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        }
        
        .notification.success {
            background: #28a745;
        }
        
        .notification.error {
            background: #dc3545;
        }
        
        .notification.info {
            background: #17a2b8;
        }
        
        .notification button {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            margin-left: 10px;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// =============== INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', function() {
    showSection("dashboard");
    
    // Set up navigation buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.admin-nav-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
});

// Make functions available globally
window.showSection = showSection;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.setAvailability = setAvailability;
window.enableAllItems = enableAllItems;
window.disableAllItems = disableAllItems;
window.saveAvailability = saveAvailability;
window.logoutAdmin = logoutAdmin;