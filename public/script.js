// ================================
// MAIN SCRIPT - For all pages
// ================================

// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isAdmin = localStorage.getItem('adminToken') ? true : false;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏪 Store initialized');
    
    // Initialize cart
    updateCartDisplay();
    
    // Setup cart functionality
    setupCartFunctionality();
    
    // Setup admin button based on login status
    setupAdminButton();
    
    // Setup "Add to Cart" buttons dynamically
    setupAddToCartButtons();
    
    // Setup navigation buttons
    setupNavigationButtons();
});

// ================================
// SETUP FUNCTIONS
// ================================

function setupAddToCartButtons() {
    // Use event delegation for dynamically loaded or existing buttons
    document.addEventListener('click', function(event) {
        // Check if click is on an "Add to Cart" button or its child elements
        const addToCartBtn = event.target.closest('.add-to-cart-btn');
        
        if (addToCartBtn) {
            const menuItem = addToCartBtn.closest('.menu-item');
            if (menuItem) {
                const itemName = menuItem.dataset.name;
                const itemPrice = parseFloat(menuItem.dataset.price);
                
                if (itemName && itemPrice) {
                    addToCart(itemName, itemPrice);
                }
            }
        }
    });
}

function setupNavigationButtons() {
    // Handle customer profile button
    const customerToggle = document.getElementById('customer-toggle');
    if (customerToggle) {
        customerToggle.addEventListener('click', function() {
            window.location.href = 'customer-profile.html';
        });
    }
    
    // Handle back buttons
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            goBack();
        });
    });
    
    // Handle navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.getAttribute('onclick')?.match(/navigateTo\('(.+?)'\)/)?.[1];
            if (page) {
                navigateTo(page);
            }
        });
    });
}

// ================================
// CART FUNCTIONS
// ================================

function setupCartFunctionality() {
    // Cart trigger button
    const cartTrigger = document.getElementById('cart-trigger');
    const cartPopup = document.getElementById('cart-popup');
    const closeCartBtn = document.querySelector('.close-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cartTrigger && cartPopup) {
        cartTrigger.addEventListener('click', function() {
            cartPopup.style.display = 'block';
            updateCartDisplay();
        });
        
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', function() {
                cartPopup.style.display = 'none';
            });
        }
        
        // Close cart when clicking outside
        cartPopup.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkoutOrder);
    }
}

