// ================================
// ADMIN PANEL SCRIPT - SERVER INTEGRATION VERSION
// ================================

const API_BASE_URL = 'https://aifoodies.up.railway.app/api';
let adminToken = localStorage.getItem('adminToken');
let adminRole = localStorage.getItem('adminRole') || 'admin';
let currentSection = 'dashboard';
let superAdminSettings = JSON.parse(localStorage.getItem('superAdminSettings') || '{"showAdminButton": true}');
let currentEditingSlideId = null;
let currentEditingProductId = null;

// Menu items data
let menuItems = {
    nachos: [],
    desserts: []
};

// Real orders data
let realOrders = [];
let orderUpdateInterval = null;
let currentOrdersFilter = 'all';

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 Admin panel initialized');
    
    // Check if admin is logged in
    if (!adminToken) {
        console.log('No admin token found, showing login modal');
        showLoginModal();
        return;
    }
    
    // Verify token with server
    try {
        const isValid = await verifyAdminToken();
        if (!isValid) {
            showLoginModal();
            return;
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        showLoginModal();
        return;
    }
    
    // Setup UI based on role
    setupAdminRoleUI();
    
    // Load data from server
    await loadInitialData();
    
    // Setup event listeners
    setupAdminEventListeners();
    
    // Show dashboard initially
    showSection('dashboard');
    
    // Setup real-time order listener
    setupOrderListener();
});

async function verifyAdminToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/verify-role`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.valid) {
                adminRole = data.admin.role;
                localStorage.setItem('adminRole', adminRole);
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

function setupAdminRoleUI() {
    const roleBadge = document.getElementById('admin-role-badge');
    if (roleBadge) {
        if (adminRole === 'superadmin') {
            roleBadge.textContent = 'SuperAdmin';
            roleBadge.style.display = 'inline-block';
            
            // Add SuperAdmin section to navigation
            addSuperAdminNav();
            addSuperAdminSection();
        } else {
            roleBadge.style.display = 'none';
        }
    }
}

async function loadInitialData() {
    try {
        // Load menu items from server
        await loadMenuItemsFromServer();
        
        // Load orders from server
        await loadOrdersFromServer();
        
        console.log('✅ Initial data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading initial data:', error);
        // Fallback to localStorage
        loadMenuItemsFromStorage();
    }
}

function loadMenuItemsFromStorage() {
    const storedItems = localStorage.getItem('menuItems');
    if (storedItems) {
        menuItems = JSON.parse(storedItems);
    } else {
        // Default items
        menuItems = {
            nachos: [
                { 
                    id: 'nachos_1',
                    name: "Regular Nachos", 
                    price: 35, 
                    image: "image/classic nachos.jpg", 
                    category: "nachos",
                    description: "Classic nachos with delicious toppings",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'nachos_2',
                    name: "Veggie Nachos", 
                    price: 65, 
                    image: "image/veggie nachos.jpg", 
                    category: "nachos",
                    description: "Fresh vegetable nachos",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'nachos_3',
                    name: "Overload Cheesy Nachos", 
                    price: 95, 
                    image: "image/overload chees nachos.jpg", 
                    category: "nachos",
                    description: "Extra cheesy nachos overload",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'nachos_4',
                    name: "Nacho Combo", 
                    price: 75, 
                    image: "image/combo.png", 
                    category: "nachos",
                    description: "Nachos combo meal",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'nachos_5',
                    name: "Nacho Fries", 
                    price: 85, 
                    image: "image/nacho fries.jpg", 
                    category: "nachos",
                    description: "Nachos with crispy fries",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'nachos_6',
                    name: "Supreme Nachos", 
                    price: 180, 
                    image: "image/Supreme Nachos.png", 
                    category: "nachos",
                    description: "Supreme nachos special",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'nachos_7',
                    name: "Shawarma fries", 
                    price: 120, 
                    image: "image/shawarma fries.jpeg", 
                    category: "nachos",
                    description: "Shawarma style fries",
                    isAvailable: true,
                    createdAt: new Date()
                }
            ],
            desserts: [
                { 
                    id: 'desserts_1',
                    name: "Mango Graham", 
                    price: 40, 
                    image: "image/mango.gif", 
                    category: "desserts",
                    description: "Refreshing mango graham",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'desserts_2',
                    name: "Mango tiramisu on tube", 
                    price: 100, 
                    image: "image/mango tiramisu on tub-price 100.jpeg", 
                    category: "desserts",
                    description: "Mango tiramisu in a tube",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'desserts_3',
                    name: "Biscoff", 
                    price: 159, 
                    image: "image/biscoff.jpeg", 
                    category: "desserts",
                    description: "Delicious biscoff dessert",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'desserts_4',
                    name: "Oreo", 
                    price: 149, 
                    image: "image/oreo and bisscoff.png", 
                    category: "desserts",
                    description: "Creamy oreo dessert",
                    isAvailable: true,
                    createdAt: new Date()
                },
                { 
                    id: 'desserts_5',
                    name: "Mango Graham Float", 
                    price: 40, 
                    image: "image/Mango Graham Floa.jpg", 
                    category: "desserts",
                    description: "Mango graham float special",
                    isAvailable: true,
                    createdAt: new Date()
                }
            ]
        };
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
    }
    return menuItems;
}

// ================================
// SERVER API FUNCTIONS
// ================================

async function loadMenuItemsFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu-items`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const items = await response.json();
            
            // Organize by category
            menuItems.nachos = items.filter(item => item.category === 'nachos');
            menuItems.desserts = items.filter(item => item.category === 'desserts');
            
            console.log(`✅ Loaded ${items.length} menu items from server`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading menu items from server:', error);
        return false;
    }
}

