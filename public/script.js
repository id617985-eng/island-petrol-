// Configuration
const backendURL = 'https://aifoodies.up.railway.app';
const API_URL = `${backendURL}/api/orders`;
const ADMIN_API_URL = `${backendURL}/api/admin`;

const currencySymbol = '₱';
let cart = JSON.parse(localStorage.getItem('globalCart')) || [];
let isAdminLoggedIn = false;
let authToken = localStorage.getItem('adminToken');
let orders = [];

// Server-side item availability
let itemAvailability = {};

// Notification variables
let notificationInterval = null;
let lastNotificationCheck = null;
let unreadNotifications = 0;

// Service Worker and Push Notification variables
let serviceWorkerRegistration = null;

// Check authentication on load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Ai-Maize-ing Nachos Application...');
    
    await checkAuthentication();
    
    // Initialize all event listeners
    initializeEventListeners();
    
    updateCartDisplay();
    
    // Initialize customer UI
    updateCustomerButtonUI();
    
    // Auto-fill customer info if available
    autoFillCustomerInfo();
    
    // Initialize service worker for push notifications
    await initializeServiceWorker();
    
    // Initialize availability from server
    await initializeAvailability();
    
    console.log('✅ Application initialized successfully');
});

// Initialize all event listeners
function initializeEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    console.log(`🛒 Found ${addToCartButtons.length} add to cart buttons`);
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('➕ Add to cart clicked');
            addToCart(this);
        });
    });
    
    // Cart functionality
    const cartTrigger = document.getElementById('cart-trigger');
    const closeBtn = document.querySelector('.close-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cartTrigger) {
        cartTrigger.addEventListener('click', toggleCart);
        console.log('🛒 Cart trigger listener added');
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleCart);
        console.log('❌ Close button listener added');
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
        console.log('✅ Checkout button listener added');
    }
    
    // Admin functionality
    const adminToggle = document.getElementById('admin-toggle');
    const loginBtn = document.getElementById('login-btn');
    const dashboardClose = document.querySelector('.dashboard-close');
    
    if (adminToggle) {
        adminToggle.addEventListener('click', toggleAdminLogin);
        console.log('👤 Admin toggle listener added');
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', adminLogin);
        console.log('🔑 Login button listener added');
    }
    
    if (dashboardClose) {
        dashboardClose.addEventListener('click', closeDashboard);
        console.log('🚪 Dashboard close listener added');
    }
    
    // Customer functionality
    const customerToggle = document.getElementById('customer-toggle');
    const customerPhone = document.getElementById('customer-phone');
    
    if (customerToggle) {
        customerToggle.addEventListener('click', showCustomerRegistration);
        console.log('👥 Customer toggle listener added');
    }
    
    if (customerPhone) {
        customerPhone.addEventListener('blur', lookupCustomer);
        console.log('📱 Customer phone lookup listener added');
    }
    // Slideshow functionality
let currentSlide = 0;
let slideshowInterval;

function initializeSlideshow() {
    const slidesContainer = document.getElementById('slides');
    const indicatorsContainer = document.querySelector('.slideshow-indicators');
    
    if (!slidesContainer) return;
    
    const slides = getActiveSlides();
    
    if (slides.length === 0) {
        // Use default slides if none exist
        slidesContainer.innerHTML = `
            <div class="slide active">
                <div class="slide-content">
                    <h3>Welcome to Ai-Maize-ing Nachos!</h3>
                    <p>Try our delicious nachos and desserts</p>
                    <div class="price">Starting at ₱35</div>
                </div>
            </div>
        `;
        return;
    }
    
    // Clear existing slides
    slidesContainer.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    
    // Create slides and indicators
    slides.forEach((slide, index) => {
        // Create slide element
        const slideElement = document.createElement('div');
        slideElement.className = `slide ${index === 0 ? 'active' : ''}`;
        slideElement.style.backgroundImage = `url('${slide.image}')`;
        
        slideElement.innerHTML = `
            <div class="slide-content">
                <h3>${slide.title}</h3>
                ${slide.subtitle ? `<p>${slide.subtitle}</p>` : ''}
                ${slide.price ? `<div class="price">${slide.price}</div>` : ''}
            </div>
        `;
        
        // Add click event if action is specified
        if (slide.action) {
            slideElement.style.cursor = 'pointer';
            slideElement.onclick = () => {
                window.location.href = slide.action;
            };
        }
        
        slidesContainer.appendChild(slideElement);
        
        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
        indicator.onclick = () => goToSlide(index);
        indicatorsContainer.appendChild(indicator);
    });
    
    // Start auto-slide if there are multiple slides
    if (slides.length > 1) {
        startAutoSlide();
    }
}

function getActiveSlides() {
    const slides = localStorage.getItem('slideshowItems');
    if (slides) {
        return JSON.parse(slides)
            .filter(slide => slide.active !== false)
            .sort((a, b) => a.order - b.order);
    }
    return [];
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    
    if (slides.length === 0) return;
    
    // Remove active class from all slides and indicators
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Add active class to current slide and indicator
    currentSlide = index;
    slides[currentSlide].classList.add('active');
    if (indicators[currentSlide]) {
        indicators[currentSlide].classList.add('active');
    }
}

function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    const nextIndex = (currentSlide + 1) % slides.length;
    goToSlide(nextIndex);
}

function prevSlide() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    const prevIndex = (currentSlide - 1 + slides.length) % slides.length;
    goToSlide(prevIndex);
}

function startAutoSlide() {
    clearInterval(slideshowInterval);
    slideshowInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
}

function stopAutoSlide() {
    clearInterval(slideshowInterval);
}

