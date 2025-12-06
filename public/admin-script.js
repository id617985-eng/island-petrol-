// ================================
// ADMIN PANEL SCRIPT
// All admin-specific functionality
// ================================

const ADMIN_API_URL = 'https://aifoodies.up.railway.app/api';
let adminToken = localStorage.getItem('adminToken');
let adminRole = localStorage.getItem('adminRole') || 'admin';
let currentSection = 'dashboard';
let superAdminSettings = JSON.parse(localStorage.getItem('superAdminSettings') || '{"showAdminButton": true}');
let currentEditingSlideId = null;
let currentEditingProductId = null;

// Menu items data - Load from localStorage or use default
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
        console.log('No admin token found, redirecting to login');
        showLoginModal();
        return;
    }
    
    // Load menu items
    loadMenuItemsFromStorage();
    
    // Initialize admin panel
    initializeAdminPanel();
    
    // Setup real-time order listener
    setupOrderListener();
    
    // Setup ALL event listeners
    setupAdminEventListeners();
});

function loadMenuItemsFromStorage() {
    const storedItems = localStorage.getItem('menuItems');
    if (storedItems) {
        menuItems = JSON.parse(storedItems);
    } else {
        // Default items if none in storage
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

// Save menu items to localStorage
function saveMenuItemsToStorage() {
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
}

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
    
    // Remove existing modal if any
    const existingModal = document.getElementById('admin-login-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners immediately
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
    
    // Enter key to login
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAdminModalLogin('admin');
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
    
    // Simulate login process
    if (role === 'admin') {
        localStorage.setItem('adminToken', 'demo_admin_token_123');
        localStorage.setItem('adminRole', 'admin');
    } else {
        localStorage.setItem('adminToken', 'demo_superadmin_token_456');
        localStorage.setItem('adminRole', 'superadmin');
    }
    
    // Update global variables
    adminToken = localStorage.getItem('adminToken');
    adminRole = localStorage.getItem('adminRole');
    
    // Remove modal
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.remove();
    
    // Show success message
    showAlert(`✅ Welcome, ${role === 'superadmin' ? 'SuperAdmin' : 'Admin'}!`);
    
    // Reload the page to initialize everything
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

function initializeAdminPanel() {
    console.log('Initializing admin panel for:', adminRole);
    
    // Show superadmin features if applicable
    if (adminRole === 'superadmin') {
        showSuperAdminFeatures();
    }
    
    // Load initial dashboard
    loadAdminDashboard();
}

// ================================
// EVENT LISTENERS SETUP - FIXED VERSION
// ================================

function setupAdminEventListeners() {
    console.log('Setting up admin event listeners');
    
    // Back to store button
    const backToStore = document.getElementById('back-to-store');
    if (backToStore) {
        backToStore.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminRole');
                window.location.href = 'index.html';
            }
        });
    }
    
    // Navigation buttons - Use event delegation
    const adminNav = document.querySelector('.admin-nav');
    if (adminNav) {
        adminNav.addEventListener('click', function(e) {
            const navBtn = e.target.closest('.admin-nav-btn');
            if (navBtn && navBtn.hasAttribute('data-section')) {
                const sectionId = navBtn.getAttribute('data-section');
                showSection(sectionId);
            }
        });
    }
    
    // View all orders button
    const viewAllOrders = document.getElementById('view-all-orders');
    if (viewAllOrders) {
        viewAllOrders.addEventListener('click', function() {
            showSection('orders');
        });
    }
    
    // Refresh orders button
    const refreshOrders = document.getElementById('refresh-orders');
    if (refreshOrders) {
        refreshOrders.addEventListener('click', function() {
            loadRealOrders();
            showAlert('Orders refreshed!', 'success');
        });
    }
    
    // Availability buttons
    const resetAllAvailabilityBtn = document.getElementById('reset-all-availability');
    if (resetAllAvailabilityBtn) {
        resetAllAvailabilityBtn.addEventListener('click', resetAllAvailability);
    }
    
    const toggleAllAvailabilityBtn = document.getElementById('toggle-all-availability');
    if (toggleAllAvailabilityBtn) {
        toggleAllAvailabilityBtn.addEventListener('click', toggleAllAvailability);
    }
    
    const saveAvailabilityBtn = document.getElementById('save-availability');
    if (saveAvailabilityBtn) {
        saveAvailabilityBtn.addEventListener('click', function() {
            showAlert('Availability changes saved!', 'success');
        });
    }
    
    // Slideshow buttons
    setupSlideshowEventListeners();
    
    // Order filters
    const orderFilter = document.getElementById('order-filter');
    if (orderFilter) {
        orderFilter.addEventListener('change', function() {
            currentOrdersFilter = this.value;
            filterOrders();
        });
    }
    
    const orderSearch = document.getElementById('order-search');
    if (orderSearch) {
        orderSearch.addEventListener('input', searchOrders);
    }
    
    // Export orders button
    const exportOrders = document.getElementById('export-orders');
    if (exportOrders) {
        exportOrders.addEventListener('click', function() {
            showAlert('Export feature would download orders as CSV file.', 'info');
        });
    }
    
    // Products buttons
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', showAddProductModal);
    }
    
    const refreshProducts = document.getElementById('refresh-products');
    if (refreshProducts) {
        refreshProducts.addEventListener('click', function() {
            loadProducts();
            showAlert('Products refreshed!', 'success');
        });
    }
    
    // Custom alert OK button
    const customAlertOk = document.getElementById('custom-alert-ok');
    if (customAlertOk) {
        customAlertOk.addEventListener('click', function() {
            document.getElementById('custom-alert').style.display = 'none';
        });
    }
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Add product modal buttons
    const saveProductBtn = document.getElementById('save-product-btn');
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', saveProduct);
    }
    
    const cancelAddProduct = document.getElementById('cancel-add-product');
    if (cancelAddProduct) {
        cancelAddProduct.addEventListener('click', function() {
            document.getElementById('add-product-modal').style.display = 'none';
            currentEditingProductId = null;
        });
    }
    
    // Order details modal buttons
    const closeOrderDetails = document.getElementById('close-order-details');
    if (closeOrderDetails) {
        closeOrderDetails.addEventListener('click', function() {
            document.getElementById('order-details-modal').style.display = 'none';
        });
    }
    
    // Setup event listeners for dynamically added elements
    setupDynamicEventListeners();
}