async function loadOrdersFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/orders`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            realOrders = data.orders || [];
            console.log(`✅ Loaded ${realOrders.length} orders from server`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading orders from server:', error);
        return false;
    }
}

async function saveProductToServer(product, isNew = false) {
    try {
        const url = isNew ? 
            `${API_BASE_URL}/admin/menu-items` : 
            `${API_BASE_URL}/admin/menu-items/${product._id || product.id}`;
        
        const method = isNew ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Product ${isNew ? 'created' : 'updated'} on server:`, data);
            return data;
        }
        
        const error = await response.json();
        throw new Error(error.message || 'Server error');
    } catch (error) {
        console.error('Error saving product to server:', error);
        throw error;
    }
}

async function deleteProductFromServer(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/menu-items/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log(`✅ Product deleted from server: ${productId}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting product from server:', error);
        throw error;
    }
}

async function updateAvailabilityOnServer(itemName, isAvailable) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/menu-items/${itemName}/availability`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isAvailable })
        });
        
        if (response.ok) {
            console.log(`✅ Availability updated on server: ${itemName} = ${isAvailable}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating availability on server:', error);
        throw error;
    }
}

async function batchUpdateAvailabilityOnServer(updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/menu-items/availability/batch`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ updates })
        });
        
        if (response.ok) {
            console.log(`✅ Batch updated ${updates.length} items on server`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error batch updating availability on server:', error);
        throw error;
    }
}

// ================================
// EVENT LISTENERS SETUP
// ================================

function setupAdminEventListeners() {
    console.log('🔧 Setting up event listeners');
    
    // Navigation buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });
    
    // Back to store button
    document.getElementById('back-to-store').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRole');
            window.location.href = 'index.html';
        }
    });
    
    // View all orders button
    document.getElementById('view-all-orders').addEventListener('click', function() {
        showSection('orders');
    });
    
    // Refresh orders button
    document.getElementById('refresh-orders').addEventListener('click', async function() {
        await loadOrdersFromServer();
        showAlert('✅ Orders refreshed!', 'success');
    });
    
    // Order filter
    document.getElementById('order-filter').addEventListener('change', function() {
        currentOrdersFilter = this.value;
        filterOrders();
    });
    
    // Order search
    document.getElementById('order-search').addEventListener('input', function() {
        searchOrders();
    });
    
    // Export orders button
    document.getElementById('export-orders').addEventListener('click', function() {
        exportOrders();
    });
    
    // Availability buttons
    document.getElementById('reset-all-availability').addEventListener('click', async function() {
        await resetAllAvailability();
        showAlert('✅ All items marked as available!', 'success');
    });
    
    document.getElementById('toggle-all-availability').addEventListener('click', async function() {
        await toggleAllAvailability();
    });
    
    document.getElementById('save-availability').addEventListener('click', async function() {
        await saveAvailabilityChanges();
    });
    
    // Slideshow buttons
    document.getElementById('add-slide-btn').addEventListener('click', function() {
        showAddSlideModal();
    });
    
    document.getElementById('refresh-slideshow').addEventListener('click', async function() {
        await loadSlideshowFromServer();
        showAlert('✅ Slideshow refreshed!', 'success');
    });
    
    document.getElementById('reorder-slides').addEventListener('click', function() {
        showReorderSlidesModal();
    });
    
    // Products buttons
    document.getElementById('add-product-btn').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('➕ Add Product button clicked');
        showAddProductModal();
    });
    
    document.getElementById('refresh-products').addEventListener('click', async function() {
        await loadMenuItemsFromServer();
        loadProducts();
        showAlert('✅ Products refreshed!', 'success');
    });
    
    // Save product button in modal
    document.getElementById('save-product-btn').addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('💾 Save Product button clicked');
        await saveProduct();
    });
    
    // Cancel button in modal
    document.getElementById('cancel-add-product').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('❌ Cancel button clicked');
        hideAddProductModal();
    });
    
    // Custom alert OK button
    document.getElementById('custom-alert-ok').addEventListener('click', function() {
        document.getElementById('custom-alert').style.display = 'none';
    });
    
    // Image preview for product image URL
    const productImageInput = document.getElementById('product-image');
    if (productImageInput) {
        productImageInput.addEventListener('input', updateProductImagePreview);
    }
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                if (this.id === 'add-product-modal') {
                    currentEditingProductId = null;
                    resetProductForm();
                }
            }
        });
    });
    
    console.log('✅ All event listeners setup complete');
}

// ================================
// SECTION NAVIGATION
// ================================