// Add event listeners for slideshow controls
document.addEventListener('DOMContentLoaded', function() {
    initializeSlideshow();
    
    // Add slideshow controls event listeners
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            stopAutoSlide();
            prevSlide();
            startAutoSlide();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            stopAutoSlide();
            nextSlide();
            startAutoSlide();
        });
    }
    
    // Pause auto-slide on hover
    const slideshow = document.getElementById('slideshow-container');
    if (slideshow) {
        slideshow.addEventListener('mouseenter', stopAutoSlide);
        slideshow.addEventListener('mouseleave', startAutoSlide);
    }
});
    // Flip Card Functionality
    document.querySelectorAll('.flip-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            card.classList.toggle('flipped');
        });
    });
    
    // Custom alert
    const customAlertOk = document.getElementById('custom-alert-ok');
    if (customAlertOk) {
        customAlertOk.addEventListener('click', function() {
            document.getElementById('custom-alert').style.display = 'none';
        });
    }
    
    // Category buttons on home page
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = this.closest('.category-card');
            if (card.onclick) {
                card.onclick();
            }
        });
    });
    
    // Navigation buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const onclickAttr = this.getAttribute('onclick');
            if (onclickAttr) {
                eval(onclickAttr);
            }
        });
    });
    
    // Back buttons
    const backBtns = document.querySelectorAll('.back-btn');
    backBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const onclickAttr = this.getAttribute('onclick');
            if (onclickAttr) {
                eval(onclickAttr);
            }
        });
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        // Close login modal
        const loginModal = document.getElementById('login-modal');
        if (loginModal && loginModal.style.display === 'flex' && e.target === loginModal) {
            loginModal.style.display = 'none';
        }
        
        // Close admin dashboard
        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard && adminDashboard.style.display === 'block' && e.target === adminDashboard) {
            closeDashboard();
        }
        
        // Close cart popup when clicking outside
        const cartPopup = document.getElementById('cart-popup');
        if (cartPopup && cartPopup.style.display === 'block' && !cartPopup.contains(e.target) && e.target !== document.getElementById('cart-trigger')) {
            cartPopup.style.display = 'none';
        }
        
        // Close customer modal when clicking outside
        const customerModal = document.querySelector('.modal-overlay');
        if (customerModal && (customerModal.querySelector('#customer-reg-name') || customerModal.querySelector('#login-phone')) && e.target === customerModal) {
            closeCurrentModal();
        }
    });
    
    console.log('✅ All event listeners initialized successfully');
}

// ===== SERVER-SIDE AVAILABILITY MANAGEMENT =====
async function initializeAvailability() {
    console.log('📦 Initializing item availability from server...');
    
    try {
        const response = await fetch(`${backendURL}/api/availability`);
        if (response.ok) {
            itemAvailability = await response.json();
            console.log('✅ Availability loaded from server:', itemAvailability);
            
            // Update all menu items
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                const itemName = item.getAttribute('data-name');
                updateItemAvailability(item, itemAvailability[itemName] !== false);
            });
            
            // Update admin controls if admin is logged in
            if (isAdminLoggedIn) {
                updateAdminAvailabilityControls();
            }
        } else {
            throw new Error('Failed to fetch availability');
        }
    } catch (error) {
        console.error('❌ Error loading availability:', error);
        // Fallback: initialize with all items available
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const itemName = item.getAttribute('data-name');
            itemAvailability[itemName] = true;
            updateItemAvailability(item, true);
        });
    }
}

async function toggleItemAvailability(itemName) {
    console.log('🔄 Toggling availability for:', itemName);
    
    const newAvailability = !itemAvailability[itemName];
    
    try {
        const response = await fetch(`${backendURL}/api/availability/${encodeURIComponent(itemName)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ available: newAvailability })
        });

        if (response.ok) {
            itemAvailability[itemName] = newAvailability;
            
            // Update all menu items with this name
            updateAllMenuItemsAvailability(itemName);
            
            // Update admin controls
            updateAdminAvailabilityControls();
            
            const status = newAvailability ? 'available' : 'unavailable';
            showCustomAlert(`${itemName} is now ${status}`);
        } else {
            throw new Error('Failed to update availability');
        }
    } catch (error) {
        console.error('❌ Error toggling availability:', error);
        showCustomAlert('Error updating availability. Please try again.');
    }
}

function updateItemAvailability(menuItem, isAvailable) {
    const itemName = menuItem.getAttribute('data-name');
    const addToCartBtn = menuItem.querySelector('.add-to-cart-btn');
    const priceElement = menuItem.querySelector('.price');
    
    console.log(`🎯 Updating ${itemName} to ${isAvailable ? 'available' : 'unavailable'}`);
    
    if (isAvailable) {
        // Item is available
        menuItem.classList.remove('disabled');
        menuItem.classList.add('available');
        
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.style.opacity = '1';
            addToCartBtn.style.cursor = 'pointer';
            addToCartBtn.title = 'Add to cart';
            addToCartBtn.innerHTML = 'Add to Cart';
            addToCartBtn.style.background = '#8b4513';
        }
        
        if (priceElement) {
            priceElement.style.opacity = '1';
            priceElement.style.color = '#e65100';
        }
        
        // Remove out of stock badge if exists
        const existingBadge = menuItem.querySelector('.out-of-stock-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
    } else {
        // Item is unavailable
        menuItem.classList.add('disabled');
        menuItem.classList.remove('available');
        
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.style.opacity = '0.6';
            addToCartBtn.style.cursor = 'not-allowed';
            addToCartBtn.title = 'Out of stock';
            addToCartBtn.innerHTML = 'Out of Stock';
            addToCartBtn.style.background = '#cccccc';
        }
        
        if (priceElement) {
            priceElement.style.opacity = '0.6';
            priceElement.style.color = '#999';
        }
        
        // Add out of stock badge
        const existingBadge = menuItem.querySelector('.out-of-stock-badge');
        if (!existingBadge) {
            const outOfStockBadge = document.createElement('div');
            outOfStockBadge.className = 'out-of-stock-badge';
            outOfStockBadge.textContent = 'Out of Stock';
            outOfStockBadge.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #dc3545;
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: bold;
                z-index: 10;
                animation: pulse-red 2s infinite;
            `;
            menuItem.style.position = 'relative';
            menuItem.appendChild(outOfStockBadge);
        }
    }
}