function setupSlideshowEventListeners() {
    console.log('Setting up slideshow event listeners');
    
    // Add slide button
    const addSlideBtn = document.getElementById('add-slide-btn');
    if (addSlideBtn) {
        addSlideBtn.addEventListener('click', showMenuItemsSelectionModal);
    }
    
    // Refresh slideshow button
    const refreshSlideshowBtn = document.getElementById('refresh-slideshow');
    if (refreshSlideshowBtn) {
        refreshSlideshowBtn.addEventListener('click', function() {
            loadSlideshow();
            showAlert('Slideshow refreshed!', 'success');
        });
    }
    
    // Reorder slides button
    const reorderSlidesBtn = document.getElementById('reorder-slides');
    if (reorderSlidesBtn) {
        reorderSlidesBtn.addEventListener('click', function() {
            showAlert('Drag and drop slides to reorder them. This feature requires additional implementation.', 'info');
        });
    }
}

function setupDynamicEventListeners() {
    // This will be called after loading dynamic content
    setTimeout(() => {
        // Superadmin settings buttons
        const saveSuperAdminBtn = document.getElementById('save-superadmin-settings');
        if (saveSuperAdminBtn) {
            saveSuperAdminBtn.addEventListener('click', saveSuperadminSettings);
        }
        
        const toggleAdminButton = document.getElementById('toggle-admin-button');
        if (toggleAdminButton) {
            toggleAdminButton.addEventListener('change', function() {
                superAdminSettings.showAdminButton = this.checked;
            });
        }
        
        const viewAccessLog = document.getElementById('view-access-log');
        if (viewAccessLog) {
            viewAccessLog.addEventListener('click', viewAccessLogFunc);
        }
        
        const resetSuperadminSettings = document.getElementById('reset-superadmin-settings');
        if (resetSuperadminSettings) {
            resetSuperadminSettings.addEventListener('click', resetSuperadminSettingsFunc);
        }
        
        // Setup availability toggle switches
        document.querySelectorAll('.toggle-switch input').forEach(checkbox => {
            if (!checkbox.hasAttribute('data-event-bound')) {
                checkbox.setAttribute('data-event-bound', 'true');
                checkbox.addEventListener('change', function() {
                    const itemName = this.getAttribute('data-item');
                    const available = this.checked;
                    if (itemName) {
                        updateAvailability(itemName, available);
                    }
                });
            }
        });
    }, 500);
}

// ================================
// SUPERADMIN FEATURES
// ================================

function showSuperAdminFeatures() {
    // Update admin panel title
    const adminPanelTitle = document.querySelector('.admin-panel-title');
    if (adminPanelTitle && adminRole === 'superadmin') {
        adminPanelTitle.innerHTML = '<i class="fas fa-crown"></i> SuperAdmin Panel';
    }
    
    // Show admin role badge
    const adminRoleBadge = document.getElementById('admin-role-badge');
    if (adminRoleBadge) {
        adminRoleBadge.innerHTML = adminRole === 'superadmin' ? 
            '<i class="fas fa-crown"></i> SuperAdmin' : 
            '<i class="fas fa-user-shield"></i> Admin';
        adminRoleBadge.style.display = 'inline-block';
    }
    
    // Add superadmin section if it doesn't exist
    if (adminRole === 'superadmin') {
        addSuperAdminSection();
    }
}