function showSection(sectionId) {
    console.log(`📋 Switching to section: ${sectionId}`);
    
    // Update current section
    currentSection = sectionId;
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const sectionElement = document.getElementById(`${sectionId}-section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
        sectionElement.style.display = 'block';
    }
    
    // Add active class to clicked nav button
    const navBtn = document.querySelector(`.admin-nav-btn[data-section="${sectionId}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }
    
    // Load section data
    switch(sectionId) {
        case 'dashboard':
            loadAdminDashboard();
            break;
        case 'availability':
            loadAvailabilityControls();
            break;
        case 'slideshow':
            loadSlideshow();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'products':
            loadProducts();
            break;
        case 'superadmin':
            if (adminRole === 'superadmin') {
                loadSuperAdminSection();
            }
            break;
    }
}

// ================================
// PRODUCT MANAGEMENT FUNCTIONS
// ================================

function loadProducts() {
    console.log('📦 Loading products...');
    
    // Combine all menu items
    const allProducts = [...(menuItems.nachos || []), ...(menuItems.desserts || [])];
    
    const productsList = document.getElementById('products-list');
    if (!productsList) return;
    
    if (allProducts.length === 0) {
        productsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No Products Found</h3>
                <p>Add your first product to get started</p>
            </div>
        `;
        return;
    }
    
    // Sort by category and name
    allProducts.sort((a, b) => {
        if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
    });
    
    productsList.innerHTML = allProducts.map(product => `
        <div class="product-item" data-product-id="${product._id || product.id}">
            <div class="product-image">
                <img src="${product.imageUrl || product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOGI0NTEzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSJ3aGl0ZSI+JHtwcm9kdWN0Lm5hbWUuc3Vic3RyaW5nKDAsMSl9PC90ZXh0Pjwvc3ZnPg=='}" 
                     alt="${product.name}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOGI0NTEzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSJ3aGl0ZSI+JHtwcm9kdWN0Lm5hbWUuc3Vic3RyaW5nKDAsMSl9PC90ZXh0Pjwvc3ZnPg=='">
            </div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.description || 'No description'}</p>
                <div class="product-meta">
                    <span class="product-category">${product.category}</span>
                    <span class="product-price">₱${product.price.toFixed(2)}</span>
                    <span class="product-status ${product.isAvailable ? 'available' : 'unavailable'}">
                        ${product.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                </div>
            </div>
            <div class="product-actions-buttons">
                <button class="action-btn primary small" onclick="editProduct('${product._id || product.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn danger small" onclick="deleteProduct('${product._id || product.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Loaded ${allProducts.length} products`);
}

function showAddProductModal() {
    console.log('📋 Showing add product modal');
    
    const modal = document.getElementById('add-product-modal');
    if (!modal) {
        console.error('❌ Add product modal not found!');
        showAlert('Error: Modal not found. Please refresh the page.', 'error');
        return;
    }
    
    // Reset form
    resetProductForm();
    
    // Set title
    const modalTitle = document.getElementById('product-modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = currentEditingProductId ? 
            '<i class="fas fa-edit"></i> Edit Product' : 
            '<i class="fas fa-plus-circle"></i> Add New Product';
    }
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus on first input
    setTimeout(() => {
        const productNameInput = document.getElementById('product-name');
        if (productNameInput) {
            productNameInput.focus();
        }
    }, 100);
    
    console.log('✅ Modal shown successfully');
}

function hideAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.style.display = 'none';
        currentEditingProductId = null;
        resetProductForm();
    }
}

function resetProductForm() {
    // Reset all form fields
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-category').value = '';
    document.getElementById('product-description').value = '';
    document.getElementById('product-image').value = '';
    document.getElementById('product-available').checked = true;
    
    // Clear errors
    clearProductFormErrors();
    
    // Reset image preview
    updateProductImagePreview();
    
    // Hide success message
    const successMsg = document.getElementById('add-product-success');
    if (successMsg) {
        successMsg.classList.remove('show');
        successMsg.textContent = '';
    }
    
    currentEditingProductId = null;
}

function clearProductFormErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
        msg.classList.remove('show');
    });
    
    const inputs = document.querySelectorAll('#add-product-modal input, #add-product-modal select');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

function updateProductImagePreview() {
    const imageUrl = document.getElementById('product-image')?.value || '';
    const preview = document.getElementById('image-preview');
    
    if (!preview) return;
    
    if (imageUrl.trim()) {
        preview.innerHTML = `
            <img src="${imageUrl}" alt="Product Preview" 
                 onerror="this.onerror=null; this.parentNode.innerHTML='<div class="image-preview-placeholder"><i class="fas fa-exclamation-triangle"></i><p>Invalid image URL</p></div>';">`;
    } else {
        preview.innerHTML = `
            <div class="image-preview-placeholder">
                <i class="fas fa-image"></i>
                <p>No image selected</p>
            </div>`;
    }
}