function updateAllMenuItemsAvailability(itemName) {
    console.log('📝 Updating menu items for:', itemName);
    
    const menuItems = document.querySelectorAll('.menu-item');
    let updatedCount = 0;
    
    menuItems.forEach(item => {
        if (item.getAttribute('data-name') === itemName) {
            updateItemAvailability(item, itemAvailability[itemName]);
            updatedCount++;
        }
    });
    
    console.log(`✅ Updated ${updatedCount} menu items for ${itemName}`);
}

function updateAdminAvailabilityControls() {
    console.log('🔄 Updating admin availability controls');
    
    const availabilityControls = document.querySelectorAll('.availability-control');
    availabilityControls.forEach(control => {
        const itemName = control.getAttribute('data-item');
        const toggleBtn = control.querySelector('.availability-toggle');
        const statusSpan = control.querySelector('.availability-status');
        
        if (itemAvailability[itemName]) {
            toggleBtn.textContent = 'Mark as Unavailable';
            toggleBtn.classList.remove('unavailable');
            toggleBtn.classList.add('available');
            if (statusSpan) {
                statusSpan.textContent = 'Available';
                statusSpan.className = 'availability-status available';
            }
        } else {
            toggleBtn.textContent = 'Mark as Available';
            toggleBtn.classList.remove('available');
            toggleBtn.classList.add('unavailable');
            if (statusSpan) {
                statusSpan.textContent = 'Out of Stock';
                statusSpan.className = 'availability-status unavailable';
            }
        }
    });
}

function addAvailabilityControlsToAdmin() {
    const ordersSection = document.querySelector('.orders-section');
    if (!ordersSection) {
        console.log('❌ Orders section not found');
        return;
    }
    
    let availabilitySection = document.querySelector('.availability-section');
    if (!availabilitySection) {
        console.log('📦 Creating new availability section');
        availabilitySection = document.createElement('div');
        availabilitySection.className = 'availability-section';
        availabilitySection.innerHTML = `
            <h3>📦 Item Availability Management</h3>
            <div class="section-content">
                <p>Toggle item availability for customers:</p>
                <div id="availability-controls" class="availability-controls-grid"></div>
            </div>
        `;
        ordersSection.parentNode.insertBefore(availabilitySection, ordersSection);
    }
    
    const availabilityControls = document.getElementById('availability-controls');
    if (!availabilityControls) {
        console.log('❌ Availability controls container not found');
        return;
    }
    
    availabilityControls.innerHTML = '';
    
    // Get all unique menu items
    const allMenuItems = {};
    document.querySelectorAll('.menu-item').forEach(item => {
        const itemName = item.getAttribute('data-name');
        if (itemName) {
            allMenuItems[itemName] = true;
        }
    });
    
    console.log('📋 Found menu items:', Object.keys(allMenuItems));
    
    // Add controls for each item
    Object.keys(allMenuItems).forEach(itemName => {
        // Use server data, default to true if not loaded yet
        const isAvailable = itemAvailability.hasOwnProperty(itemName) ? itemAvailability[itemName] : true;
        
        const controlDiv = document.createElement('div');
        controlDiv.className = 'availability-control';
        controlDiv.setAttribute('data-item', itemName);
        
        const statusClass = isAvailable ? 'available' : 'unavailable';
        const statusText = isAvailable ? 'Available' : 'Out of Stock';
        
        controlDiv.innerHTML = `
            <div class="availability-item-info">
                <span class="availability-item-name">${itemName}</span>
                <span class="availability-status ${statusClass}">${statusText}</span>
            </div>
            <button class="availability-toggle ${statusClass}">
                ${isAvailable ? 'Mark as Unavailable' : 'Mark as Available'}
            </button>
        `;
        availabilityControls.appendChild(controlDiv);
        
        const toggleBtn = controlDiv.querySelector('.availability-toggle');
        toggleBtn.addEventListener('click', () => {
            console.log('🔘 Toggle button clicked for:', itemName);
            toggleItemAvailability(itemName);
        });
    });
    
    console.log('✅ Availability controls added to admin dashboard');
}

