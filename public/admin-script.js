// ================================
// ADMIN PANEL SCRIPT - COMPLETE FIXED VERSION
// ================================

const ADMIN_API_URL = 'https://aifoodies.up.railway.app/api';
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
let realOrders = JSON.parse(localStorage.getItem('realOrders') || '[]');
let orderUpdateInterval = null;
let currentOrdersFilter = 'all';

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Admin panel initialized');
    
    // Check if admin is logged in
    if (!adminToken) {
        console.log('No admin token found, showing login modal');
        showLoginModal();
        return;
    }
    
    // Load menu items
    loadMenuItemsFromStorage();
    
    // Setup event listeners
    setupAdminEventListeners();
    
    // Show dashboard initially
    showSection('dashboard');
    
    // Setup real-time order listener
    setupOrderListener();
    
    // Test functions
    console.log('✅ Admin panel loaded successfully');
    console.log('👤 Admin role:', adminRole);
    console.log('📊 Menu items loaded:', menuItems.nachos.length + menuItems.desserts.length);
});

// ================================
// DATA MANAGEMENT
// ================================

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

function saveMenuItemsToStorage() {
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
}

// ================================
// EVENT LISTENERS SETUP - FIXED
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
    document.getElementById('refresh-orders').addEventListener('click', function() {
        loadRealOrders();
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
        showAlert('📊 Export feature would download orders as CSV file.', 'info');
    });
    
    // Availability buttons
    document.getElementById('reset-all-availability').addEventListener('click', function() {
        resetAllAvailability();
        showAlert('✅ All items marked as available!', 'success');
    });
    
    document.getElementById('toggle-all-availability').addEventListener('click', function() {
        toggleAllAvailability();
    });
    
    document.getElementById('save-availability').addEventListener('click', function() {
        saveAvailabilityChanges();
        showAlert('✅ Availability changes saved!', 'success');
    });
    
    // Slideshow buttons
    document.getElementById('add-slide-btn').addEventListener('click', function() {
        showAlert('🖼️ Add slide feature would open here', 'info');
    });
    
    document.getElementById('refresh-slideshow').addEventListener('click', function() {
        loadSlideshow();
        showAlert('✅ Slideshow refreshed!', 'success');
    });
    
    document.getElementById('reorder-slides').addEventListener('click', function() {
        showAlert('🔀 Reorder slides feature would open here', 'info');
    });
    
    // Products buttons - FIXED
    document.getElementById('add-product-btn').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('➕ Add Product button clicked');
        showAddProductModal();
    });
    
    document.getElementById('refresh-products').addEventListener('click', function() {
        loadProducts();
        showAlert('✅ Products refreshed!', 'success');
    });
    
    // Save product button in modal
    document.getElementById('save-product-btn').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('💾 Save Product button clicked');
        saveProduct();
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
// SECTION NAVIGATION - FIXED
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
            loadRealOrders();
            break;
        case 'products':
            loadProducts();
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
        <div class="product-item" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOGI0NTEzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSJ3aGl0ZSI+JHtwcm9kdWN0Lm5hbWUuc3Vic3RyaW5nKDAsMSl9PC90ZXh0Pjwvc3ZnPg=='}" 
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
                <button class="action-btn primary small" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn danger small" onclick="deleteProduct('${product.id}')">
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
                 onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\"image-preview-placeholder\"><i class=\"fas fa-exclamation-triangle\"></i><p>Invalid image URL</p></div>';">`;
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

function saveProduct() {
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
        id: currentEditingProductId || 'product_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: productName,
        price: productPrice,
        category: productCategory,
        description: productDescription,
        image: productImage,
        isAvailable: productAvailable,
        createdAt: currentEditingProductId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    console.log('Product to save:', product);
    
    // Show loading state
    const saveBtn = document.getElementById('save-product-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.classList.add('loading');
    
    // Simulate save delay
    setTimeout(() => {
        let saved = false;
        
        if (currentEditingProductId) {
            // Update existing product
            for (let category in menuItems) {
                const index = menuItems[category].findIndex(p => p.id === currentEditingProductId);
                if (index !== -1) {
                    if (category !== productCategory) {
                        // Remove from old category
                        menuItems[category].splice(index, 1);
                        // Add to new category
                        if (!menuItems[productCategory]) menuItems[productCategory] = [];
                        menuItems[productCategory].push(product);
                    } else {
                        // Update in same category
                        menuItems[category][index] = product;
                    }
                    saved = true;
                    break;
                }
            }
        } else {
            // Add new product
            if (!menuItems[productCategory]) {
                menuItems[productCategory] = [];
            }
            menuItems[productCategory].push(product);
            saved = true;
        }
        
        if (saved) {
            // Save to localStorage
            saveMenuItemsToStorage();
            
            // Show success message
            const successMsg = document.getElementById('add-product-success');
            if (successMsg) {
                successMsg.textContent = `✅ Product "${productName}" ${currentEditingProductId ? 'updated' : 'added'} successfully!`;
                successMsg.classList.add('show');
            }
            
            // Reset button
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('loading');
            
            // Clear form after delay and reload products
            setTimeout(() => {
                if (!currentEditingProductId) {
                    resetProductForm();
                }
                
                // Reload products list
                loadProducts();
                
                // Close modal after 2 seconds for new products
                if (!currentEditingProductId) {
                    setTimeout(() => {
                        hideAddProductModal();
                    }, 2000);
                }
            }, 1500);
            
        } else {
            showAlert('❌ Error saving product. Please try again.', 'error');
            saveBtn.innerHTML = originalText;
            saveBtn.classList.remove('loading');
        }
    }, 1000);
}

function editProduct(productId) {
    console.log('✏️ Editing product:', productId);
    
    // Find the product
    let product = null;
    for (let category in menuItems) {
        const found = menuItems[category].find(p => p.id === productId);
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
    document.getElementById('product-image').value = product.image || '';
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

function deleteProduct(productId) {
    if (!confirm('⚠️ Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    
    let deleted = false;
    for (let category in menuItems) {
        const index = menuItems[category].findIndex(p => p.id === productId);
        if (index !== -1) {
            menuItems[category].splice(index, 1);
            deleted = true;
            break;
        }
    }
    
    if (deleted) {
        // Save to localStorage
        saveMenuItemsToStorage();
        
        // Refresh products list
        loadProducts();
        
        // Refresh availability controls if needed
        if (currentSection === 'availability') {
            loadAvailabilityControls();
        }
        
        showAlert('✅ Product deleted successfully!', 'success');
    } else {
        showAlert('❌ Product not found!', 'error');
    }
}

// ================================
// OTHER SECTION FUNCTIONS
// ================================

function loadAdminDashboard() {
    console.log('📊 Loading dashboard...');
    
    // Load real orders first
    loadRealOrders();
    
    // Update dashboard stats
    updateDashboardWithRealOrders();
    
    // Load recent orders
    loadRecentRealOrders();
    
    // Load sales chart
    updateSalesChartWithRealData();
}

function loadAvailabilityControls() {
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
                           onchange="toggleItemAvailability('${item.id}', this.checked)">
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
                           onchange="toggleItemAvailability('${item.id}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `).join('');
    }
}