function addSuperAdminSection() {
    // Check if superadmin section already exists
    if (document.getElementById('superadmin-section')) return;
    
    // Create superadmin section
    const superAdminHTML = `
        <div id="superadmin-section" class="admin-section">
            <div class="admin-section-header">
                <h2><i class="fas fa-crown"></i> SuperAdmin Settings</h2>
                <p>Manage global settings and permissions</p>
            </div>
            
            <div class="admin-section-content">
                <div class="settings-card">
                    <h3><i class="fas fa-toggle-on"></i> Site Settings</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Show Admin Button on Homepage</h4>
                            <p>Toggle visibility of the admin button on the customer homepage</p>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="toggle-admin-button" ${superAdminSettings.showAdminButton ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Maintenance Mode</h4>
                            <p>Enable maintenance mode to temporarily disable orders</p>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="maintenance-mode" ${superAdminSettings.maintenanceMode ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Site Theme</h4>
                            <p>Change the color theme of the website</p>
                        </div>
                        <div class="setting-control">
                            <select id="site-theme">
                                <option value="default" ${superAdminSettings.siteTheme === 'default' ? 'selected' : ''}>Default (Brown)</option>
                                <option value="orange" ${superAdminSettings.siteTheme === 'orange' ? 'selected' : ''}>Orange</option>
                                <option value="green" ${superAdminSettings.siteTheme === 'green' ? 'selected' : ''}>Green</option>
                                <option value="blue" ${superAdminSettings.siteTheme === 'blue' ? 'selected' : ''}>Blue</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Admin Access Log</h4>
                            <p>View recent admin login activity</p>
                        </div>
                        <div class="setting-control">
                            <button id="view-access-log" class="action-btn secondary">View Log</button>
                        </div>
                    </div>
                    
                    <div class="setting-actions">
                        <button id="save-superadmin-settings" class="action-btn primary">
                            <i class="fas fa-save"></i> Save Settings
                        </button>
                        <button id="reset-superadmin-settings" class="action-btn secondary">
                            <i class="fas fa-undo"></i> Reset to Default
                        </button>
                    </div>
                </div>
                
                <div class="settings-card">
                    <h3><i class="fas fa-users-cog"></i> User Management</h3>
                    
                    <div class="user-list">
                        <div class="user-item">
                            <div class="user-info">
                                <i class="fas fa-user-shield"></i>
                                <div>
                                    <h4>SuperAdmin</h4>
                                    <p>Full system access</p>
                                </div>
                            </div>
                            <span class="user-role superadmin">SuperAdmin</span>
                        </div>
                        
                        <div class="user-item">
                            <div class="user-info">
                                <i class="fas fa-user-tie"></i>
                                <div>
                                    <h4>Admin User</h4>
                                    <p>Regular admin access</p>
                                </div>
                            </div>
                            <span class="user-role admin">Admin</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add to admin sections container
    const adminSections = document.querySelector('.admin-sections');
    if (adminSections) {
        adminSections.insertAdjacentHTML('beforeend', superAdminHTML);
    }
    
    // Add superadmin to navigation
    const adminNav = document.querySelector('.admin-nav');
    if (adminNav) {
        const superadminNavBtn = document.createElement('button');
        superadminNavBtn.className = 'admin-nav-btn';
        superadminNavBtn.setAttribute('data-section', 'superadmin');
        superadminNavBtn.innerHTML = '<i class="fas fa-crown"></i> SuperAdmin';
        adminNav.appendChild(superadminNavBtn);
    }
    
    // Setup dynamic event listeners for newly added elements
    setupDynamicEventListeners();
}

function saveSuperadminSettings() {
    // Get current settings
    const toggleAdminButton = document.getElementById('toggle-admin-button');
    const maintenanceMode = document.getElementById('maintenance-mode');
    const siteTheme = document.getElementById('site-theme');
    
    // Update settings object
    superAdminSettings = {
        showAdminButton: toggleAdminButton ? toggleAdminButton.checked : true,
        maintenanceMode: maintenanceMode ? maintenanceMode.checked : false,
        siteTheme: siteTheme ? siteTheme.value : 'default'
    };
    
    // Save to localStorage
    localStorage.setItem('superAdminSettings', JSON.stringify(superAdminSettings));
    
    showAlert('✅ Superadmin settings saved! Changes will apply on the homepage.', 'success');
    
    // Log the change
    logSuperadminAction('Settings updated');
}

function resetSuperadminSettingsFunc() {
    if (confirm('Reset all superadmin settings to default?')) {
        superAdminSettings = {
            showAdminButton: true,
            maintenanceMode: false,
            siteTheme: 'default'
        };
        
        // Update UI
        const toggleAdminButton = document.getElementById('toggle-admin-button');
        const maintenanceMode = document.getElementById('maintenance-mode');
        const siteTheme = document.getElementById('site-theme');
        
        if (toggleAdminButton) toggleAdminButton.checked = true;
        if (maintenanceMode) maintenanceMode.checked = false;
        if (siteTheme) siteTheme.value = 'default';
        
        showAlert('✅ Settings reset to default', 'success');
        logSuperadminAction('Settings reset to default');
    }
}

function viewAccessLogFunc() {
    const logEntries = [
        {
            timestamp: new Date().toLocaleString(),
            user: adminRole === 'superadmin' ? 'SuperAdmin' : 'Admin',
            action: 'Viewed access log',
            ip: '192.168.1.1'
        },
        {
            timestamp: new Date(Date.now() - 3600000).toLocaleString(),
            user: 'Admin',
            action: 'Logged in',
            ip: '192.168.1.2'
        },
        {
            timestamp: new Date(Date.now() - 86400000).toLocaleString(),
            user: 'SuperAdmin',
            action: 'Updated settings',
            ip: '192.168.1.1'
        }
    ];
    
    let logHTML = '<h3>Admin Access Log</h3>';
    logHTML += '<div class="access-log">';
    logEntries.forEach(entry => {
        logHTML += `
            <div class="log-entry">
                <div class="log-header">
                    <span class="log-user ${entry.user.toLowerCase()}">
                        <i class="fas fa-user${entry.user === 'SuperAdmin' ? '-shield' : ''}"></i> ${entry.user}
                    </span>
                    <span class="log-time">${entry.timestamp}</span>
                </div>
                <div class="log-body">
                    <p>${entry.action}</p>
                    <small>IP: ${entry.ip}</small>
                </div>
            </div>
        `;
    });
    logHTML += '</div>';
    
    showAlert(logHTML, 'info');
}

function logSuperadminAction(action) {
    console.log(`Superadmin action: ${action} by ${adminRole} at ${new Date().toLocaleString()}`);
}

// ================================
// NAVIGATION FUNCTIONS
// ================================

function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Update current section
    currentSection = sectionId;
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    const sectionElement = document.getElementById(`${sectionId}-section`);
    if (sectionElement) {
        sectionElement.classList.add('active');
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
        case 'superadmin':
            // Superadmin section is already loaded
            break;
    }
}

// ================================
// DASHBOARD FUNCTIONS
// ================================

async function loadAdminDashboard() {
    try {
        console.log('Loading dashboard...');
        
        // Load real orders first
        await loadRealOrders();
        
        // Update chart with real data
        updateSalesChartWithRealData();
        
        // Load recent orders from real data
        loadRecentRealOrders();
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

// ================================
// REAL-TIME ORDERS FUNCTIONS
// ================================

// Function to fetch real orders from localStorage
async function loadRealOrders() {
    try {
        console.log('Loading real orders...');
        
        // Get orders from localStorage (where script.js saves them)
        const storedOrders = localStorage.getItem('customerOrders');
        if (storedOrders) {
            realOrders = JSON.parse(storedOrders);
        } else {
            realOrders = [];
        }
        
        // Also check for single recent order
        const recentOrder = localStorage.getItem('lastOrder');
        if (recentOrder) {
            const parsedOrder = JSON.parse(recentOrder);
            if (!realOrders.some(o => o._id === parsedOrder._id || o.id === parsedOrder.id)) {
                realOrders.push(parsedOrder);
                // Save back to localStorage
                localStorage.setItem('customerOrders', JSON.stringify(realOrders));
            }
        }
        
        // Update orders summary
        updateOrdersSummary(realOrders);
        
        // Render orders list with filter
        filterOrders();
        
        // Update dashboard stats
        updateDashboardWithRealOrders();
        
        return realOrders;
    } catch (error) {
        console.error('Error loading real orders:', error);
        return [];
    }
}

// Function to update dashboard with real orders
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
    const totalOrdersEl = document.getElementById('total-orders');
    const totalSalesEl = document.getElementById('total-sales');
    const todayOrdersEl = document.getElementById('today-orders');
    const todaySalesEl = document.getElementById('today-sales');
    
    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (totalSalesEl) totalSalesEl.textContent = `₱${totalSales.toFixed(2)}`;
    if (todayOrdersEl) todayOrdersEl.textContent = todayOrdersCount;
    if (todaySalesEl) todaySalesEl.textContent = `₱${todaySales.toFixed(2)}`;
}

// Function to listen for new orders (using localStorage events)
function setupOrderListener() {
    // Listen for storage events (when new orders are added from other tabs)
    window.addEventListener('storage', function(e) {
        if (e.key === 'customerOrders' || e.key === 'lastOrder') {
            console.log('New order detected via storage event');
            loadRealOrders();
        }
    });
    
    // Poll for new orders every 5 seconds
    if (orderUpdateInterval) clearInterval(orderUpdateInterval);
    orderUpdateInterval = setInterval(() => {
        if (currentSection === 'dashboard' || currentSection === 'orders') {
            loadRealOrders();
        }
    }, 5000);
    
    // Also check when switching to orders section
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && (currentSection === 'orders' || currentSection === 'dashboard')) {
            loadRealOrders();
        }
    });
}

// Update sales chart with real data
function updateSalesChartWithRealData() {
    const ctx = document.getElementById('sales-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    // Get canvas context
    const canvas = ctx.getContext('2d');
    
    // Generate sales data from real orders
    const salesData = generateSalesDataFromOrders(realOrders);
    
    window.salesChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Daily Sales (₱)',
                data: salesData,
                borderColor: '#FF6A00',
                backgroundColor: 'rgba(255, 106, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `₱${context.parsed.y.toFixed(2)}`;
                        }
                    }
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

// Generate sales data from real orders
function generateSalesDataFromOrders(orders) {
    // Default data (if no orders)
    let data = [0, 0, 0, 0, 0, 0, 0];
    
    if (orders.length > 0) {
        // Group orders by day of week
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const salesByDay = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
        
        orders.forEach(order => {
            if (order.timestamp || order.orderTime) {
                const date = new Date(order.timestamp || order.orderTime);
                const day = days[date.getDay()];
                salesByDay[day] += order.total || 0;
            }
        });
        
        // Convert to array in correct order (Mon-Sun)
        data = [
            salesByDay.Mon,
            salesByDay.Tue,
            salesByDay.Wed,
            salesByDay.Thu,
            salesByDay.Fri,
            salesByDay.Sat,
            salesByDay.Sun
        ];
    }
    
    return data;
}

// Load recent orders from real data
function loadRecentRealOrders() {
    const ordersList = document.getElementById('recent-orders-list');
    if (!ordersList) return;
    
    // Sort orders by timestamp (newest first)
    const sortedOrders = [...realOrders].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.orderTime || 0);
        const timeB = new Date(b.timestamp || b.orderTime || 0);
        return timeB - timeA;
    });
    
    // Take only 3 most recent orders
    const recentOrders = sortedOrders.slice(0, 3);
    
    if (recentOrders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>No Recent Orders</h3>
                <p>Orders will appear here when customers place them</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = recentOrders.map(order => `
        <div class="order-preview-item" onclick="showRealOrderDetails('${order._id || order.id || ''}')">
            <div class="order-preview-header">
                <span class="order-id">#${(order._id || order.id || '').substring(0, 8)}</span>
                <span class="order-status ${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span>
            </div>
            <div class="order-preview-details">
                <div class="customer-name">${order.customerName || order.name || 'Guest'}</div>
                <div class="order-amount">₱${(order.total || 0).toFixed(2)}</div>
            </div>
            <div class="order-items">
                ${order.items ? order.items.slice(0, 2).map(item => 
                    `${item.name} x${item.quantity}`
                ).join(', ') : 'No items'}
                ${order.items && order.items.length > 2 ? `... +${order.items.length - 2} more` : ''}
            </div>
        </div>
    `).join('');
}

// Show real order details
function showRealOrderDetails(orderId) {
    const order = realOrders.find(o => o._id === orderId || o.id === orderId);
    if (!order) {
        showAlert('Order not found!', 'error');
        return;
    }
    
    let details = `
        <h3>Order #${orderId.substring(0, 8)}</h3>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0;">
            <p><strong>Customer:</strong> ${order.customerName || order.name || 'Guest'}</p>
            <p><strong>Phone:</strong> ${order.customerPhone || order.phone || 'N/A'}</p>
            <p><strong>Pickup Time:</strong> ${order.pickupTime || 'ASAP'}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Cash on Pick-up'}</p>
            <p><strong>Status:</strong> <span class="order-status ${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span></p>
            <p><strong>Total:</strong> ₱${(order.total || 0).toFixed(2)}</p>
        </div>
        
        <h4>Items:</h4>
        <div style="max-height: 200px; overflow-y: auto; margin: 10px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #e9ecef;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            details += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">₱${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        details += `
            <tr>
                <td colspan="3" style="padding: 20px; text-align: center; color: #6c757d;">No items in this order</td>
            </tr>
        `;
    }
    
    details += `
                </tbody>
                <tfoot>
                    <tr style="background: #f8f9fa;">
                        <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                        <td style="padding: 10px; text-align: right; font-weight: bold;">₱${(order.total || 0).toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    // Show in modal
    const orderDetailsContent = document.getElementById('order-details-content');
    const orderModal = document.getElementById('order-details-modal');
    
    if (orderDetailsContent && orderModal) {
        orderDetailsContent.innerHTML = details;
        orderModal.style.display = 'flex';
        
        // Update order status button
        const updateOrderStatusBtn = document.getElementById('update-order-status');
        if (updateOrderStatusBtn) {
            updateOrderStatusBtn.onclick = function() {
                updateOrderStatus(orderId);
            };
        }
    } else {
        showAlert(details, 'info');
    }
}

// Update order status
function updateOrderStatus(orderId) {
    const order = realOrders.find(o => o._id === orderId || o.id === orderId);
    if (!order) return;
    
    const currentStatus = order.status || 'pending';
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];
    
    // Update order status
    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();
    
    // Save back to localStorage
    localStorage.setItem('customerOrders', JSON.stringify(realOrders));
    
    // Refresh orders display
    loadRealOrders();
    
    // Close modal
    document.getElementById('order-details-modal').style.display = 'none';
    
    showAlert(`✅ Order status updated to: ${nextStatus.toUpperCase()}`, 'success');
}

// Filter orders
function filterOrders() {
    let filteredOrders = [...realOrders];
    
    // Apply status filter
    if (currentOrdersFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => 
            (order.status || 'pending') === currentOrdersFilter
        );
    }
    
    // Apply date filter
    const dateFilter = document.getElementById('order-date');
    if (dateFilter && dateFilter.value) {
        const selectedDate = new Date(dateFilter.value).toDateString();
        filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.timestamp || order.orderTime || Date.now()).toDateString();
            return orderDate === selectedDate;
        });
    }
    
    // Render filtered orders
    renderOrdersList(filteredOrders);
}

function searchOrders() {
    const searchInput = document.getElementById('order-search');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filterOrders();
        return;
    }
    
    let filteredOrders = [...realOrders];
    
    // Apply status filter first
    if (currentOrdersFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => 
            (order.status || 'pending') === currentOrdersFilter
        );
    }
    
    // Then apply search filter
    filteredOrders = filteredOrders.filter(order => {
        const customerName = (order.customerName || order.name || '').toLowerCase();
        const orderId = (order._id || order.id || '').toLowerCase();
        const phone = (order.customerPhone || order.phone || '').toLowerCase();
        
        return customerName.includes(searchTerm) || 
               orderId.includes(searchTerm) ||
               phone.includes(searchTerm);
    });
    
    renderOrdersList(filteredOrders);
}

function renderOrdersList(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    // Sort orders by timestamp (newest first)
    orders.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.orderTime || 0);
        const timeB = new Date(b.timestamp || b.orderTime || 0);
        return timeB - timeA;
    });
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>No Orders Found</h3>
                <p>${currentOrdersFilter !== 'all' ? `No ${currentOrdersFilter} orders` : 'No orders yet'}</p>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = orders.map(order => {
        const orderId = order._id || order.id || `order_${Date.now()}`;
        const orderTime = new Date(order.timestamp || order.orderTime || Date.now());
        const formattedTime = orderTime.toLocaleString();
        const status = order.status || 'pending';
        
        return `
            <div class="order-item" onclick="showRealOrderDetails('${orderId}')">
                <div class="order-header">
                    <div>
                        <div class="order-title">Order #${orderId.substring(0, 8)}</div>
                        <div class="order-time">${formattedTime}</div>
                    </div>
                    <span class="order-status ${status}">${status.toUpperCase()}</span>
                </div>
                <div class="order-details">
                    <div class="detail-item">
                        <div class="detail-label">Customer</div>
                        <div class="detail-value">${order.customerName || order.name || 'Guest'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">${order.customerPhone || order.phone || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Pickup Time</div>
                        <div class="detail-value">${order.pickupTime || 'ASAP'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Total</div>
                        <div class="detail-value">₱${(order.total || 0).toFixed(2)}</div>
                    </div>
                </div>
                <div class="order-footer">
                    <div class="order-items-list">
                        ${order.items ? order.items.slice(0, 3).map(item => 
                            `${item.name} x${item.quantity}`
                        ).join(', ') : 'No items'}
                        ${order.items && order.items.length > 3 ? `... +${order.items.length - 3} more` : ''}
                    </div>
                    <div class="order-payment-method">
                        ${order.paymentMethod || 'Cash on Pick-up'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateOrdersSummary(orders) {
    const total = orders.length;
    const pending = orders.filter(o => (o.status || 'pending') === 'pending').length;
    const processing = orders.filter(o => (o.status || 'pending') === 'processing').length;
    const completed = orders.filter(o => (o.status || 'pending') === 'completed').length;
    const cancelled = orders.filter(o => (o.status || 'pending') === 'cancelled').length;
    
    const summaryTotal = document.getElementById('summary-total');
    const summaryPending = document.getElementById('summary-pending');
    const summaryProcessing = document.getElementById('summary-processing');
    const summaryCompleted = document.getElementById('summary-completed');
    const summaryCancelled = document.getElementById('summary-cancelled');
    
    if (summaryTotal) summaryTotal.textContent = total;
    if (summaryPending) summaryPending.textContent = pending;
    if (summaryProcessing) summaryProcessing.textContent = processing;
    if (summaryCompleted) summaryCompleted.textContent = completed;
    if (summaryCancelled) summaryCancelled.textContent = cancelled;
}

// ================================
// AVAILABILITY FUNCTIONS
// ================================

async function loadAvailabilityControls() {
    console.log('Loading availability controls...');
    
    // Load current availability from localStorage
    const availability = JSON.parse(localStorage.getItem('itemAvailability') || '{}');
    
    // Render nachos items
    const nachosContainer = document.getElementById('nachos-availability');
    if (nachosContainer && menuItems.nachos) {
        if (menuItems.nachos.length === 0) {
            nachosContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No nachos items found</p>';
        } else {
            nachosContainer.innerHTML = menuItems.nachos.map(item => {
                const isAvailable = availability[item.name] !== false; // Default to true if not set
                return `
                    <div class="availability-item">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">₱${item.price}</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                   ${isAvailable ? 'checked' : ''}
                                   data-item="${item.name}"
                                   data-event-bound="true">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Render dessert items
    const dessertsContainer = document.getElementById('desserts-availability');
    if (dessertsContainer && menuItems.desserts) {
        if (menuItems.desserts.length === 0) {
            dessertsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No dessert items found</p>';
        } else {
            dessertsContainer.innerHTML = menuItems.desserts.map(item => {
                const isAvailable = availability[item.name] !== false; // Default to true if not set
                return `
                    <div class="availability-item">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">₱${item.price}</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                   ${isAvailable ? 'checked' : ''}
                                   data-item="${item.name}"
                                   data-event-bound="true">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Setup event listeners for toggle switches
    setupDynamicEventListeners();
}

async function updateAvailability(itemName, available) {
    console.log(`Updating ${itemName} availability to: ${available}`);
    
    // Update localStorage
    let availability = JSON.parse(localStorage.getItem('itemAvailability') || '{}');
    availability[itemName] = available;
    localStorage.setItem('itemAvailability', JSON.stringify(availability));
    
    // Update menu items
    for (let category in menuItems) {
        const itemIndex = menuItems[category].findIndex(item => item.name === itemName);
        if (itemIndex !== -1) {
            menuItems[category][itemIndex].isAvailable = available;
            break;
        }
    }
    
    // Save updated menu items
    saveMenuItemsToStorage();
    
    showAlert(`${itemName} is now ${available ? 'available' : 'out of stock'}`, 'success');
}

async function resetAllAvailability() {
    if (!confirm('Are you sure you want to mark ALL items as available?')) {
        return;
    }
    
    // Check all checkboxes
    document.querySelectorAll('.toggle-switch input').forEach(checkbox => {
        checkbox.checked = true;
        
        // Update availability
        const itemName = checkbox.getAttribute('data-item');
        if (itemName) {
            updateAvailability(itemName, true);
        }
    });
    
    showAlert('✅ All items marked as available!', 'success');
}

async function toggleAllAvailability() {
    if (!confirm('Toggle availability for all items? This will invert current status.')) {
        return;
    }
    
    // Toggle all checkboxes
    document.querySelectorAll('.toggle-switch input').forEach(checkbox => {
        checkbox.checked = !checkbox.checked;
        
        // Update availability
        const itemName = checkbox.getAttribute('data-item');
        const available = checkbox.checked;
        if (itemName) {
            updateAvailability(itemName, available);
        }
    });
    
    showAlert('✅ All items availability toggled!', 'success');
}

// ================================
// PRODUCT MANAGEMENT FUNCTIONS
// ================================

function loadProducts() {
    console.log('Loading products...');
    
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
        <div class="product-item">
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
                    <span class="product-price">₱${product.price}</span>
                    <span class="product-status" style="background: ${product.isAvailable ? '#28a745' : '#dc3545'}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px;">
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
}

function showAddProductModal() {
    currentEditingProductId = null;
    
    const modal = document.getElementById('add-product-modal');
    const modalTitle = document.getElementById('product-modal-title');
    const productName = document.getElementById('product-name');
    const productPrice = document.getElementById('product-price');
    const productCategory = document.getElementById('product-category');
    const productDescription = document.getElementById('product-description');
    const productImage = document.getElementById('product-image');
    const productAvailable = document.getElementById('product-available');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Product';
    if (productName) productName.value = '';
    if (productPrice) productPrice.value = '';
    if (productCategory) productCategory.value = '';
    if (productDescription) productDescription.value = '';
    if (productImage) productImage.value = '';
    if (productAvailable) productAvailable.checked = true;
    
    modal.style.display = 'flex';
}

function editProduct(productId) {
    currentEditingProductId = productId;
    
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
        showAlert('Product not found!', 'error');
        return;
    }
    
    const modal = document.getElementById('add-product-modal');
    const modalTitle = document.getElementById('product-modal-title');
    const productName = document.getElementById('product-name');
    const productPrice = document.getElementById('product-price');
    const productCategory = document.getElementById('product-category');
    const productDescription = document.getElementById('product-description');
    const productImage = document.getElementById('product-image');
    const productAvailable = document.getElementById('product-available');
    
    if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Product';
    if (productName) productName.value = product.name;
    if (productPrice) productPrice.value = product.price;
    if (productCategory) productCategory.value = product.category;
    if (productDescription) productDescription.value = product.description || '';
    if (productImage) productImage.value = product.image || '';
    if (productAvailable) productAvailable.checked = product.isAvailable !== false;
    
    modal.style.display = 'flex';
}

function saveProduct() {
    const productName = document.getElementById('product-name');
    const productPrice = document.getElementById('product-price');
    const productCategory = document.getElementById('product-category');
    const productDescription = document.getElementById('product-description');
    const productImage = document.getElementById('product-image');
    const productAvailable = document.getElementById('product-available');
    
    if (!productName || !productName.value.trim()) {
        showAlert('Please enter a product name!', 'error');
        return;
    }
    
    if (!productPrice || !productPrice.value || parseFloat(productPrice.value) <= 0) {
        showAlert('Please enter a valid price!', 'error');
        return;
    }
    
    if (!productCategory || !productCategory.value) {
        showAlert('Please select a category!', 'error');
        return;
    }
    
    const productData = {
        id: currentEditingProductId || `product_${Date.now()}`,
        name: productName.value.trim(),
        price: parseFloat(productPrice.value),
        category: productCategory.value,
        description: productDescription ? productDescription.value.trim() : '',
        image: productImage ? productImage.value.trim() : '',
        isAvailable: productAvailable ? productAvailable.checked : true,
        updatedAt: new Date().toISOString()
    };
    
    if (!currentEditingProductId) {
        // Add new product
        productData.createdAt = new Date().toISOString();
        menuItems[productData.category].push(productData);
        showAlert('✅ Product added successfully!', 'success');
    } else {
        // Update existing product
        let found = false;
        for (let category in menuItems) {
            const index = menuItems[category].findIndex(p => p.id === currentEditingProductId);
            if (index !== -1) {
                // Remove from old category if category changed
                if (category !== productData.category) {
                    menuItems[category].splice(index, 1);
                    menuItems[productData.category].push(productData);
                } else {
                    menuItems[category][index] = productData;
                }
                found = true;
                break;
            }
        }
        
        if (!found) {
            // If product not found (shouldn't happen), add as new
            menuItems[productData.category].push(productData);
        }
        showAlert('✅ Product updated successfully!', 'success');
    }
    
    // Save to localStorage
    saveMenuItemsToStorage();
    
    // Close modal
    document.getElementById('add-product-modal').style.display = 'none';
    
    // Refresh products list
    loadProducts();
    
    // Refresh availability controls if needed
    if (currentSection === 'availability') {
        loadAvailabilityControls();
    }
    
    // Reset editing state
    currentEditingProductId = null;
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
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
        showAlert('Product not found!', 'error');
    }
}

// ================================
// SLIDESHOW FUNCTIONS
// ================================

async function loadSlideshow() {
    console.log('Loading slideshow...');
    
    // Try to get slides from localStorage first
    let slides = JSON.parse(localStorage.getItem('slideshowSlides'));
    
    // If no slides in localStorage, use demo slides
    if (!slides || slides.length === 0) {
        slides = [
            {
                _id: 'slide_1',
                title: 'Welcome to Ai-Maize-ing Nachos',
                description: 'Your go-to spot for delicious nachos and desserts',
                imageUrl: 'image/logo.png',
                order: 1,
                active: true,
                originalItem: null,
                price: null,
                category: null,
                promoBadge: 'WELCOME',
                createdAt: new Date()
            },
            {
                _id: 'slide_2',
                title: 'Try Our Supreme Nachos',
                description: 'Delicious Supreme Nachos for only ₱180',
                imageUrl: 'image/Supreme Nachos.png',
                order: 2,
                active: true,
                originalItem: 'Supreme Nachos',
                price: 180,
                category: 'nachos',
                promoBadge: 'POPULAR',
                createdAt: new Date(Date.now() - 86400000)
            },
            {
                _id: 'slide_3',
                title: 'Special Offers',
                description: 'Check out our weekly specials',
                imageUrl: 'https://via.placeholder.com/400x200/e65100/ffffff?text=Special+Offers',
                order: 3,
                active: false,
                originalItem: null,
                price: null,
                category: null,
                promoBadge: 'SPECIAL',
                createdAt: new Date(Date.now() - 172800000)
            }
        ];
        
        // Save demo slides to localStorage
        localStorage.setItem('slideshowSlides', JSON.stringify(slides));
    }
    
    renderSlideshow(slides);
}

function renderSlideshow(slides) {
    const currentContainer = document.getElementById('slideshow-current');
    
    // Sort slides by order
    slides.sort((a, b) => a.order - b.order);
    
    // Filter active slides for preview
    const activeSlides = slides.filter(slide => slide.active);
    
    // Render current slides preview
    if (currentContainer) {
        if (activeSlides.length === 0) {
            currentContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No active slides in slideshow</p>';
        } else {
            currentContainer.innerHTML = activeSlides.map(slide => `
                <div class="slide-card ${slide.active ? 'active' : ''}" data-id="${slide._id}">
                    <img src="${slide.imageUrl}" alt="${slide.title}" class="slide-image" onerror="this.src='https://via.placeholder.com/400x200/8b4513/ffffff?text=${encodeURIComponent(slide.title.substring(0, 20))}'">
                    <div class="slide-info">
                        <div class="slide-header">
                            ${slide.price ? `<span class="slide-price-tag"><i class="fas fa-peso-sign"></i> ${slide.price}</span>` : ''}
                            ${slide.originalItem ? `<span class="slide-item-name">${slide.originalItem}</span>` : ''}
                        </div>
                        <h4 class="slide-title">${slide.title}</h4>
                        <p class="slide-description">${slide.description || 'No description'}</p>
                        <div class="slide-meta">
                            ${slide.promoBadge ? `<span class="slide-badge">${slide.promoBadge}</span>` : ''}
                            <span class="slide-status">
                                ${slide.active ? '<i class="fas fa-eye"></i> Active' : '<i class="fas fa-eye-slash"></i> Hidden'}
                            </span>
                        </div>
                        <div class="slide-actions">
                            <button class="slide-btn edit" onclick="editSlide('${slide._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="slide-btn toggle" onclick="toggleSlide('${slide._id}')">
                                <i class="fas fa-toggle-${slide.active ? 'on' : 'off'}"></i> ${slide.active ? 'Hide' : 'Show'}
                            </button>
                            <button class="slide-btn delete" onclick="deleteSlide('${slide._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}

// ================================
// UTILITY FUNCTIONS
// ================================

function showAlert(message, type = 'info') {
    const alertModal = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('custom-alert-message');
    const alertOk = document.getElementById('custom-alert-ok');
    
    if (alertModal && alertMessage && alertOk) {
        // Set message with HTML support
        alertMessage.innerHTML = message;
        
        // Style based on type
        alertMessage.style.color = type === 'error' ? '#dc3545' : 
                                   type === 'success' ? '#28a745' : '#2c3e50';
        
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
        
        // Auto-close after 5 seconds for success/info messages
        if (type !== 'error') {
            setTimeout(() => {
                if (alertModal.style.display === 'flex') {
                    alertModal.style.display = 'none';
                }
            }, 5000);
        }
    } else {
        // Fallback to browser alert
        alert(message);
    }
}

// ================================
// GLOBAL EXPORTS
// ================================

// Make functions available globally for inline event handlers
window.showRealOrderDetails = showRealOrderDetails;
window.editSlide = editSlide;
window.deleteSlide = deleteSlide;
window.toggleSlide = toggleSlide;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;