// Customer Account Functions
function showCustomerRegistration() {
    console.log('👥 Showing customer registration modal');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 450px;">
            <h3 style="color: #8b4513; margin-bottom: 10px;">Create Customer Account</h3>
            <p style="color: #666; margin-bottom: 25px; line-height: 1.5;">Create an account to earn loyalty points and faster checkout</p>
            
            <div class="form-group">
                <label for="customer-reg-name">Full Name *</label>
                <input type="text" id="customer-reg-name" placeholder="Enter full name" required>
            </div>
            
            <div class="form-group">
                <label for="customer-reg-phone">Phone Number *</label>
                <input type="tel" id="customer-reg-phone" placeholder="e.g., 09123456789" required>
            </div>
            
            <div class="form-group">
                <label for="customer-reg-email">Email (Optional)</label>
                <input type="email" id="customer-reg-email" placeholder="Enter email address">
            </div>
            
            <div class="form-group">
                <label for="customer-reg-password">Password *</label>
                <input type="password" id="customer-reg-password" placeholder="Create password for login" required>
                <small style="color: #666;">Password must be at least 4 characters</small>
            </div>
            
            <div class="form-actions">
                <button type="button" onclick="closeCurrentModal()" style="background: #6c757d;">Cancel</button>
                <button type="button" onclick="registerCustomer()" style="background: #28a745;">Create Account</button>
            </div>
            
            <p style="margin-top: 15px; text-align: center; color: #666;">
                Already have an account? 
                <a href="#" onclick="switchToLogin()" style="color: #8b4513; text-decoration: underline;">Login here</a>
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// New function to close current modal
function closeCurrentModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// New function to switch to login
function switchToLogin() {
    closeCurrentModal();
    showCustomerLogin();
}

// FIXED Customer Registration Function
async function registerCustomer() {
    const name = document.getElementById('customer-reg-name').value;
    const phone = document.getElementById('customer-reg-phone').value;
    const email = document.getElementById('customer-reg-email').value;
    const password = document.getElementById('customer-reg-password').value;

    console.log('📝 Registration attempt:', { name, phone, email, password: password ? '***' : 'empty' });

    if (!name || !phone || !password) {
        showCustomAlert('Please enter name, phone number, and password');
        return;
    }

    // Basic phone validation
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
        showCustomAlert('Please enter a valid phone number (10-15 digits)');
        return;
    }

    // Password strength check
    if (password.length < 4) {
        showCustomAlert('Password must be at least 4 characters long');
        return;
    }

    try {
        console.log('📝 Registering customer...');
        const response = await fetch(`${backendURL}/api/customers/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name: name.trim(), 
                phone: phone.trim(), 
                email: email ? email.trim() : '', 
                password: password 
            })
        });

        const responseData = await response.json();
        console.log('Registration response:', responseData);

        if (response.ok) {
            showCustomAlert('Account created successfully! You can now login to track your orders.');
            closeCurrentModal();
            
            // Auto-fill the customer name in order form if on order page
            const customerNameInput = document.getElementById('customer-name');
            const customerPhoneInput = document.getElementById('customer-phone');
            
            if (customerNameInput) customerNameInput.value = name;
            if (customerPhoneInput) customerPhoneInput.value = phone;
            
            // Show login modal after successful registration
            setTimeout(() => {
                showCustomerLogin();
                // Pre-fill the phone number in login
                const loginPhoneInput = document.getElementById('login-phone');
                if (loginPhoneInput) loginPhoneInput.value = phone;
            }, 1500);
            
        } else {
            showCustomAlert(responseData.message || 'Failed to create account. Please try again.');
        }
    } catch (error) {
        console.error('Error creating customer account:', error);
        showCustomAlert('Network error. Please check your connection and try again.');
    }
}

// FIXED Customer Login Function
function showCustomerLogin() {
    console.log('👥 Showing customer login modal');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="login-container">
            <h2>Customer Login</h2>
            <input type="tel" id="login-phone" placeholder="Phone Number" required>
            <input type="password" id="login-password" placeholder="Password" required>
            <button onclick="customerLogin()">Login</button>
            <p style="margin-top: 15px; color: #666;">
                Don't have an account? 
                <a href="#" onclick="switchToRegistration()" style="color: #8b4513; text-decoration: underline;">Create one</a>
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// New function to switch to registration
function switchToRegistration() {
    closeCurrentModal();
    showCustomerRegistration();
}

// FIXED Customer Login
async function customerLogin() {
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;

    console.log('🔐 Login attempt:', { phone, password: password ? '***' : 'empty' });

    if (!phone || !password) {
        showCustomAlert('Please enter phone number and password');
        return;
    }

    try {
        const response = await fetch(`${backendURL}/api/customers/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });

        const responseData = await response.json();
        console.log('Login response:', responseData);

        if (response.ok) {
            localStorage.setItem('customerToken', responseData.token);
            closeCurrentModal();
            
            showCustomAlert('Login successful! You can now view your order history.');
            console.log('✅ Customer login successful');
            
            // Update customer button UI immediately
            updateCustomerButtonUI();
            
            // Redirect to profile page or update UI
            if (window.location.pathname.includes('customer-profile.html')) {
                window.location.reload();
            }
        } else {
            showCustomAlert(responseData.message || 'Login failed. Please check your credentials.');
            console.log('❌ Customer login failed');
        }
    } catch (error) {
        console.error('Customer login error:', error);
        showCustomAlert('Network error. Please try again.');
    }
}

// Update customer button UI after login
function updateCustomerButtonUI() {
    const customerToggle = document.getElementById('customer-toggle');
    if (customerToggle && localStorage.getItem('customerToken')) {
        customerToggle.innerHTML = '<i class="fas fa-user"></i> My Profile';
        customerToggle.onclick = () => window.location.href = 'customer-profile.html';
        console.log('👤 Customer button updated to show profile');
    }
}

// Quick customer lookup by phone
async function lookupCustomer() {
    const phone = document.getElementById('customer-phone').value;
    if (!phone || phone.length < 10) return;

    try {
        console.log('🔍 Looking up customer by phone:', phone);
        const response = await fetch(`${backendURL}/api/customers/phone/${phone}`);
        if (response.ok) {
            const customer = await response.json();
            document.getElementById('customer-name').value = customer.name;
            
            // Show loyalty points message
            let message = `Welcome back, ${customer.name}!`;
            if (customer.loyaltyPoints > 0) {
                message += ` You have ${customer.loyaltyPoints} loyalty points.`;
            }
            showCustomAlert(message);
            
            // Store customer info
            localStorage.setItem('customerPhone', phone);
            localStorage.setItem('customerName', customer.name);
            localStorage.setItem('customerId', customer.id);
        }
    } catch (error) {
        // Customer not found - this is normal for new customers
        console.log('ℹ️ Customer not found or lookup failed');
        // Clear stored customer info
        localStorage.removeItem('customerPhone');
        localStorage.removeItem('customerName');
        localStorage.removeItem('customerId');
    }
}

