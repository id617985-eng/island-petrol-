// ================================
// MAIN SCRIPT - For all pages
// ================================

// API Configuration
const API_BASE_URL = "https://aifoodies.up.railway.app/api";

// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isAdmin = localStorage.getItem('adminToken') ? true : false;
let availabilityServiceInitialized = false;

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
    
    // Initialize availability system
    initializeAvailability();
});

// ================================
// SETUP FUNCTIONS
// ================================

function setupAddToCartButtons() {
    document.addEventListener('click', function(event) {
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
    const customerToggle = document.getElementById('customer-toggle');
    if (customerToggle) {
        customerToggle.addEventListener('click', function() {
            window.location.href = 'customer-profile.html';
        });
    }
    
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            goBack();
        });
    });
    
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
// AVAILABILITY FUNCTIONS
// ================================

async function initializeAvailability() {
    console.log('Initializing availability system...');
    
    // Wait a bit for services to load
    setTimeout(async () => {
        if (window.availabilityService && window.apiService) {
            availabilityService.init(apiService);
            availabilityServiceInitialized = true;
            
            // Initial fetch
            await availabilityService.fetchAvailability();
            
            // Start polling for updates every 30 seconds
            availabilityService.startPolling(30000);
            
            // Subscribe to changes
            availabilityService.subscribe(() => {
                updateMenuItemsAvailability();
            });
            
            console.log('Availability system initialized with server polling');
        } else {
            console.warn('Availability services not available, using localStorage fallback');
            
            // Fallback to localStorage with periodic checks
            setInterval(() => {
                updateMenuItemsAvailability();
            }, 10000);
        }
        
        // Initial UI update
        await updateMenuItemsAvailability();
    }, 500);
}

async function checkItemAvailability(itemName) {
    try {
        if (availabilityServiceInitialized && window.availabilityService) {
            return availabilityService.isItemAvailable(itemName);
        }
        
        // Fallback to API
        if (window.apiService) {
            const availability = await apiService.getAvailability();
            return availability[itemName] !== false;
        }
        
        // Fallback to localStorage
        const availability = JSON.parse(localStorage.getItem('itemAvailability') || '{}');
        return availability[itemName] !== false;
    } catch (error) {
        console.error('Error checking availability:', error);
        return true; // Default to available if error
    }
}

async function updateMenuItemsAvailability() {
    try {
        let availability = {};
        
        if (availabilityServiceInitialized && window.availabilityService) {
            availability = availabilityService.getAvailability();
        } else if (window.apiService) {
            availability = await apiService.getAvailability();
        } else {
            // Fallback to localStorage
            availability = JSON.parse(localStorage.getItem('itemAvailability') || '{}');
        }
        
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            const itemName = item.dataset.name;
            const isAvailable = availability[itemName] !== false;
            
            updateMenuItemUI(item, itemName, isAvailable);
        });
        
    } catch (error) {
        console.error('Error updating menu items availability:', error);
    }
}