function addToCart(itemName, itemPrice) {
    // Check if item already in cart
    const existingItem = cart.find(item => item.name === itemName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: itemName,
            price: itemPrice,
            quantity: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update display
    updateCartDisplay();
    
    // Show confirmation
    showAlert(`✅ Added ${itemName} to cart!`);
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    // Update cart count
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Update cart items list
    if (cartItems) {
        cartItems.innerHTML = '';
        let total = 0;
        
        cart.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="cart-item">
                    <span class="cart-item-name">${item.name}</span>
                    <div class="cart-item-controls">
                        <button onclick="decreaseQuantity('${item.name}')">-</button>
                        <span class="cart-item-quantity">x${item.quantity}</span>
                        <button onclick="increaseQuantity('${item.name}')">+</button>
                    </div>
                    <span class="cart-item-price">₱${(item.price * item.quantity).toFixed(2)}</span>
                    <button class="cart-item-remove" onclick="removeFromCart('${item.name}')">×</button>
                </div>
            `;
            cartItems.appendChild(li);
            total += item.price * item.quantity;
        });
        
        if (cart.length === 0) {
            const li = document.createElement('li');
            li.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            cartItems.appendChild(li);
        }
        
        // Update total
        if (cartTotal) {
            cartTotal.textContent = `₱${total.toFixed(2)}`;
        }
    }
}

function increaseQuantity(itemName) {
    const item = cart.find(item => item.name === itemName);
    if (item) {
        item.quantity += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }
}

function decreaseQuantity(itemName) {
    const item = cart.find(item => item.name === itemName);
    if (item) {
        if (item.quantity > 1) {
            item.quantity -= 1;
        } else {
            removeFromCart(itemName);
            return;
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }
}

function removeFromCart(itemName) {
    cart = cart.filter(item => item.name !== itemName);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function checkoutOrder() {
    const customerName = document.getElementById('customer-name');
    const customerPhone = document.getElementById('customer-phone');
    const pickupTime = document.getElementById('pickup-time');
    const paymentMethod = document.getElementById('payment-method');
    
    if (!customerName || !customerName.value.trim()) {
        showAlert('Please enter your name for pickup');
        return;
    }
    
    if (cart.length === 0) {
        showAlert('Your cart is empty!');
        return;
    }
    
    // Create order object
    const order = {
        id: 'order_' + Date.now(),
        customerName: customerName.value,
        customerPhone: customerPhone ? customerPhone.value : '',
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentMethod: paymentMethod ? paymentMethod.value : 'Cash on Pick-up',
        pickupTime: pickupTime ? pickupTime.value : 'ASAP',
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    // Save order to localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Update customer data if exists
    updateCustomerData(order);
    
    // Clear cart
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Hide cart popup
    const cartPopup = document.getElementById('cart-popup');
    if (cartPopup) {
        cartPopup.style.display = 'none';
    }
    
    // Show success message
    showAlert(`✅ Order placed successfully!<br><br>
        Order ID: #${order.id.substring(7, 13)}<br>
        Total: ₱${order.total.toFixed(2)}<br>
        Pickup: ${order.pickupTime}<br><br>
        Thank you for your order!`);
    
    // Reset form
    if (customerName) customerName.value = '';
    if (customerPhone) customerPhone.value = '';
    if (pickupTime) pickupTime.value = '';
    
    updateCartDisplay();
}

function updateCustomerData(order) {
    const customerData = JSON.parse(localStorage.getItem('customerData') || '{}');
    
    if (customerData && customerData.id) {
        // Update customer stats
        customerData.totalOrders = (customerData.totalOrders || 0) + 1;
        customerData.totalSpent = (customerData.totalSpent || 0) + order.total;
        customerData.loyaltyPoints = (customerData.loyaltyPoints || 0) + Math.floor(order.total / 10);
        
        // Add to order history
        if (!customerData.orderHistory) customerData.orderHistory = [];
        customerData.orderHistory.unshift(order);
        
        // Update favorite items
        if (!customerData.favoriteItems) customerData.favoriteItems = [];
        order.items.forEach(item => {
            const existingItem = customerData.favoriteItems.find(fav => fav.name === item.name);
            if (existingItem) {
                existingItem.count = (existingItem.count || 0) + item.quantity;
            } else {
                customerData.favoriteItems.push({
                    name: item.name,
                    count: item.quantity
                });
            }
        });
        
        localStorage.setItem('customerData', JSON.stringify(customerData));
    }
}

// ================================
// NAVIGATION FUNCTIONS
// ================================

function navigateTo(page) {
    window.location.href = page;
}

function goBack() {
    window.history.back();
}

// ================================
// UTILITY FUNCTIONS
// ================================

function showAlert(message) {
    const alertModal = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('custom-alert-message');
    const alertOk = document.getElementById('custom-alert-ok');
    
    if (alertModal && alertMessage && alertOk) {
        alertMessage.innerHTML = message;
        alertModal.style.display = 'flex';
        
        // Ensure OK button works
        alertOk.onclick = function() {
            alertModal.style.display = 'none';
        };
        
        // Close when clicking outside
        alertModal.addEventListener('click', function(e) {
            if (e.target === this) {
                alertModal.style.display = 'none';
            }
        });
    } else {
        alert(message);
    }
}

// ================================
// ADMIN FUNCTIONS
// ================================

function setupAdminButton() {
    const adminToken = localStorage.getItem('adminToken');
    const adminBtn = document.getElementById('admin-toggle');
    const adminBtnText = document.getElementById('admin-btn-text');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    
    if (!adminBtn) return;
    
    if (adminToken) {
        // Admin is logged in
        if (adminBtnText) adminBtnText.textContent = 'Admin Panel';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline-flex';
        
        adminBtn.onclick = function() {
            window.location.href = 'admin.html';
        };
        
        // Setup logout button
        if (adminLogoutBtn) {
            adminLogoutBtn.onclick = function() {
                if (confirm('Logout from admin?')) {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminRole');
                    location.reload();
                }
            };
        }
    } else {
        // Admin is not logged in
        if (adminBtnText) adminBtnText.textContent = 'Admin Login';
        
        adminBtn.onclick = function() {
            const modalHTML = `
                <div id="admin-login-modal" class="modal-overlay" style="display: flex; z-index: 9999;">
                    <div class="modal-content" style="max-width: 400px;">
                        <h2>Admin Login</h2>
                        <p style="text-align: center; margin-bottom: 20px;">Login to access admin panel</p>
                        
                        <input type="text" id="admin-username" placeholder="Username" value="admin">
                        <input type="password" id="admin-password" placeholder="Password" value="admin123">
                        
                        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                            <button id="login-admin-btn" style="background: #FF6A00;">Login as Admin</button>
                            <button id="login-superadmin-btn" style="background: #8b4513;">Login as SuperAdmin</button>
                            <button onclick="closeAdminLoginModal()" style="background: #6c757d;">Cancel</button>
                        </div>
                        
                        <div style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">
                            <p><strong>Demo Credentials:</strong></p>
                            <p>Admin: admin / admin123</p>
                            <p>SuperAdmin: superadmin / superadmin123</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('admin-login-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listeners
            setTimeout(() => {
                const loginAdminBtn = document.getElementById('login-admin-btn');
                const loginSuperadminBtn = document.getElementById('login-superadmin-btn');
                const modal = document.getElementById('admin-login-modal');
                
                if (loginAdminBtn) {
                    loginAdminBtn.addEventListener('click', function() {
                        handleAdminLogin('admin');
                    });
                }
                
                if (loginSuperadminBtn) {
                    loginSuperadminBtn.addEventListener('click', function() {
                        handleAdminLogin('superadmin');
                    });
                }
                
                if (modal) {
                    modal.addEventListener('click', function(e) {
                        if (e.target === this) {
                            this.remove();
                        }
                    });
                }
            }, 100);
        };
    }
}

function handleAdminLogin(role) {
    let username, password;
    
    if (role === 'admin') {
        username = 'admin';
        password = 'admin123';
    } else {
        username = 'superadmin';
        password = 'superadmin123';
    }
    
    const inputUsername = document.getElementById('admin-username').value;
    const inputPassword = document.getElementById('admin-password').value;
    
    if (inputUsername === username && inputPassword === password) {
        if (role === 'admin') {
            localStorage.setItem('adminToken', 'demo_admin_token_123');
            localStorage.setItem('adminRole', 'admin');
        } else {
            localStorage.setItem('adminToken', 'demo_superadmin_token_456');
            localStorage.setItem('adminRole', 'superadmin');
        }
        
        // Close modal
        const modal = document.getElementById('admin-login-modal');
        if (modal) modal.remove();
        
        // Show success message
        showAlert(`✅ Welcome, ${role === 'superadmin' ? 'SuperAdmin' : 'Admin'}! Redirecting to admin panel...`);
        
        // Redirect to admin panel
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    } else {
        showAlert('❌ Invalid username or password!');
    }
}

function closeAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        modal.remove();
    }
}

// ================================
// GLOBAL EXPORTS
// ================================

// Make functions available globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.navigateTo = navigateTo;
window.goBack = goBack;
window.showAlert = showAlert;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.handleAdminLogin = handleAdminLogin;
window.closeAdminLoginModal = closeAdminLoginModal;