// Auto-fill customer info from localStorage on page load
function autoFillCustomerInfo() {
    const savedPhone = localStorage.getItem('customerPhone');
    const savedName = localStorage.getItem('customerName');
    
    if (savedPhone && savedName) {
        const customerName = document.getElementById('customer-name');
        const customerPhone = document.getElementById('customer-phone');
        
        if (customerName) customerName.value = savedName;
        if (customerPhone) customerPhone.value = savedPhone;
        
        console.log('👤 Auto-filled customer info:', { name: savedName, phone: savedPhone });
    }
}

// Authentication Functions
async function checkAuthentication() {
    if (authToken) {
        try {
            const response = await fetch(`${ADMIN_API_URL}/verify`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (response.ok) {
                isAdminLoggedIn = true;
                updateAdminUI();
                console.log('✅ Admin authenticated successfully');
            } else {
                logout();
                console.log('❌ Admin token invalid');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        }
    } else {
        console.log('ℹ️ No admin token found');
    }
}

function updateAdminUI() {
    const adminToggle = document.getElementById('admin-toggle');
    if (!adminToggle) return;
    
    if (isAdminLoggedIn) {
        adminToggle.innerHTML = '<i class="fas fa-user-shield"></i> Dashboard';
        adminToggle.style.backgroundColor = '#28a745';
        
        // Add logout button if not exists
        if (!document.getElementById('logout-btn')) {
            const adminPanel = document.getElementById('admin-panel');
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logout-btn';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            logoutBtn.style.marginLeft = '10px';
            logoutBtn.style.background = '#dc3545';
            logoutBtn.onclick = logout;
            adminPanel.appendChild(logoutBtn);
        }
    } else {
        adminToggle.innerHTML = '<i class="fas fa-user-shield"></i> Admin';
        adminToggle.style.backgroundColor = '#8b4513';
        
        // Remove logout button if exists
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.remove();
        }
    }
}

function logout() {
    isAdminLoggedIn = false;
    authToken = null;
    localStorage.removeItem('adminToken');
    
    // Stop notification polling
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
    
    updateAdminUI();
    closeDashboard();
    showCustomAlert('Logged out successfully!');
    console.log('👋 Admin logged out');
}

// API call helper with authentication
async function makeAuthenticatedRequest(url, options = {}) {
    if (!authToken) {
        throw new Error('Not authenticated');
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    const response = await fetch(url, defaultOptions);
    
    if (response.status === 401) {
        logout();
        throw new Error('Session expired');
    }
    
    return response;
}

/* ============================
   SERVICE WORKER & PUSH NOTIFICATIONS
   ============================ */

async function initializeServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            serviceWorkerRegistration = registration;
            console.log('✅ Service Worker registered');
            
            // Initialize push notifications only if admin is logged in
            if (isAdminLoggedIn) {
                await initializePushNotifications();
            }
        } catch (error) {
            console.log('❌ Service Worker registration failed:', error);
        }
    } else {
        console.log('ℹ️ Service Worker or Push Manager not supported');
    }
}

async function initializePushNotifications() {
    if (!serviceWorkerRegistration || !isAdminLoggedIn) return;
    
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('✅ Notification permission granted');
            
            const subscription = await serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(await getVAPIDPublicKey())
            });
            
            // Send subscription to server
            await registerPushSubscription(subscription);
        } else {
            console.log('❌ Notification permission denied');
        }
    } catch (error) {
        console.log('❌ Push notification setup failed:', error);
    }
}

async function getVAPIDPublicKey() {
    try {
        const response = await fetch(`${ADMIN_API_URL}/push/vapid-public-key`);
        const data = await response.json();
        return data.publicKey;
    } catch (error) {
        console.log('❌ Failed to get VAPID public key:', error);
        return null;
    }
}

async function registerPushSubscription(subscription) {
    try {
        await fetch(`${ADMIN_API_URL}/push/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(subscription)
        });
        console.log('✅ Push subscription registered with server');
    } catch (error) {
        console.log('❌ Failed to register push subscription:', error);
    }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/* ============================
   CART & ORDERING LOGIC
   ============================ */

// Save cart to localStorage whenever it changes
function saveCartToStorage() {
    localStorage.setItem('globalCart', JSON.stringify(cart));
    console.log('💾 Cart saved to localStorage');
}

function addToCart(btn) {
    const menuItem = btn.closest('.menu-item');
    const name = menuItem.dataset.name;
    const price = parseFloat(menuItem.dataset.price);
    const img = menuItem.querySelector('img');

    // Check if item is available
    if (itemAvailability.hasOwnProperty(name) && !itemAvailability[name]) {
        showCustomAlert(`Sorry, ${name} is currently out of stock!`);
        return;
    }

    console.log(`🛒 Adding to cart: ${name} - ${currencySymbol}${price}`);

    const existingItem = cart.find(item => item.name === name);
    if(existingItem) { 
        existingItem.quantity += 1; 
        console.log(`📦 Increased quantity to ${existingItem.quantity}`);
    } else { 
        cart.push({name, price, quantity:1}); 
        console.log(`🆕 New item added to cart`);
    }

    updateCartDisplay();

    const cartBtn = document.getElementById('cart-trigger');
    if (cartBtn) {
        cartBtn.classList.add('bouncing');
        setTimeout(() => cartBtn.classList.remove('bouncing'), 500);
    }

    if (img) {
        flyToCart(img);
    }
    
    showCustomAlert(`Added ${name} to cart!`);
}

function updateCartDisplay() {
    const cartItemsList = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const cartCountElement = document.getElementById('cart-count');

    if (!cartItemsList || !cartTotalElement || !cartCountElement) {
        console.log('ℹ️ Cart elements not found on this page');
        return;
    }

    cartItemsList.innerHTML = '';
    let total = 0, totalItems = 0;

    if(cart.length === 0) { 
        cartItemsList.innerHTML = '<li style="text-align: center; color: #666; padding: 20px;">Your cart is empty.</li>'; 
        if (document.getElementById('checkout-btn')) {
            document.getElementById('checkout-btn').disabled = true;
        }
    } else {
        cart.forEach((item,index)=>{
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            totalItems += item.quantity;

            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name}</span>
                <div class="quantity-controls">
                    <button onclick="changeQuantity(${index},-1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${index},1)">+</button>
                </div>
                <span>${currencySymbol}${itemTotal.toFixed(0)}</span>
            `;
            cartItemsList.appendChild(li);
        });
        if (document.getElementById('checkout-btn')) {
            document.getElementById('checkout-btn').disabled = false;
        }
    }

    cartTotalElement.textContent = `${currencySymbol}${total.toFixed(0)}`;
    cartCountElement.textContent = totalItems;
    
    // Save to localStorage
    saveCartToStorage();
    
    console.log(`🛒 Cart updated: ${totalItems} items, Total: ${currencySymbol}${total}`);
}