function updateMenuItemUI(item, itemName, isAvailable) {
    if (!isAvailable) {
        // Mark as out of stock
        item.classList.add('out-of-stock');
        
        // Disable the "Add to Cart" button
        const addToCartBtn = item.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Out of Stock';
            addToCartBtn.style.backgroundColor = '#ccc';
            addToCartBtn.style.cursor = 'not-allowed';
        }
        
        // Add overlay
        const flipCardFront = item.querySelector('.flip-card-front');
        if (flipCardFront && !flipCardFront.querySelector('.out-of-stock-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'out-of-stock-overlay';
            overlay.innerHTML = '<span>OUT OF STOCK</span>';
            flipCardFront.appendChild(overlay);
        }
    } else {
        // Mark as available
        item.classList.remove('out-of-stock');
        
        const addToCartBtn = item.querySelector('.add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.textContent = 'Add to Cart';
            addToCartBtn.style.backgroundColor = '';
            addToCartBtn.style.cursor = 'pointer';
        }
        
        // Remove overlay
        const overlay = item.querySelector('.out-of-stock-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// ================================
// CART FUNCTIONS
// ================================

function setupCartFunctionality() {
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

async function addToCart(itemName, itemPrice) {
    // Check if item is available
    const isAvailable = await checkItemAvailability(itemName);
    
    if (!isAvailable) {
        showAlert(`❌ ${itemName} is currently out of stock!`);
        return;
    }
    
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

// ================================
// UPDATED CHECKOUT FUNCTION WITH API
// ================================

async function checkoutOrder() {
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
    
    // Check all items are still available
    for (const item of cart) {
        const isAvailable = await checkItemAvailability(item.name);
        if (!isAvailable) {
            showAlert(`❌ ${item.name} is no longer available. Please remove it from your cart.`);
            return;
        }
    }
    
    // Create order object
    const order = {
        customerName: customerName.value,
        customerPhone: customerPhone ? customerPhone.value : '',
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentMethod: paymentMethod ? paymentMethod.value : 'Cash on Pick-up',
        pickupTime: pickupTime ? pickupTime.value : 'ASAP',
        status: 'pending'
    };
    
    try {
        // Submit order to server
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save order to localStorage for admin panel
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            const orderWithId = {
                ...order,
                _id: data.orderId || 'order_' + Date.now(),
                status: 'pending',
                timestamp: new Date().toISOString()
            };
            orders.push(orderWithId);
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Update customer data if exists
            updateCustomerData(orderWithId);
            
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
                Order ID: #${data.orderId?.substring(0, 8) || orderWithId._id.substring(7, 13)}<br>
                Total: ₱${orderWithId.total.toFixed(2)}<br>
                Pickup: ${orderWithId.pickupTime}<br><br>
                Thank you for your order!`);
            
            // Reset form
            if (customerName) customerName.value = '';
            if (customerPhone) customerPhone.value = '';
            if (pickupTime) pickupTime.value = '';
            
            updateCartDisplay();
        } else {
            throw new Error(data.error || 'Failed to place order');
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        showAlert('❌ Error submitting order. Please try again.');
    }
}

function updateCustomerData(order) {
    const customerData = JSON.parse(localStorage.getItem('customerData') || '{}');
    
    if (customerData && customerData.id) {
        customerData.totalOrders = (customerData.totalOrders || 0) + 1;
        customerData.totalSpent = (customerData.totalSpent || 0) + order.total;
        customerData.loyaltyPoints = (customerData.loyaltyPoints || 0) + Math.floor(order.total / 10);
        
        if (!customerData.orderHistory) customerData.orderHistory = [];
        customerData.orderHistory.unshift(order);
        
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
        
        alertOk.onclick = function() {
            alertModal.style.display = 'none';
        };
        
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
        if (adminBtnText) adminBtnText.textContent = 'Admin Panel';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'inline-flex';
        
        adminBtn.onclick = function() {
            window.location.href = 'admin.html';
        };
        
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
            
            const existingModal = document.getElementById('admin-login-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
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

async function handleAdminLogin(role) {
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
        try {
            // Try API login first
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: inputUsername,
                    password: inputPassword,
                    role: role
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.token) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminRole', data.user?.role || role);
                
                const modal = document.getElementById('admin-login-modal');
                if (modal) modal.remove();
                
                showAlert(`✅ Welcome, ${role === 'superadmin' ? 'SuperAdmin' : 'Admin'}! Redirecting...`);
                
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
                
            } else {
                // Fallback to localStorage if API fails
                fallbackAdminLogin(role);
            }
        } catch (error) {
            console.error('API login failed, falling back to localStorage:', error);
            // Fallback to localStorage
            fallbackAdminLogin(role);
        }
    } else {
        showAlert('❌ Invalid username or password!');
    }
}

function fallbackAdminLogin(role) {
    if (role === 'admin') {
        localStorage.setItem('adminToken', 'demo_admin_token_123');
        localStorage.setItem('adminRole', 'admin');
    } else {
        localStorage.setItem('adminToken', 'demo_superadmin_token_456');
        localStorage.setItem('adminRole', 'superadmin');
    }
    
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.remove();
    
    showAlert(`✅ Welcome, ${role === 'superadmin' ? 'SuperAdmin' : 'Admin'}! Redirecting...`);
    
    setTimeout(() => {
        window.location.href = 'admin.html';
    }, 1000);
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

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.navigateTo = navigateTo;
window.goBack = goBack;
window.showAlert = showAlert;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.handleAdminLogin = handleAdminLogin;
window.closeAdminLoginModal = closeAdminLoginModal;
window.updateMenuItemsAvailability = updateMenuItemsAvailability;
window.checkoutOrder = checkoutOrder;