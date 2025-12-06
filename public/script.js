// ================================
// MAIN SCRIPT - For all pages
// ================================

// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let isAdmin = localStorage.getItem('adminToken') ? true : false;
const API_BASE_URL = 'https://aifoodies.up.railway.app/api';

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
    
    // Load menu items from server
    loadMenuItemsFromServer();
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
// MENU ITEMS FUNCTIONS
// ================================

async function loadMenuItemsFromServer() {
    try {
        const response = await fetch(`${API_BASE_URL}/menu-items`);
        
        if (response.ok) {
            const items = await response.json();
            
            // Update menu items on the page
            updateMenuItemsDisplay(items);
            
            console.log(`✅ Loaded ${items.length} menu items from server`);
            return items;
        }
        
        return [];
    } catch (error) {
        console.error('Error loading menu items:', error);
        return [];
    }
}

function updateMenuItemsDisplay(items) {
    // This function will be implemented in nachos.html and aifoodies.html
    // to update their specific displays
    console.log('Menu items loaded:', items);
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

async function checkItemAvailability(itemName) {
    try {
        const response = await fetch(`${API_BASE_URL}/availability`);
        
        if (response.ok) {
            const availability = await response.json();
            return availability[itemName] !== false;
        }
        
        return true; // Default to available if server error
    } catch (error) {
        console.error('Error checking availability:', error);
        return true; // Default to available if error
    }
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
        pickupTime: pickupTime ? pickupTime.value : 'ASAP'
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
        
        if (response.ok) {
            const orderData = await response.json();
            console.log('Order submitted:', orderData);
            
            // Save order to localStorage for admin panel
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(orderData);
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Update customer data if exists
            updateCustomerData(orderData);
            
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
                Order ID: #${(orderData._id || '').substring(6, 12) || 'N/A'}<br>
                Total: ₱${orderData.total.toFixed(2)}<br>
                Pickup: ${orderData.pickupTime}<br><br>
                Thank you for your order!`);
            
            // Reset form
            if (customerName) customerName.value = '';
            if (customerPhone) customerPhone.value = '';
            if (pickupTime) pickupTime.value = '';
            
            updateCartDisplay();
            
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit order');
        }
        
    } catch (error) {
        console.error('Checkout error:', error);
        showAlert(`❌ Error submitting order: ${error.message}`);
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
            showAdminLoginModal();
        };
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