function changeQuantity(index, delta) {
    cart[index].quantity += delta;
    if(cart[index].quantity <= 0) {
        const removedItem = cart.splice(index,1)[0];
        console.log(`🗑️ Removed ${removedItem.name} from cart`);
    }
    updateCartDisplay();
}

function toggleCart() { 
    const popup = document.getElementById('cart-popup');
    if (!popup) {
        console.log('❌ Cart popup not found');
        return;
    }
    const currentDisplay = popup.style.display;
    popup.style.display = currentDisplay === 'block' ? 'none' : 'block'; 
    console.log('🛒 Cart toggled:', popup.style.display);
}

function flyToCart(img) {
    const cartBtn = document.getElementById('cart-trigger');
    if (!cartBtn) return;
    
    const clone = img.cloneNode(true);
    const rect = img.getBoundingClientRect();
    const cartRect = cartBtn.getBoundingClientRect();

    clone.style.position = 'fixed';
    clone.style.top = rect.top + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.transition = 'all 0.7s ease-in-out';
    clone.style.zIndex = 1000;
    clone.style.borderRadius = '8px';
    document.body.appendChild(clone);

    setTimeout(() => {
        clone.style.top = cartRect.top + 'px';
        clone.style.left = cartRect.left + 'px';
        clone.style.width = '30px';
        clone.style.height = '30px';
        clone.style.opacity = '0.7';
    }, 10);

    setTimeout(() => {
        if (clone.parentNode) {
            clone.parentNode.removeChild(clone);
        }
    }, 710);
}

// CHECKOUT (Sends to Backend API) - Enhanced with customer support
async function checkout() {
    if(cart.length === 0){ 
        showCustomAlert('Cart empty!'); 
        return;
    }

    const customerName = document.getElementById('customer-name');
    const customerPhone = document.getElementById('customer-phone');
    const pickupTime = document.getElementById('pickup-time');
    const paymentMethod = document.getElementById('payment-method');

    if (!customerName || !pickupTime) {
        showCustomAlert('Please enter your name and pick-up time!');
        return;
    }

    if(!customerName.value || !pickupTime.value){ 
        showCustomAlert('Please enter your name and pick-up time!'); 
        return;
    }

    // Try to find customer by phone for loyalty points
    let customerId = null;
    if (customerPhone && customerPhone.value) {
        try {
            const response = await fetch(`${backendURL}/api/customers/phone/${customerPhone.value}`);
            if (response.ok) {
                const customer = await response.json();
                customerId = customer.id;
                console.log(`🎯 Customer found: ${customer.name}`);
            }
        } catch (error) {
            // Customer not found - continue without customer ID
            console.log('ℹ️ Customer not found, proceeding without customer ID');
        }
    }

    const orderData = {
        customerName: customerName.value,
        customerPhone: customerPhone ? customerPhone.value : '',
        pickupTime: pickupTime.value,
        paymentMethod: paymentMethod.value,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        customerId: customerId
    };

    try {
        console.log('📦 Sending order to server:', orderData);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const order = await response.json();
            let successMessage = 'Order Sent Successfully! We will prepare it shortly.';
            
            // Show loyalty points earned if applicable
            if (order.pointsEarned > 0) {
                successMessage += ` You earned ${order.pointsEarned} loyalty points!`;
            }
            
            showCustomAlert(successMessage);
            console.log('✅ Order sent successfully');
            
            // Reset cart and form
            cart = [];
            updateCartDisplay();
            customerName.value = '';
            if (customerPhone) customerPhone.value = '';
            pickupTime.value = '';
            paymentMethod.selectedIndex = 0;
            document.getElementById('cart-popup').style.display = 'none';
            
            // Clear stored customer info after successful order
            localStorage.removeItem('customerPhone');
            localStorage.removeItem('customerName');
            localStorage.removeItem('customerId');
        } else {
            const error = await response.json();
            showCustomAlert(error.message || 'Failed to send order. Please try again.');
            console.error('❌ Order failed:', error);
        }
    } catch (error) {
        console.error('Error sending order:', error);
        showCustomAlert('Server error. Please check your connection.');
    }
}

/* ============================
   NOTIFICATION SYSTEM
   ============================ */

function initializeNotifications() {
    if (isAdminLoggedIn && authToken) {
        startNotificationPolling();
    }
}

function startNotificationPolling() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
    }
    
    checkForNotifications();
    notificationInterval = setInterval(checkForNotifications, 5000);
    console.log('🔔 Notification polling started');
}

