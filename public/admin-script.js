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
        console.log(`API Request: ${method} ${API_BASE_URL}${endpoint}`);
        
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
        
        // Check if response is HTML (this happens when endpoint doesn't exist)
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");
        
        if (!isJson) {
            // Try to parse as text first
            const text = await response.text();
            
            // If it looks like HTML, endpoint might not exist
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error(`Endpoint ${endpoint} returned HTML instead of JSON`);
                console.error(`Response preview: ${text.substring(0, 200)}...`);
                
                // Try alternative endpoints or show user-friendly error
                const errorMessage = `API endpoint not found: ${endpoint}. Please check if the backend server is running.`;
                showNotification(errorMessage, 'error');
                throw new Error(errorMessage);
            }
            
            // If it's not HTML but also not JSON, try to parse anyway
            try {
                return JSON.parse(text);
            } catch {
                throw new Error(`Invalid response format from ${endpoint}`);
            }
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.msg || result.error || 'API request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        
        // Don't show notification if it's already shown above
        if (!error.message.includes('API endpoint not found')) {
            showNotification(error.message || 'API request failed', 'error');
        }
        
        // Return empty data for dashboard to prevent UI breaking
        if (endpoint.includes('/menu-items')) return [];
        if (endpoint.includes('/orders')) return [];
        throw error;
    }
}

// =============== DASHBOARD ===============
async function loadDashboard(){
    try {
        // Load products and orders with fallbacks
        let products = [];
        let orders = [];
        
        try {
            products = await apiRequest('/menu-items');
        } catch (error) {
            console.log("Using fallback products data");
            products = [];
        }
        
        try {
            orders = await apiRequest('/orders');
        } catch (error) {
            console.log("Using fallback orders data");
            orders = [];
        }
        
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
        // First check if we have cached products from sync-products.js
        if (typeof window.syncedProducts !== 'undefined' && window.syncedProducts.length > 0) {
            console.log("Using synced products from cache");
            allProducts = window.syncedProducts;
        } else {
            // Fall back to API
            console.log("Fetching products from API");
            allProducts = await apiRequest('/menu-items');
        }
        
        if (allProducts.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No products found. Click "Add Product" to create your first item.</p></div>';
            return;
        }
        
        // Group by category
        const categories = {
            nachos: allProducts.filter(p => p.category === 'nachos'),
            desserts: allProducts.filter(p => p.category === 'desserts'),
            drinks: allProducts.filter(p => p.category === 'drinks'),
            specials: allProducts.filter(p => p.category === 'specials')
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
        list.innerHTML = `
            <div class="empty-state">
                <p>Error loading products from API</p>
                <p>Please check if your backend server is running at:</p>
                <code>${API_BASE_URL}</code>
                <br><br>
                <p>Current products from sync:</p>
                <div id="fallback-products"></div>
            </div>
        `;
        
        // Try to show synced products as fallback
        if (typeof window.syncedProducts !== 'undefined') {
            const fallbackContainer = document.getElementById('fallback-products');
            if (fallbackContainer) {
                fallbackContainer.innerHTML = `
                    <p>Nachos: ${window.syncedProducts.filter(p => p.category === 'nachos').length} items</p>
                    <p>Desserts: ${window.syncedProducts.filter(p => p.category === 'desserts').length} items</p>
                `;
            }
        }
    }
}

// Rest of the code remains the same...

// =============== INITIALIZATION ===============
document.addEventListener('DOMContentLoaded', function() {
    // Check if API is available first
    checkApiAvailability().then(isAvailable => {
        if (!isAvailable) {
            showNotification('Backend API is not available. Some features may not work.', 'error');
        }
        showSection("dashboard");
    });
    
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

// New function to check API availability
async function checkApiAvailability() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return response.ok;
    } catch (error) {
        console.log("API health check failed:", error);
        return false;
    }
}

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