function validateProductForm() {
    let isValid = true;
    
    // Get form values
    const productName = document.getElementById('product-name').value.trim();
    const productPrice = document.getElementById('product-price').value;
    const productCategory = document.getElementById('product-category').value;
    
    // Clear previous errors
    clearProductFormErrors();
    
    // Validate product name
    if (!productName) {
        document.getElementById('name-error').classList.add('show');
        document.getElementById('product-name').classList.add('error');
        isValid = false;
    }
    
    // Validate product price
    if (!productPrice || parseFloat(productPrice) <= 0) {
        document.getElementById('price-error').classList.add('show');
        document.getElementById('product-price').classList.add('error');
        isValid = false;
    }
    
    // Validate product category
    if (!productCategory) {
        document.getElementById('category-error').classList.add('show');
        document.getElementById('product-category').classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

async function saveProduct() {
    console.log('💾 Saving product...');
    
    // Validate form
    if (!validateProductForm()) {
        showAlert('❌ Please fix the errors in the form.', 'error');
        return;
    }
    
    // Get form values
    const productName = document.getElementById('product-name').value.trim();
    const productPrice = parseFloat(document.getElementById('product-price').value);
    const productCategory = document.getElementById('product-category').value;
    const productDescription = document.getElementById('product-description').value.trim();
    const productImage = document.getElementById('product-image').value.trim();
    const productAvailable = document.getElementById('product-available').checked;
    
    // Create product object
    const product = {
        name: productName,
        price: productPrice,
        category: productCategory,
        description: productDescription,
        imageUrl: productImage,
        isAvailable: productAvailable,
        displayOrder: 0
    };
    
    // Add ingredients for compatibility with server
    if (!product.ingredients) {
        product.ingredients = 'Fresh ingredients';
    }
    
    console.log('Product to save:', product);
    
    // Show loading state
    const saveBtn = document.getElementById('save-product-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;
    
    try {
        // Save to server
        const isNew = !currentEditingProductId;
        const result = await saveProductToServer(product, isNew);
        
        // Show success message
        const successMsg = document.getElementById('add-product-success');
        if (successMsg) {
            successMsg.textContent = `✅ Product "${productName}" ${isNew ? 'created' : 'updated'} successfully!`;
            successMsg.classList.add('show');
        }
        
        // Refresh data
        await loadMenuItemsFromServer();
        loadProducts();
        
        // Update availability section if open
        if (currentSection === 'availability') {
            loadAvailabilityControls();
        }
        
        // Reset button
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        
        // Clear form and close modal after delay for new products
        if (isNew) {
            setTimeout(() => {
                hideAddProductModal();
            }, 2000);
        }
        
    } catch (error) {
        showAlert(`❌ Error saving product: ${error.message}`, 'error');
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

function editProduct(productId) {
    console.log('✏️ Editing product:', productId);
    
    // Find the product
    let product = null;
    for (let category in menuItems) {
        const found = menuItems[category].find(p => (p._id || p.id) === productId);
        if (found) {
            product = found;
            break;
        }
    }
    
    if (!product) {
        showAlert('❌ Product not found!', 'error');
        return;
    }
    
    // Set editing state
    currentEditingProductId = productId;
    
    // Fill form with product data
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-image').value = product.imageUrl || product.image || '';
    document.getElementById('product-available').checked = product.isAvailable !== false;
    
    // Update image preview
    updateProductImagePreview();
    
    // Update modal title
    document.getElementById('product-modal-title').innerHTML = '<i class="fas fa-edit"></i> Edit Product';
    
    // Show modal
    document.getElementById('add-product-modal').style.display = 'flex';
    
    // Focus on first input
    setTimeout(() => {
        document.getElementById('product-name').focus();
    }, 100);
}

async function deleteProduct(productId) {
    if (!confirm('⚠️ Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Delete from server
        await deleteProductFromServer(productId);
        
        // Refresh data from server
        await loadMenuItemsFromServer();
        
        // Refresh products list
        loadProducts();
        
        // Refresh availability controls if needed
        if (currentSection === 'availability') {
            loadAvailabilityControls();
        }
        
        showAlert('✅ Product deleted successfully!', 'success');
    } catch (error) {
        showAlert(`❌ Error deleting product: ${error.message}`, 'error');
    }
}

// ================================
// AVAILABILITY FUNCTIONS
// ================================

async function loadAvailabilityControls() {
    console.log('🔧 Loading availability controls...');
    
    // Load nachos availability
    const nachosContainer = document.getElementById('nachos-availability');
    if (nachosContainer && menuItems.nachos) {
        nachosContainer.innerHTML = menuItems.nachos.map(item => `
            <div class="availability-item">
                <span class="item-name">${item.name}</span>
                <span class="item-price">₱${item.price.toFixed(2)}</span>
                <label class="toggle-switch">
                    <input type="checkbox" ${item.isAvailable ? 'checked' : ''} 
                           data-item-name="${item.name}"
                           onchange="toggleItemAvailability('${item.name}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `).join('');
    }
    
    // Load desserts availability
    const dessertsContainer = document.getElementById('desserts-availability');
    if (dessertsContainer && menuItems.desserts) {
        dessertsContainer.innerHTML = menuItems.desserts.map(item => `
            <div class="availability-item">
                <span class="item-name">${item.name}</span>
                <span class="item-price">₱${item.price.toFixed(2)}</span>
                <label class="toggle-switch">
                    <input type="checkbox" ${item.isAvailable ? 'checked' : ''} 
                           data-item-name="${item.name}"
                           onchange="toggleItemAvailability('${item.name}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `).join('');
    }
}

async function toggleItemAvailability(itemName, isAvailable) {
    try {
        await updateAvailabilityOnServer(itemName, isAvailable);
        
        // Update local data
        for (let category in menuItems) {
            const item = menuItems[category].find(p => p.name === itemName);
            if (item) {
                item.isAvailable = isAvailable;
                break;
            }
        }
        
        console.log(`✅ Availability toggled: ${itemName} = ${isAvailable}`);
    } catch (error) {
        showAlert(`❌ Error updating availability: ${error.message}`, 'error');
        
        // Revert checkbox
        const checkbox = document.querySelector(`input[data-item-name="${itemName}"]`);
        if (checkbox) {
            checkbox.checked = !isAvailable;
        }
    }
}

async function resetAllAvailability() {
    try {
        const updates = [];
        
        // Collect all items
        for (let category in menuItems) {
            menuItems[category].forEach(item => {
                updates.push({
                    name: item.name,
                    isAvailable: true
                });
            });
        }
        
        // Update on server
        await batchUpdateAvailabilityOnServer(updates);
        
        // Update local data
        for (let category in menuItems) {
            menuItems[category].forEach(item => {
                item.isAvailable = true;
            });
        }
        
        // Update UI
        loadAvailabilityControls();
        
    } catch (error) {
        showAlert(`❌ Error resetting availability: ${error.message}`, 'error');
    }
}

async function toggleAllAvailability() {
    try {
        // Check current state
        const allItems = [...menuItems.nachos, ...menuItems.desserts];
        const allAvailable = allItems.every(item => item.isAvailable);
        
        const updates = allItems.map(item => ({
            name: item.name,
            isAvailable: !allAvailable
        }));
        
        // Update on server
        await batchUpdateAvailabilityOnServer(updates);
        
        // Update local data
        for (let category in menuItems) {
            menuItems[category].forEach(item => {
                item.isAvailable = !allAvailable;
            });
        }
        
        // Update UI
        loadAvailabilityControls();
        
    } catch (error) {
        showAlert(`❌ Error toggling availability: ${error.message}`, 'error');
    }
}

async function saveAvailabilityChanges() {
    try {
        // Collect changes
        const checkboxes = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
        const updates = [];
        
        checkboxes.forEach(checkbox => {
            const itemName = checkbox.dataset.itemName;
            const isAvailable = checkbox.checked;
            
            // Find item in local data
            for (let category in menuItems) {
                const item = menuItems[category].find(p => p.name === itemName);
                if (item && item.isAvailable !== isAvailable) {
                    updates.push({
                        name: itemName,
                        isAvailable: isAvailable
                    });
                    break;
                }
            }
        });
        
        if (updates.length === 0) {
            showAlert('✅ No changes to save.', 'info');
            return;
        }
        
        // Update on server
        await batchUpdateAvailabilityOnServer(updates);
        
        // Update local data
        updates.forEach(update => {
            for (let category in menuItems) {
                const item = menuItems[category].find(p => p.name === update.name);
                if (item) {
                    item.isAvailable = update.isAvailable;
                    break;
                }
            }
        });
        
        showAlert(`✅ ${updates.length} availability changes saved!`, 'success');
        
    } catch (error) {
        showAlert(`❌ Error saving availability changes: ${error.message}`, 'error');
    }
}

// ================================
// ORDERS FUNCTIONS
// ================================

async function loadOrders() {
    await loadOrdersFromServer();
    filterOrders();
}

function filterOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    let filteredOrders = [...realOrders];
    
    // Apply status filter
    if (currentOrdersFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === currentOrdersFilter);
    }
    
    // Apply date filter
    const dateFilter = document.getElementById('order-date').value;
    if (dateFilter) {
        const filterDate = new Date(dateFilter).toDateString();
        filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.timestamp || order.orderTime || Date.now()).toDateString();
            return orderDate === filterDate;
        });
    }
    
    // Apply search filter
    const searchTerm = document.getElementById('order-search').value.toLowerCase();
    if (searchTerm) {
        filteredOrders = filteredOrders.filter(order => 
            (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
            (order._id && order._id.toLowerCase().includes(searchTerm)) ||
            (order.items && order.items.some(item => item.name.toLowerCase().includes(searchTerm)))
        );
    }
    
    // Sort by date (newest first)
    filteredOrders.sort((a, b) => {
        return new Date(b.timestamp || b.orderTime || 0) - new Date(a.timestamp || a.orderTime || 0);
    });
    
    // Display orders
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No Orders Found</h3>
                <p>${realOrders.length === 0 ? 'No orders have been placed yet' : 'No orders match your filters'}</p>
            </div>
        `;
    } else {
        ordersList.innerHTML = filteredOrders.map(order => `
            <div class="order-item" onclick="showOrderDetails('${order._id || order.id}')">
                <div class="order-header">
                    <div class="order-id">Order #${(order._id || '').substring(6, 12) || 'N/A'}</div>
                    <div class="order-time">${formatDate(order.timestamp || order.orderTime)}</div>
                    <div class="order-status ${order.status || 'pending'}">${order.status || 'pending'}</div>
                </div>
                <div class="order-content">
                    <div class="order-customer">${order.customerName || 'Customer'}</div>
                    <div class="order-amount">₱${(order.total || 0).toFixed(2)}</div>
                    <div class="order-items">${(order.items || []).length} items</div>
                </div>
            </div>
        `).join('');
    }
    
    updateOrdersSummary(realOrders);
}

function searchOrders() {
    filterOrders();
}

function exportOrders() {
    const ordersToExport = [...realOrders];
    
    // Convert to CSV
    const headers = ['Order ID', 'Customer', 'Date', 'Status', 'Total', 'Items Count', 'Payment Method'];
    const csvData = ordersToExport.map(order => [
        (order._id || '').substring(6, 12) || 'N/A',
        order.customerName || 'Customer',
        formatDate(order.timestamp || order.orderTime),
        order.status || 'pending',
        `₱${(order.total || 0).toFixed(2)}`,
        (order.items || []).length,
        order.paymentMethod || 'Cash'
    ]);
    
    // Create CSV string
    let csv = headers.join(',') + '\n';
    csvData.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('✅ Orders exported successfully!', 'success');
}

// ================================
// OTHER SECTION FUNCTIONS
// ================================

function loadAdminDashboard() {
    console.log('📊 Loading dashboard...');
    
    // Update dashboard stats
    updateDashboardStats();
    
    // Load recent orders
    loadRecentOrders();
    
    // Load sales chart
    updateSalesChart();
}

function updateDashboardStats() {
    // Calculate totals
    const totalOrders = realOrders.length;
    const totalSales = realOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Today's orders
    const today = new Date().toDateString();
    const todayOrders = realOrders.filter(order => {
        const orderDate = new Date(order.timestamp || order.orderTime || Date.now()).toDateString();
        return orderDate === today;
    });
    
    const todayOrdersCount = todayOrders.length;
    const todaySales = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Update dashboard
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-sales').textContent = `₱${totalSales.toFixed(2)}`;
    document.getElementById('today-orders').textContent = todayOrdersCount;
    document.getElementById('today-sales').textContent = `₱${todaySales.toFixed(2)}`;
}

function loadRecentOrders() {
    const recentContainer = document.getElementById('recent-orders-list');
    if (!recentContainer) return;
    
    // Get recent orders (last 5)
    const recentOrders = [...realOrders]
        .sort((a, b) => new Date(b.timestamp || b.orderTime || 0) - new Date(a.timestamp || a.orderTime || 0))
        .slice(0, 5);
    
    if (recentOrders.length === 0) {
        recentContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>No Recent Orders</h3>
                <p>Orders will appear here when customers place them</p>
            </div>
        `;
        return;
    }
    
    recentContainer.innerHTML = recentOrders.map(order => `
        <div class="order-preview-item" onclick="showOrderDetails('${order._id || order.id}')">
            <div class="order-preview-header">
                <div class="customer-name">${order.customerName || 'Customer'}</div>
                <div class="order-status ${order.status || 'pending'}">${order.status || 'pending'}</div>
            </div>
            <div class="order-preview-details">
                <div class="order-items">${(order.items || []).length} items</div>
                <div class="order-total">₱${(order.total || 0).toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

function updateSalesChart() {
    const ctx = document.getElementById('sales-chart');
    if (!ctx) return;
    
    // Group orders by date
    const salesByDate = {};
    realOrders.forEach(order => {
        const date = new Date(order.timestamp || order.orderTime || Date.now()).toLocaleDateString();
        if (!salesByDate[date]) {
            salesByDate[date] = 0;
        }
        salesByDate[date] += order.total || 0;
    });
    
    const dates = Object.keys(salesByDate).sort();
    const sales = dates.map(date => salesByDate[date]);
    
    // Create chart
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Daily Sales (₱)',
                data: sales,
                backgroundColor: 'rgba(139, 69, 19, 0.1)',
                borderColor: '#8b4513',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value;
                        }
                    }
                }
            }
        }
    });
}

function updateOrdersSummary(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    
    document.getElementById('summary-total').textContent = total;
    document.getElementById('summary-pending').textContent = pending;
    document.getElementById('summary-processing').textContent = processing;
    document.getElementById('summary-completed').textContent = completed;
    document.getElementById('summary-cancelled').textContent = cancelled;
}

function showOrderDetails(orderId) {
    const order = realOrders.find(o => o._id === orderId || o.id === orderId);
    if (!order) {
        showAlert('❌ Order not found!', 'error');
        return;
    }
    
    const modal = document.getElementById('order-details-modal');
    const content = document.getElementById('order-details-content');
    
    if (modal && content) {
        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <p><strong>Order ID:</strong> ${(order._id || '').substring(6, 12) || 'N/A'}</p>
                <p><strong>Customer:</strong> ${order.customerName || 'Unknown'}</p>
                <p><strong>Date:</strong> ${formatDate(order.timestamp || order.orderTime)}</p>
                <p><strong>Status:</strong> <span class="order-status ${order.status || 'pending'}">${order.status || 'pending'}</span></p>
                <p><strong>Total:</strong> ₱${(order.total || 0).toFixed(2)}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Cash'}</p>
                <p><strong>Pickup Time:</strong> ${order.pickupTime || 'ASAP'}</p>
            </div>
            
            <div style="margin-top: 20px;">
                <h4 style="color: #8b4513; margin-bottom: 10px;">Order Items:</h4>
                ${(order.items || []).map(item => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <span>${item.name} x${item.quantity || 1}</span>
                        <span>₱${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        modal.style.display = 'flex';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ================================
// SLIDESHOW FUNCTIONS
// ================================

async function loadSlideshowFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/slideshow`);
        if (response.ok) {
            const slides = await response.json();
            displaySlides(slides);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading slideshow:', error);
        return false;
    }
}

function displaySlides(slides) {
    const slideshowCurrent = document.getElementById('slideshow-current');
    if (!slideshowCurrent) return;
    
    const activeSlides = slides.filter(slide => slide.active);
    
    if (activeSlides.length === 0) {
        slideshowCurrent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>No Slides Configured</h3>
                <p>Add slides to display on the homepage</p>
            </div>
        `;
        return;
    }
    
    slideshowCurrent.innerHTML = activeSlides.map(slide => `
        <div class="slide-card ${slide.active ? 'active' : ''}">
            <img src="${slide.imageUrl}" alt="${slide.title}" class="slide-image">
            <div class="slide-info">
                <h4>${slide.title}</h4>
                <p>${slide.description}</p>
                <div class="slide-order">Order: ${slide.order}</div>
            </div>
        </div>
    `).join('');
}

function loadSlideshow() {
    console.log('🖼️ Loading slideshow...');
    loadSlideshowFromServer();
}

// ================================
// SUPERADMIN FUNCTIONS
// ================================

function addSuperAdminNav() {
    const adminNav = document.querySelector('.admin-nav');
    if (!adminNav) return;
    
    // Check if already exists
    if (document.querySelector('.admin-nav-btn[data-section="superadmin"]')) {
        return;
    }
    
    const superAdminBtn = document.createElement('button');
    superAdminBtn.className = 'admin-nav-btn';
    superAdminBtn.setAttribute('data-section', 'superadmin');
    superAdminBtn.innerHTML = '<i class="fas fa-user-crown"></i> SuperAdmin';
    
    adminNav.appendChild(superAdminBtn);
    
    // Add click event listener
    superAdminBtn.addEventListener('click', function() {
        const sectionId = this.getAttribute('data-section');
        showSection(sectionId);
    });
}

function addSuperAdminSection() {
    const adminSections = document.querySelector('.admin-sections');
    if (!adminSections) return;
    
    // Check if already exists
    if (document.getElementById('superadmin-section')) {
        return;
    }
    
    const superAdminSection = document.createElement('div');
    superAdminSection.id = 'superadmin-section';
    superAdminSection.className = 'admin-section';
    superAdminSection.innerHTML = `
        <div class="admin-section-header">
            <h2><i class="fas fa-user-crown"></i> SuperAdmin Controls</h2>
            <p>Advanced system settings and configurations</p>
        </div>
        
        <div class="superadmin-controls">
            <div class="control-card">
                <div class="control-icon">
                    <i class="fas fa-eye-slash"></i>
                </div>
                <div class="control-content">
                    <h3>Admin Button Visibility</h3>
                    <p>Control whether the Admin Panel button appears on the homepage</p>
                    <button id="configure-admin-button" class="action-btn secondary">
                        <i class="fas fa-cog"></i> Configure
                    </button>
                </div>
            </div>
            
            <div class="control-card">
                <div class="control-icon">
                    <i class="fas fa-database"></i>
                </div>
                <div class="control-content">
                    <h3>Data Management</h3>
                    <p>Backup or reset application data</p>
                    <div class="button-group">
                        <button id="backup-data" class="action-btn secondary">
                            <i class="fas fa-download"></i> Backup
                        </button>
                        <button id="reset-demo-data" class="action-btn danger">
                            <i class="fas fa-redo"></i> Reset Demo
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="control-card">
                <div class="control-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="control-content">
                    <h3>User Management</h3>
                    <p>Manage admin users and permissions</p>
                    <button id="manage-users" class="action-btn secondary">
                        <i class="fas fa-user-edit"></i> Manage Users
                    </button>
                </div>
            </div>
        </div>
        
        <div class="superadmin-info">
            <h3><i class="fas fa-info-circle"></i> Current Settings</h3>
            <div class="settings-display">
                <div class="setting-display-item">
                    <span class="setting-label">Admin Button:</span>
                    <span id="admin-button-status" class="setting-value enabled">Enabled</span>
                </div>
                <div class="setting-display-item">
                    <span class="setting-label">Live Orders:</span>
                    <span id="live-orders-status" class="setting-value enabled">Enabled</span>
                </div>
                <div class="setting-display-item">
                    <span class="setting-label">Chart Animation:</span>
                    <span id="chart-animation-status" class="setting-value enabled">Enabled</span>
                </div>
            </div>
        </div>
    `;
    
    adminSections.appendChild(superAdminSection);
    
    // Add SuperAdmin Settings Modal
    const superAdminModal = document.createElement('div');
    superAdminModal.id = 'superadmin-settings-modal';
    superAdminModal.className = 'modal-overlay';
    superAdminModal.style.display = 'none';
    superAdminModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h2><i class="fas fa-user-crown"></i> SuperAdmin Settings</h2>
            
            <div class="superadmin-settings">
                <div class="setting-item">
                    <label class="setting-toggle">
                        <input type="checkbox" id="toggle-admin-button" checked>
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <h4>Show Admin Button</h4>
                        <p>Display the Admin Panel button on the homepage</p>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-toggle">
                        <input type="checkbox" id="toggle-live-orders" checked>
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <h4>Live Order Updates</h4>
                        <p>Enable real-time order notifications</p>
                    </div>
                </div>
                
                <div class="setting-item">
                    <label class="setting-toggle">
                        <input type="checkbox" id="toggle-sales-chart" checked>
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="setting-info">
                        <h4>Sales Chart Animation</h4>
                        <p>Animate sales chart updates</p>
                    </div>
                </div>
            </div>
            
            <div class="modal-actions">
                <button id="save-superadmin-settings" class="action-btn primary">
                    <i class="fas fa-save"></i> Save Settings
                </button>
                <button id="close-superadmin-settings" class="action-btn secondary">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(superAdminModal);
    
    // Add event listeners for SuperAdmin
    setTimeout(() => {
        setupSuperAdminEventListeners();
    }, 100);
}

function loadSuperAdminSection() {
    loadSuperAdminSettings();
}

function setupSuperAdminEventListeners() {
    // Configure Admin Button button
    const configureBtn = document.getElementById('configure-admin-button');
    if (configureBtn) {
        configureBtn.addEventListener('click', function() {
            showSuperAdminSettingsModal();
        });
    }
    
    // Save settings button
    const saveSettingsBtn = document.getElementById('save-superadmin-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSuperAdminSettings);
    }
    
    // Close settings modal button
    const closeSettingsBtn = document.getElementById('close-superadmin-settings');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', function() {
            hideModal('superadmin-settings-modal');
        });
    }
    
    // Data backup button
    const backupBtn = document.getElementById('backup-data');
    if (backupBtn) {
        backupBtn.addEventListener('click', backupData);
    }
    
    // Reset demo data button
    const resetBtn = document.getElementById('reset-demo-data');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetDemoData);
    }
    
    // User management button
    const usersBtn = document.getElementById('manage-users');
    if (usersBtn) {
        usersBtn.addEventListener('click', manageUsers);
    }
}

function loadSuperAdminSettings() {
    // Get current settings from localStorage
    const settings = JSON.parse(localStorage.getItem('superAdminSettings') || '{}');
    
    // Set default values if not present
    const defaultSettings = {
        showAdminButton: true,
        liveOrders: true,
        chartAnimation: true,
        lastUpdated: new Date().toISOString()
    };
    
    const currentSettings = { ...defaultSettings, ...settings };
    
    // Update UI display
    updateSettingsDisplay(currentSettings);
    
    // Update modal checkboxes
    updateSettingsModal(currentSettings);
    
    console.log('Loaded SuperAdmin settings:', currentSettings);
}

function updateSettingsDisplay(settings) {
    const adminButtonStatus = document.getElementById('admin-button-status');
    const liveOrdersStatus = document.getElementById('live-orders-status');
    const chartAnimationStatus = document.getElementById('chart-animation-status');
    
    if (adminButtonStatus) {
        adminButtonStatus.textContent = settings.showAdminButton ? 'Enabled' : 'Disabled';
        adminButtonStatus.className = `setting-value ${settings.showAdminButton ? 'enabled' : 'disabled'}`;
    }
    
    if (liveOrdersStatus) {
        liveOrdersStatus.textContent = settings.liveOrders ? 'Enabled' : 'Disabled';
        liveOrdersStatus.className = `setting-value ${settings.liveOrders ? 'enabled' : 'disabled'}`;
    }
    
    if (chartAnimationStatus) {
        chartAnimationStatus.textContent = settings.chartAnimation ? 'Enabled' : 'Disabled';
        chartAnimationStatus.className = `setting-value ${settings.chartAnimation ? 'enabled' : 'disabled'}`;
    }
}

function updateSettingsModal(settings) {
    const toggleAdminButton = document.getElementById('toggle-admin-button');
    const toggleLiveOrders = document.getElementById('toggle-live-orders');
    const toggleChartAnimation = document.getElementById('toggle-sales-chart');
    
    if (toggleAdminButton) toggleAdminButton.checked = settings.showAdminButton;
    if (toggleLiveOrders) toggleLiveOrders.checked = settings.liveOrders;
    if (toggleChartAnimation) toggleChartAnimation.checked = settings.chartAnimation;
}

function showSuperAdminSettingsModal() {
    const modal = document.getElementById('superadmin-settings-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function saveSuperAdminSettings() {
    // Get values from checkboxes
    const showAdminButton = document.getElementById('toggle-admin-button').checked;
    const liveOrders = document.getElementById('toggle-live-orders').checked;
    const chartAnimation = document.getElementById('toggle-sales-chart').checked;
    
    // Create settings object
    const settings = {
        showAdminButton: showAdminButton,
        liveOrders: liveOrders,
        chartAnimation: chartAnimation,
        lastUpdated: new Date().toISOString(),
        updatedBy: adminRole
    };
    
    // Save to localStorage
    localStorage.setItem('superAdminSettings', JSON.stringify(settings));
    
    // Update display
    updateSettingsDisplay(settings);
    
    // Show success message
    showAlert('Settings saved successfully!', 'success');
    
    // Close modal
    hideModal('superadmin-settings-modal');
    
    console.log('Saved SuperAdmin settings:', settings);
}

function backupData() {
    // Gather all data from localStorage and server
    const backupData = {
        superAdminSettings: JSON.parse(localStorage.getItem('superAdminSettings') || '{}'),
        adminRole: adminRole,
        backupDate: new Date().toISOString(),
        backupVersion: '1.0'
    };
    
    // Create download link
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ai-nachos-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('Data backup completed successfully!', 'success');
}

function resetDemoData() {
    if (confirm('Are you sure you want to reset all demo data? This will clear all local data but keep server data.')) {
        // Clear localStorage
        localStorage.removeItem('cart');
        localStorage.removeItem('customerData');
        localStorage.removeItem('orders');
        
        // Keep admin login and settings
        const adminToken = localStorage.getItem('adminToken');
        const adminRole = localStorage.getItem('adminRole');
        const superAdminSettings = localStorage.getItem('superAdminSettings');
        
        localStorage.clear();
        
        // Restore admin data
        if (adminToken) localStorage.setItem('adminToken', adminToken);
        if (adminRole) localStorage.setItem('adminRole', adminRole);
        if (superAdminSettings) localStorage.setItem('superAdminSettings', superAdminSettings);
        
        showAlert('Demo data reset successfully! The page will refresh.', 'success');
        
        // Refresh after 2 seconds
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

function manageUsers() {
    showAlert('User management feature coming soon!', 'info');
}

// ================================
// REAL-TIME UPDATES
// ================================

function setupOrderListener() {
    // Poll for new orders every 30 seconds
    if (orderUpdateInterval) clearInterval(orderUpdateInterval);
    orderUpdateInterval = setInterval(async () => {
        if (currentSection === 'dashboard' || currentSection === 'orders') {
            await loadOrdersFromServer();
            if (currentSection === 'dashboard') {
                loadRecentOrders();
                updateDashboardStats();
            }
        }
    }, 30000);
}

// ================================
// UTILITY FUNCTIONS
// ================================

function showAlert(message, type = 'info') {
    const alertModal = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('custom-alert-message');
    const alertOk = document.getElementById('custom-alert-ok');
    
    if (alertModal && alertMessage && alertOk) {
        alertMessage.innerHTML = message;
        alertMessage.style.color = type === 'error' ? '#dc3545' : 
                                   type === 'success' ? '#28a745' : '#2c3e50';
        
        alertModal.style.display = 'flex';
        
        alertOk.onclick = function() {
            alertModal.style.display = 'none';
        };
        
        alertModal.addEventListener('click', function(e) {
            if (e.target === this) {
                alertModal.style.display = 'none';
            }
        });
        
        // Auto-hide non-error alerts after 5 seconds
        if (type !== 'error') {
            setTimeout(() => {
                if (alertModal.style.display === 'flex') {
                    alertModal.style.display = 'none';
                }
            }, 5000);
        }
    } else {
        alert(message);
    }
}

// ================================
// LOGIN MODAL
// ================================

function showLoginModal() {
    const modalHTML = `
        <div id="admin-login-modal" class="modal-overlay" style="display: flex; z-index: 9999;">
            <div class="modal-content" style="max-width: 400px;">
                <h2 class="admin-panel-title">
                    <i class="fas fa-user-shield"></i> Admin Login Required
                </h2>
                <p style="text-align: center; margin-bottom: 20px; color: #666;">Please login to access the admin panel</p>
                
                <input type="text" id="admin-username-modal" placeholder="Username" value="admin" style="margin-bottom: 15px;">
                <input type="password" id="admin-password-modal" placeholder="Password" value="admin123" style="margin-bottom: 20px;">
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button id="modal-login-btn" class="action-btn primary">
                        <i class="fas fa-sign-in-alt"></i> Login as Admin
                    </button>
                    <button id="modal-superadmin-btn" class="action-btn" style="background: #FF6A00;">
                        <i class="fas fa-crown"></i> Login as SuperAdmin
                    </button>
                    <button id="back-to-home-btn" class="action-btn secondary">
                        <i class="fas fa-home"></i> Back to Homepage
                    </button>
                </div>
                
                <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #666;">
                    <p style="margin-bottom: 5px;"><strong>Demo Credentials:</strong></p>
                    <p style="margin: 3px 0;"><i class="fas fa-user"></i> Admin: admin / admin123</p>
                    <p style="margin: 3px 0;"><i class="fas fa-crown"></i> SuperAdmin: superadmin / superadmin123</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    document.getElementById('modal-login-btn').addEventListener('click', function() {
        handleAdminModalLogin('admin');
    });
    
    document.getElementById('modal-superadmin-btn').addEventListener('click', function() {
        handleAdminModalLogin('superadmin');
    });
    
    document.getElementById('back-to-home-btn').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Close modal when clicking outside
    const modal = document.getElementById('admin-login-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            modal.remove();
        }
    });
}