async function checkForNotifications() {
    if (!isAdminLoggedIn || !authToken) return;
    
    try {
        const url = lastNotificationCheck 
            ? `${ADMIN_API_URL}/notifications?since=${lastNotificationCheck}`
            : `${ADMIN_API_URL}/notifications`;
            
        const response = await makeAuthenticatedRequest(url);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.notifications && data.notifications.length > 0) {
                console.log('📢 New notifications:', data.notifications.length);
                
                data.notifications.forEach(notification => {
                    handleNewNotification(notification);
                });
                
                lastNotificationCheck = data.timestamp;
                
                if (document.getElementById('admin-dashboard') && document.getElementById('admin-dashboard').style.display === 'block') {
                    loadDashboardData();
                }
            }
        }
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

function handleNewNotification(notification) {
    console.log('📢 Processing notification:', notification.message);
    playNotificationSound();
    showInAppNotification(notification);
    updateNotificationBadge();
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('🔕 Sound play failed:', error);
    }
}

function showInAppNotification(notification) {
    const notificationEl = document.createElement('div');
    notificationEl.className = 'in-app-notification';
    
    const icon = notification.type === 'new_order' ? '🆕' : '📝';
    
    notificationEl.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 22px; margin-right: 12px;">${icon}</span>
            <strong style="flex: 1; font-size: 16px;">New Order Received!</strong>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 5px;">×</button>
        </div>
        <div style="font-size: 14px; line-height: 1.5; margin-bottom: 8px;">${notification.message}</div>
        <div style="font-size: 12px; opacity: 0.9; display: flex; justify-content: space-between; align-items: center;">
            <span>${formatTime(new Date(notification.timestamp))}</span>
            <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; font-size: 11px;">Click to view</span>
        </div>
    `;
    
    notificationEl.addEventListener('click', function() {
        if (document.getElementById('admin-dashboard') && document.getElementById('admin-dashboard').style.display !== 'block') {
            openDashboard();
        }
        if (document.getElementById('orders-list')) {
            document.getElementById('orders-list').scrollIntoView({ behavior: 'smooth' });
        }
        this.remove();
    });
    
    document.body.appendChild(notificationEl);
    
    setTimeout(() => {
        if (notificationEl.parentNode) {
            notificationEl.style.animation = 'slideOutRight 0.5s ease-in';
            setTimeout(() => {
                if (notificationEl.parentNode) {
                    notificationEl.parentNode.removeChild(notificationEl);
                }
            }, 500);
        }
    }, 8000);
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

function updateNotificationBadge() {
    unreadNotifications++;
    
    let badge = document.getElementById('notification-badge');
    if (!badge) {
        const adminToggle = document.getElementById('admin-toggle');
        if (!adminToggle) return;
        
        badge = document.createElement('div');
        badge.id = 'notification-badge';
        badge.className = 'notification-badge';
        adminToggle.appendChild(badge);
    }
    
    badge.textContent = unreadNotifications > 9 ? '9+' : unreadNotifications;
    badge.style.display = 'flex';
}

function clearNotifications() {
    unreadNotifications = 0;
    const badge = document.getElementById('notification-badge');
    if (badge) {
        badge.style.display = 'none';
    }
    
    if (isAdminLoggedIn) {
        makeAuthenticatedRequest(`${ADMIN_API_URL}/notifications`, {
            method: 'DELETE'
        }).catch(console.error);
    }
}

/* ============================
   ADMIN DASHBOARD LOGIC
   ============================ */

function toggleAdminLogin() {
    if(isAdminLoggedIn) {
        openDashboard();
    } else {
        document.getElementById('login-modal').style.display = 'flex';
        console.log('🔓 Login modal opened');
    }
}

async function adminLogin() {
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    if(!username || !password) {
        showCustomAlert('Please enter username and password');
        return;
    }

    try {
        console.log('🔐 Attempting admin login...');
        const response = await fetch(`${ADMIN_API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            isAdminLoggedIn = true;
            
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('admin-username').value = '';
            document.getElementById('admin-password').value = '';
            
            updateAdminUI();
            initializeNotifications();
            
            // Enable push notifications after successful login
            await initializePushNotifications();
            
            openDashboard();
            showCustomAlert('Login successful! Mobile notifications enabled!');
            console.log('✅ Admin login successful');
        } else {
            const error = await response.json();
            showCustomAlert(error.message || 'Login failed. Please check your credentials.');
            console.log('❌ Admin login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showCustomAlert('Network error. Please try again.');
    }
}

async function openDashboard() {
    if (!isAdminLoggedIn) {
        document.getElementById('login-modal').style.display = 'flex';
        return;
    }

    document.getElementById('admin-dashboard').style.display = 'block';
    initializeNotifications();
    clearNotifications();
    
    try {
        await loadDashboardData();
        console.log('📊 Dashboard opened successfully');
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showCustomAlert('Error loading dashboard data. Check console for details.');
    }
}

async function loadDashboardData() {
    try {
        const statsResponse = await makeAuthenticatedRequest(`${ADMIN_API_URL}/stats`);
        
        if (!statsResponse.ok) {
            throw new Error(`Stats API error: ${statsResponse.status}`);
        }
        
        const stats = await statsResponse.json();
        
        document.getElementById('total-orders').textContent = stats.totalOrders || 0;
        document.getElementById('total-sales').textContent = `${currencySymbol}${(stats.totalSales || 0).toFixed(0)}`;
        document.getElementById('today-orders').textContent = stats.todayOrders || 0;
        document.getElementById('today-sales').textContent = `${currencySymbol}${(stats.todaySales || 0).toFixed(0)}`;

        const ordersResponse = await makeAuthenticatedRequest(API_URL);
        
        if (!ordersResponse.ok) {
            throw new Error(`Orders API error: ${ordersResponse.status}`);
        }
        
        orders = await ordersResponse.json();
        updateOrdersList(orders);
        updateSalesChart(orders);
        
        // Add availability controls to admin dashboard
        addAvailabilityControlsToAdmin();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (error.message === 'Session expired') {
            showCustomAlert('Session expired. Please login again.');
        } else {
            throw error;
        }
    }
}

function updateOrdersList(ordersData) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
    if(ordersData.length === 0) {
        ordersList.innerHTML = '<p style="text-align:center;color:#666;padding:30px;font-style:italic;">No orders yet. Orders will appear here when customers place them.</p>';
    } else {
        ordersData.forEach(order => {
            const isCompleted = order.status === 'completed';
            
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            if(isCompleted) {
                orderItem.style.borderLeft = '5px solid #28a745';
                orderItem.style.background = '#f8fff9';
            }
            
            // Show customer info and loyalty points if available
            const customerInfo = order.customerId ? 
                `<div style="font-size: 0.8em; color: #666; margin-bottom: 5px;">
                    📱 ${order.customerPhone || 'Registered Customer'}
                    ${order.pointsEarned ? ` • ⭐ +${order.pointsEarned} points` : ''}
                </div>` : '';
            
            orderItem.innerHTML = `
                <div class="order-header">
                    <span class="order-customer">${order.customerName} 
                        <span style="font-size:0.8em; color:${isCompleted ? '#28a745' : '#ff6b00'};">(${order.status})</span>
                    </span>
                    <span class="order-time">${formatDate(order.timestamp)}</span>
                </div>
                ${customerInfo}
                <div class="order-details">
                    ${order.items.map(item => `${item.quantity}x ${item.name} - ${currencySymbol}${(item.price * item.quantity).toFixed(0)}`).join('<br>')}
                </div>
                <div class="order-total">Total: ${currencySymbol}${order.total.toFixed(0)}</div>
                <div class="order-payment">Payment: ${order.paymentMethod}</div>
                <div class="order-pickup">Pickup: ${order.pickupTime}</div>
                <div class="order-actions">
                    ${!isCompleted ? `<button class="complete-btn" onclick="completeOrder('${order._id}')">Complete</button>` : ''}
                    <button class="delete-btn" onclick="deleteOrder('${order._id}')">Delete</button>
                </div>
            `;
            ordersList.appendChild(orderItem);
        });
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

async function completeOrder(orderId) {
    try {
        await makeAuthenticatedRequest(`${API_URL}/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'completed' })
        });
        await loadDashboardData();
        showCustomAlert('Order marked as completed!');
        console.log(`✅ Order ${orderId} marked as completed`);
    } catch (error) {
        showCustomAlert('Error updating order');
        console.error('❌ Error completing order:', error);
    }
}

async function deleteOrder(orderId) {
    if(confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        try {
            await makeAuthenticatedRequest(`${API_URL}/${orderId}`, {
                method: 'DELETE'
            });
            await loadDashboardData();
            showCustomAlert('Order deleted successfully!');
            console.log(`🗑️ Order ${orderId} deleted`);
        } catch (error) {
            showCustomAlert('Error deleting order');
            console.error('❌ Error deleting order:', error);
        }
    }
}

function updateSalesChart(data) {
    const ctx = document.getElementById('sales-chart');
    if (!ctx) return;
    
    const canvas = ctx.getContext('2d');
    
    const last7Days = [];
    for(let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }
    
    const dailySales = last7Days.map(date => {
        const dayOrders = data.filter(order => {
            const orderDate = new Date(order.timestamp).toISOString().split('T')[0];
            return orderDate === date;
        });
        return dayOrders.reduce((sum, order) => sum + order.total, 0);
    });
    
    if(window.salesChart) {
        window.salesChart.destroy();
    }
    
    window.salesChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: last7Days.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
            }),
            datasets: [{
                label: 'Daily Sales (₱)',
                data: dailySales,
                backgroundColor: '#ffcc00',
                borderColor: '#8b4513',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        callback: function(value) { return currencySymbol + value; },
                        font: {
                            family: 'Roboto'
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Roboto'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: 'Roboto',
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

function closeDashboard() {
    document.getElementById('admin-dashboard').style.display = 'none';
    console.log('🚪 Dashboard closed');
}

// Utility: Custom Alert
function showCustomAlert(message) {
    console.log('💬 Alert:', message);
    const alertBox = document.getElementById('custom-alert');
    if(alertBox) {
        document.getElementById('custom-alert-message').textContent = message;
        alertBox.style.display = 'flex';
    } else {
        alert(message);
    }
}

// Navigation functions
function navigateTo(page) {
    // Save cart to localStorage before navigating
    saveCartToStorage();
    window.location.href = page;
}

function goBack() {
    navigateTo('index.html');
}

// Make functions globally available
window.addToCart = addToCart;
window.changeQuantity = changeQuantity;
window.toggleCart = toggleCart;
window.checkout = checkout;
window.toggleAdminLogin = toggleAdminLogin;
window.adminLogin = adminLogin;
window.closeDashboard = closeDashboard;
window.completeOrder = completeOrder;
window.deleteOrder = deleteOrder;
window.showCustomerRegistration = showCustomerRegistration;
window.showCustomerLogin = showCustomerLogin;
window.customerLogin = customerLogin;
window.closeCurrentModal = closeCurrentModal;
window.switchToLogin = switchToLogin;
window.switchToRegistration = switchToRegistration;
window.registerCustomer = registerCustomer;
window.lookupCustomer = lookupCustomer;
window.navigateTo = navigateTo;
window.goBack = goBack;
window.toggleItemAvailability = toggleItemAvailability;