function toggleItemAvailability(itemId, isAvailable) {
    for (let category in menuItems) {
        const item = menuItems[category].find(p => p.id === itemId);
        if (item) {
            item.isAvailable = isAvailable;
            saveMenuItemsToStorage();
            break;
        }
    }
}

function resetAllAvailability() {
    for (let category in menuItems) {
        menuItems[category].forEach(item => {
            item.isAvailable = true;
        });
    }
    saveMenuItemsToStorage();
    loadAvailabilityControls();
}

function toggleAllAvailability() {
    const allItems = [...menuItems.nachos, ...menuItems.desserts];
    const allAvailable = allItems.every(item => item.isAvailable);
    
    for (let category in menuItems) {
        menuItems[category].forEach(item => {
            item.isAvailable = !allAvailable;
        });
    }
    saveMenuItemsToStorage();
    loadAvailabilityControls();
}

function saveAvailabilityChanges() {
    saveMenuItemsToStorage();
}

function loadSlideshow() {
    console.log('🖼️ Loading slideshow...');
    // Placeholder for slideshow functionality
    const slideshowContainer = document.getElementById('slideshow-current');
    if (slideshowContainer) {
        slideshowContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <h3>No Slides Configured</h3>
                <p>Add slides to display on the homepage</p>
            </div>
        `;
    }
}

// ================================
// ORDERS MANAGEMENT
// ================================

async function loadRealOrders() {
    try {
        console.log('📦 Loading real orders...');
        
        // Get orders from localStorage
        const storedOrders = localStorage.getItem('customerOrders');
        if (storedOrders) {
            realOrders = JSON.parse(storedOrders);
        } else {
            realOrders = [];
        }
        
        // Update orders summary
        updateOrdersSummary(realOrders);
        
        // Render orders list with filter
        filterOrders();
        
        // Update dashboard stats
        updateDashboardWithRealOrders();
        
        return realOrders;
    } catch (error) {
        console.error('❌ Error loading real orders:', error);
        return [];
    }
}

function updateDashboardWithRealOrders() {
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
            (order.orderId && order.orderId.toLowerCase().includes(searchTerm)) ||
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
            <div class="order-item" onclick="showOrderDetails('${order.orderId || order.id}')">
                <div class="order-header">
                    <div class="order-id">Order #${order.orderId || order.id}</div>
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
}

function searchOrders() {
    filterOrders();
}

function showOrderDetails(orderId) {
    const order = realOrders.find(o => o.orderId === orderId || o.id === orderId);
    if (!order) {
        showAlert('❌ Order not found!', 'error');
        return;
    }
    
    const modal = document.getElementById('order-details-modal');
    const content = document.getElementById('order-details-content');
    
    if (modal && content) {
        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <p><strong>Order ID:</strong> ${order.orderId || order.id}</p>
                <p><strong>Customer:</strong> ${order.customerName || 'Unknown'}</p>
                <p><strong>Date:</strong> ${formatDate(order.timestamp || order.orderTime)}</p>
                <p><strong>Status:</strong> <span class="order-status ${order.status || 'pending'}">${order.status || 'pending'}</span></p>
                <p><strong>Total:</strong> ₱${(order.total || 0).toFixed(2)}</p>
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
// SALES CHART
// ================================

function updateSalesChartWithRealData() {
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

// ================================
// REAL-TIME UPDATES
// ================================

function setupOrderListener() {
    // Listen for storage events (from customer orders)
    window.addEventListener('storage', function(e) {
        if (e.key === 'customerOrders' || e.key === 'lastOrder') {
            console.log('🔄 New order detected via storage event');
            loadRealOrders();
        }
    });
    
    // Poll for new orders every 10 seconds
    if (orderUpdateInterval) clearInterval(orderUpdateInterval);
    orderUpdateInterval = setInterval(() => {
        if (currentSection === 'dashboard' || currentSection === 'orders') {
            loadRealOrders();
        }
    }, 10000);
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

function loadRecentRealOrders() {
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
        <div class="order-preview-item" onclick="showOrderDetails('${order.orderId || order.id}')">
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

// ================================
// LOGIN MODAL
// ================================

function showLoginModal() {
    const modalHTML = `
        <div id="admin-login-modal" class="modal-overlay" style="display: flex; z-index: 9999;">
            <div class="modal-content" style="max-width: 400px;">
                <h2><i class="fas fa-user-shield"></i> Admin Login Required</h2>
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

function handleAdminModalLogin(role) {
    let username, password;
    
    if (role === 'admin') {
        username = 'admin';
        password = 'admin123';
    } else {
        username = 'superadmin';
        password = 'superadmin123';
    }
    
    if (role === 'admin') {
        localStorage.setItem('adminToken', 'demo_admin_token_123');
        localStorage.setItem('adminRole', 'admin');
    } else {
        localStorage.setItem('adminToken', 'demo_superadmin_token_456');
        localStorage.setItem('adminRole', 'superadmin');
    }
    
    adminToken = localStorage.getItem('adminToken');
    adminRole = localStorage.getItem('adminRole');
    
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.remove();
    
    showAlert(`✅ Welcome, ${role === 'superadmin' ? 'SuperAdmin' : 'Admin'}!`, 'success');
    
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// ================================
// GLOBAL EXPORTS
// ================================

// Make functions available globally for inline event handlers
window.showOrderDetails = showOrderDetails;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.toggleItemAvailability = toggleItemAvailability;