async function handleAdminModalLogin(role) {
    let username, password;
    
    if (role === 'admin') {
        username = 'admin';
        password = 'admin123';
    } else {
        username = 'superadmin';
        password = 'superadmin123';
    }
    
    const inputUsername = document.getElementById('admin-username-modal').value;
    const inputPassword = document.getElementById('admin-password-modal').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: inputUsername,
                password: inputPassword
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Store token and role
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminRole', data.user.role);
            
            adminToken = data.token;
            adminRole = data.user.role;
            
            // Remove modal
            const modal = document.getElementById('admin-login-modal');
            if (modal) modal.remove();
            
            showAlert(`✅ Welcome, ${data.user.role === 'superadmin' ? 'SuperAdmin' : 'Admin'}!`, 'success');
            
            // Reload page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } else {
            const error = await response.json();
            showAlert(`❌ Login failed: ${error.message}`, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('❌ Login failed. Please try again.', 'error');
    }
}

// ================================
// GLOBAL EXPORTS
// ================================

// Make functions available globally for inline event handlers
window.showOrderDetails = showOrderDetails;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.toggleItemAvailability = toggleItemAvailability;
window.showSuperAdminSettingsModal = showSuperAdminSettingsModal;
window.saveSuperAdminSettings = saveSuperAdminSettings;
window.hideModal = hideModal;
window.backupData = backupData;
window.resetDemoData = resetDemoData;
window.manageUsers = manageUsers;