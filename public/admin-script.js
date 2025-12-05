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

// Menu items data from nachos.html and aifoodies.html
const menuItems = {
    nachos: [
        { 
            name: "Regular Nachos", 
            price: 35, 
            image: "image/classic nachos.jpg", 
            category: "nachos",
            description: "Classic nachos with delicious toppings"
        },
        { 
            name: "Veggie Nachos", 
            price: 65, 
            image: "image/veggie nachos.jpg", 
            category: "nachos",
            description: "Fresh vegetable nachos"
        },
        { 
            name: "Overload Cheesy Nachos", 
            price: 95, 
            image: "image/overload chees nachos.jpg", 
            category: "nachos",
            description: "Extra cheesy nachos overload"
        },
        { 
            name: "Nacho Combo", 
            price: 75, 
            image: "image/combo.png", 
            category: "nachos",
            description: "Nachos combo meal"
        },
        { 
            name: "Nacho Fries", 
            price: 85, 
            image: "image/nacho fries.jpg", 
            category: "nachos",
            description: "Nachos with crispy fries"
        },
        { 
            name: "Supreme Nachos", 
            price: 180, 
            image: "image/Supreme Nachos.png", 
            category: "nachos",
            description: "Supreme nachos special"
        },
        { 
            name: "Shawarma fries", 
            price: 120, 
            image: "image/shawarma fries.jpeg", 
            category: "nachos",
            description: "Shawarma style fries"
        }
    ],
    desserts: [
        { 
            name: "Mango Graham", 
            price: 40, 
            image: "image/mango.gif", 
            category: "desserts",
            description: "Refreshing mango graham"
        },
        { 
            name: "Mango tiramisu on tube", 
            price: 100, 
            image: "image/mango tiramisu on tub-price 100.jpeg", 
            category: "desserts",
            description: "Mango tiramisu in a tube"
        },
        { 
            name: "Biscoff", 
            price: 159, 
            image: "image/biscoff.jpeg", 
            category: "desserts",
            description: "Delicious biscoff dessert"
        },
        { 
            name: "Oreo", 
            price: 149, 
            image: "image/oreo and bisscoff.png", 
            category: "desserts",
            description: "Creamy oreo dessert"
        },
        { 
            name: "Mango Graham Float", 
            price: 40, 
            image: "image/Mango Graham Floa.jpg", 
            category: "desserts",
            description: "Mango graham float special"
        }
    ]
};

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
    
    // Initialize admin panel
    initializeAdminPanel();
    
    // Setup event listeners after a small delay to ensure DOM is ready
    setTimeout(setupAdminEventListeners, 200);
});

function showLoginModal() {
    const modalHTML = `
        <div id="admin-login-modal" class="modal-overlay" style="display: flex; z-index: 9999;">
            <div class="modal-content" style="max-width: 400px;">
                <h2><i class="fas fa-user-shield"></i> Admin Login Required</h2>
                <p style="text-align: center; margin-bottom: 20px; color: #666;">Please login to access the admin panel</p>
                
                <input type="text" id="admin-username-modal" placeholder="Username" value="admin" style="margin-bottom: 15px;">
                <input type="password" id="admin-password-modal" placeholder="Password" value="admin123" style="margin-bottom: 20px;">
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button id="modal-login-btn" style="background: #8b4513; color: white; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-sign-in-alt"></i> Login as Admin
                    </button>
                    <button id="modal-superadmin-btn" style="background: #FF6A00; color: white; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        <i class="fas fa-crown"></i> Login as SuperAdmin
                    </button>
                    <button onclick="window.location.href = 'index.html'" style="background: #6c757d; color: white; padding: 12px; border: none; border-radius: 8px; cursor: pointer;">
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
    
    // Add event listeners
    setTimeout(() => {
        const modalLoginBtn = document.getElementById('modal-login-btn');
        const modalSuperadminBtn = document.getElementById('modal-superadmin-btn');
        
        if (modalLoginBtn) {
            modalLoginBtn.addEventListener('click', function() {
                handleAdminModalLogin('admin');
            });
        }
        
        if (modalSuperadminBtn) {
            modalSuperadminBtn.addEventListener('click', function() {
                handleAdminModalLogin('superadmin');
            });
        }
        
        // Close modal when clicking outside
        const modal = document.getElementById('admin-login-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    modal.remove();
                }
            });
        }
        
        // Enter key to login
        document.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleAdminModalLogin('admin');
            }
        });
    }, 100);
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
    
    // Initialize admin panel
    setTimeout(() => {
        initializeAdminPanel();
    }, 500);
}

function initializeAdminPanel() {
    console.log('Initializing admin panel for:', adminRole);
    
    // Show superadmin features if applicable
    showSuperAdminFeatures();
    
    // Load initial dashboard
    loadAdminDashboard();
}

// ================================
// EVENT LISTENERS SETUP
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
    
    // Navigation buttons
    document.querySelectorAll('.admin-nav-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    });
    
    // View all orders button
    const viewAllOrders = document.getElementById('view-all-orders');
    if (viewAllOrders) {
        viewAllOrders.addEventListener('click', function() {
            showSection('orders');
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
    
    // Slideshow buttons
    setupSlideshowEventListeners();
    
    // Order filters
    const orderFilter = document.getElementById('order-filter');
    if (orderFilter) {
        orderFilter.addEventListener('change', filterOrders);
    }
    
    const orderSearch = document.getElementById('order-search');
    if (orderSearch) {
        orderSearch.addEventListener('input', searchOrders);
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
    
    // Superadmin settings buttons (will be added dynamically)
    setTimeout(() => {
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
    }, 300);
}

// Setup slideshow event listeners with delegation
function setupSlideshowEventListeners() {
    console.log('Setting up slideshow event listeners');
    
    // Add slide button - Updated to show menu items
    const addSlideBtn = document.getElementById('add-slide-btn');
    if (addSlideBtn) {
        addSlideBtn.addEventListener('click', function() {
            showMenuItemsSelectionModal();
        });
    }
    
    // Refresh slideshow button
    const refreshSlideshowBtn = document.getElementById('refresh-slideshow');
    if (refreshSlideshowBtn) {
        refreshSlideshowBtn.addEventListener('click', loadSlideshow);
    }
    
    // Reorder slides button
    const reorderSlidesBtn = document.getElementById('reorder-slides');
    if (reorderSlidesBtn) {
        reorderSlidesBtn.addEventListener('click', function() {
            showAlert('Drag and drop slides to reorder them.');
        });
    }
    
    // Save slide button in add-slide-modal
    const saveSlideBtn = document.getElementById('save-slide-btn');
    if (saveSlideBtn) {
        saveSlideBtn.addEventListener('click', addNewSlide);
    }
    
    // Cancel add slide button
    const cancelAddSlide = document.getElementById('cancel-add-slide');
    if (cancelAddSlide) {
        cancelAddSlide.addEventListener('click', closeAddSlideModal);
    }
    
    // Delete slide button
    const deleteSlideBtn = document.getElementById('delete-slide-btn');
    if (deleteSlideBtn) {
        deleteSlideBtn.addEventListener('click', function() {
            if (currentEditingSlideId) {
                deleteSlide(currentEditingSlideId);
            }
        });
    }
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
        
        // Add click event
        superadminNavBtn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
        });
    }
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
    
    showAlert('✅ Superadmin settings saved! Changes will apply on the homepage.');
    
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
        
        showAlert('✅ Settings reset to default');
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
    
    showAlert(logHTML);
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
            loadAllOrders();
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
        
        // Update stats
        const totalOrders = document.getElementById('total-orders');
        const totalSales = document.getElementById('total-sales');
        const todayOrders = document.getElementById('today-orders');
        const todaySales = document.getElementById('today-sales');
        
        if (totalOrders) totalOrders.textContent = '24';
        if (totalSales) totalSales.textContent = '₱5,240.00';
        if (todayOrders) todayOrders.textContent = '3';
        if (todaySales) todaySales.textContent = '₱650.00';
        
        // Update chart
        updateSalesChart();
        
        // Load recent orders
        loadRecentOrders();
        
    } catch (error) {
        console.error('Dashboard load error:', error);
        showAlert('Error loading dashboard data');
    }
}

async function loadRecentOrders() {
    const ordersList = document.getElementById('recent-orders-list');
    if (!ordersList) return;
    
    // Demo recent orders
    const demoOrders = [
        {
            _id: 'order_001',
            customerName: 'John Doe',
            items: [
                { name: 'Regular Nachos', quantity: 2 },
                { name: 'Mango Graham', quantity: 1 }
            ],
            total: 110,
            status: 'completed'
        },
        {
            _id: 'order_002',
            customerName: 'Jane Smith',
            items: [
                { name: 'Overload Cheesy Nachos', quantity: 1 }
            ],
            total: 95,
            status: 'processing'
        },
        {
            _id: 'order_003',
            customerName: 'Mike Johnson',
            items: [
                { name: 'Shawarma Fries', quantity: 1 },
                { name: 'Nacho Combo', quantity: 2 }
            ],
            total: 270,
            status: 'pending'
        }
    ];
    
    ordersList.innerHTML = demoOrders.map(order => `
        <div class="order-preview-item" onclick="showOrderDetails('${order._id}')">
            <div class="order-preview-header">
                <span class="order-id">#${order._id.substring(0, 8)}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-preview-details">
                <div class="customer-name">${order.customerName || 'Guest'}</div>
                <div class="order-total">₱${order.total.toFixed(2)}</div>
            </div>
            <div class="order-preview-items">
                ${order.items.slice(0, 2).map(item => 
                    `<span>${item.name} x${item.quantity}</span>`
                ).join(', ')}
                ${order.items.length > 2 ? `... +${order.items.length - 2} more` : ''}
            </div>
        </div>
    `).join('');
}

function updateSalesChart() {
    const ctx = document.getElementById('sales-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    // Get canvas context
    const canvas = ctx.getContext('2d');
    
    window.salesChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Daily Sales (₱)',
                data: [1200, 1900, 1500, 2200, 1800, 2500, 2100],
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

// ================================
// AVAILABILITY FUNCTIONS
// ================================

async function loadAvailabilityControls() {
    console.log('Loading availability controls...');
    
    // Demo availability items
    const nachosItems = [
        { name: 'Regular Nachos', available: true },
        { name: 'Veggie Nachos', available: true },
        { name: 'Overload Cheesy Nachos', available: true },
        { name: 'Nacho Combo', available: true },
        { name: 'Nacho Fries', available: true },
        { name: 'Supreme Nachos', available: true },
        { name: 'Shawarma Fries', available: true }
    ];
    
    const dessertsItems = [
        { name: 'Mango Graham', available: true },
        { name: 'Mango tiramisu on tube', available: true },
        { name: 'Biscoff', available: true },
        { name: 'Oreo', available: true },
        { name: 'Mango Graham Float', available: true }
    ];
    
    // Render nachos items
    const nachosContainer = document.getElementById('nachos-availability');
    if (nachosContainer) {
        nachosContainer.innerHTML = nachosItems.map(item => `
            <div class="availability-item">
                <span class="item-name">${item.name}</span>
                <label class="toggle-switch">
                    <input type="checkbox" 
                           ${item.available ? 'checked' : ''}
                           data-item="${item.name}">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `).join('');
    }
    
    // Render dessert items
    const dessertsContainer = document.getElementById('desserts-availability');
    if (dessertsContainer) {
        dessertsContainer.innerHTML = dessertsItems.map(item => `
            <div class="availability-item">
                <span class="item-name">${item.name}</span>
                <label class="toggle-switch">
                    <input type="checkbox" 
                           ${item.available ? 'checked' : ''}
                           data-item="${item.name}">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `).join('');
    }
    
    // Add event listeners to toggle switches
    document.querySelectorAll('.toggle-switch input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const itemName = this.getAttribute('data-item');
            const available = this.checked;
            updateAvailability(itemName, available);
        });
    });
}

async function updateAvailability(itemName, available) {
    console.log(`Updating ${itemName} availability to: ${available}`);
    showAlert(`${itemName} is now ${available ? 'available' : 'out of stock'}`);
    
    // In a real app, you would make an API call here
    // For demo, we'll just update localStorage
    let availability = JSON.parse(localStorage.getItem('itemAvailability') || '{}');
    availability[itemName] = available;
    localStorage.setItem('itemAvailability', JSON.stringify(availability));
}

async function resetAllAvailability() {
    if (!confirm('Are you sure you want to mark ALL items as available?')) {
        return;
    }
    
    // Check all checkboxes
    document.querySelectorAll('.toggle-switch input').forEach(checkbox => {
        checkbox.checked = true;
        
        // Trigger change event
        const itemName = checkbox.getAttribute('data-item');
        updateAvailability(itemName, true);
    });
    
    showAlert('✅ All items marked as available!');
}

async function toggleAllAvailability() {
    if (!confirm('Toggle availability for all items? This will invert current status.')) {
        return;
    }
    
    // Toggle all checkboxes
    document.querySelectorAll('.toggle-switch input').forEach(checkbox => {
        checkbox.checked = !checkbox.checked;
        
        // Trigger change event
        const itemName = checkbox.getAttribute('data-item');
        const available = checkbox.checked;
        updateAvailability(itemName, available);
    });
    
    showAlert('✅ All items availability toggled!');
}

// ================================
// SLIDESHOW FUNCTIONS (with menu items selection)
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
                        <h4>${slide.title}</h4>
                        <p>${slide.description || 'No description'}</p>
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

function showMenuItemsSelectionModal() {
    currentEditingSlideId = null;
    
    // Create modal content with menu items selection
    const modalHTML = `
        <div id="menu-items-modal" class="modal-overlay" style="display: flex; z-index: 9999;">
            <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <h2 id="slide-modal-title"><i class="fas fa-plus-circle"></i> Select Menu Item for Slide</h2>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; font-weight: bold; color: #8b4513;">
                        <i class="fas fa-filter"></i> Filter by Category:
                    </label>
                    <select id="item-category-filter" style="width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 8px; font-size: 15px;">
                        <option value="all">All Items</option>
                        <option value="nachos">Nachos</option>
                        <option value="desserts">Desserts</option>
                    </select>
                </div>
                
                <div id="menu-items-grid" class="menu-items-grid" style="margin: 20px 0;">
                    <!-- Menu items will be loaded here -->
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                    <h3 style="color: #8b4513; margin-bottom: 15px;"><i class="fas fa-cog"></i> Slide Settings</h3>
                    <input type="text" id="custom-slide-title" placeholder="Custom Title (optional)" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #e9ecef; border-radius: 8px;">
                    <input type="text" id="custom-slide-description" placeholder="Custom Description (optional)" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #e9ecef; border-radius: 8px;">
                    <input type="text" id="slide-promo-badge" placeholder="Promo Badge (e.g., '20% OFF', 'New')" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #e9ecef; border-radius: 8px;">
                    <input type="number" id="slide-order" placeholder="Display Order" value="0" min="0" style="width: 100%; padding: 12px; margin-bottom: 15px; border: 2px solid #e9ecef; border-radius: 8px;">
                    
                    <div style="margin: 15px 0;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" id="slide-active" checked style="transform: scale(1.2);">
                            <span style="font-weight: 500; color: #2c3e50;">Active (Show in slideshow)</span>
                        </label>
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 25px;">
                    <button id="save-slide-from-menu" class="action-btn primary">
                        <i class="fas fa-save"></i> Save Slide
                    </button>
                    <button id="cancel-menu-selection" class="action-btn secondary">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('menu-items-modal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Render menu items
    renderMenuItemsInModal();
    
    // Add event listeners
    setTimeout(() => {
        const categoryFilter = document.getElementById('item-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', renderMenuItemsInModal);
        }
        
        const saveSlideBtn = document.getElementById('save-slide-from-menu');
        if (saveSlideBtn) {
            saveSlideBtn.addEventListener('click', saveSlideFromMenuItem);
        }
        
        const cancelBtn = document.getElementById('cancel-menu-selection');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                const modal = document.getElementById('menu-items-modal');
                if (modal) modal.remove();
            });
        }
        
        // Close modal when clicking outside
        const modal = document.getElementById('menu-items-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.remove();
                }
            });
        }
    }, 100);
}

function renderMenuItemsInModal() {
    const container = document.getElementById('menu-items-grid');
    if (!container) return;
    
    const categoryFilter = document.getElementById('item-category-filter');
    const filterValue = categoryFilter ? categoryFilter.value : 'all';
    
    let allItems = [];
    
    if (filterValue === 'all' || filterValue === 'nachos') {
        allItems = allItems.concat(menuItems.nachos);
    }
    if (filterValue === 'all' || filterValue === 'desserts') {
        allItems = allItems.concat(menuItems.desserts);
    }
    
    if (allItems.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 40px;">No items found</p>';
        return;
    }
    
    container.innerHTML = allItems.map((item, index) => `
        <div class="menu-item-selector" data-item='${JSON.stringify(item)}'>
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; border: 2px solid #e9ecef; border-radius: 10px; margin-bottom: 15px; cursor: pointer; transition: all 0.3s ease; background: white;">
                <div style="flex-shrink: 0;">
                    <div style="width: 100px; height: 100px; border-radius: 8px; overflow: hidden; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
                        <img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML='<i class=\"fas fa-utensils\" style=\"font-size: 32px; color: #8b4513;\"></i>';">
                    </div>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <h4 style="margin: 0; color: #2c3e50; font-size: 18px;">${item.name}</h4>
                        <div style="background: #8b4513; color: white; padding: 5px 12px; border-radius: 15px; font-weight: bold;">
                            <i class="fas fa-peso-sign"></i> ${item.price}
                        </div>
                    </div>
                    <p style="margin: 0 0 8px 0; color: #6c757d; font-size: 14px; text-transform: capitalize;">
                        <i class="fas fa-tag"></i> ${item.category}
                    </p>
                    <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.4;">
                        ${item.description}
                    </p>
                </div>
                <div style="flex-shrink: 0;">
                    <input type="radio" name="selected-item" id="item_${index}_${item.category}" style="transform: scale(1.3);">
                </div>
            </div>
        </div>
    `).join('');
    
    // Add hover and selection effects
    document.querySelectorAll('.menu-item-selector').forEach(itemEl => {
        itemEl.addEventListener('mouseenter', () => {
            itemEl.style.borderColor = '#8b4513';
            itemEl.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.1)';
            itemEl.querySelector('div').style.transform = 'translateY(-2px)';
        });
        
        itemEl.addEventListener('mouseleave', () => {
            itemEl.style.borderColor = 'transparent';
            itemEl.style.boxShadow = 'none';
            itemEl.querySelector('div').style.transform = 'translateY(0)';
        });
        
        // Add selection effect
        const radio = itemEl.querySelector('input[type="radio"]');
        radio.addEventListener('change', function() {
            document.querySelectorAll('.menu-item-selector').forEach(el => {
                el.querySelector('div').style.borderColor = '#e9ecef';
                el.querySelector('div').style.backgroundColor = 'white';
            });
            
            if (this.checked) {
                itemEl.querySelector('div').style.borderColor = '#28a745';
                itemEl.querySelector('div').style.backgroundColor = '#f8fff9';
                
                // Auto-fill custom title with item name
                const customTitle = document.getElementById('custom-slide-title');
                if (!customTitle.value) {
                    const itemData = JSON.parse(itemEl.getAttribute('data-item'));
                    customTitle.value = itemData.name;
                }
            }
        });
    });
}

function saveSlideFromMenuItem() {
    const selectedItemEl = document.querySelector('.menu-item-selector input[type="radio"]:checked');
    
    if (!selectedItemEl) {
        showAlert('Please select a menu item for the slide!', 'error');
        return;
    }
    
    const itemSelector = selectedItemEl.closest('.menu-item-selector');
    if (!itemSelector) return;
    
    const itemData = JSON.parse(itemSelector.getAttribute('data-item'));
    
    // Get slide data
    const customTitle = document.getElementById('custom-slide-title').value || itemData.name;
    const customDescription = document.getElementById('custom-slide-description').value || itemData.description;
    const promoBadge = document.getElementById('slide-promo-badge').value;
    const slideOrder = parseInt(document.getElementById('slide-order').value) || 0;
    const isActive = document.getElementById('slide-active').checked;
    
    // Create slide object
    const slide = {
        _id: currentEditingSlideId || 'slide_' + Date.now(),
        title: customTitle,
        description: customDescription || `Delicious ${itemData.name}`,
        imageUrl: itemData.image,
        originalItem: itemData.name,
        price: itemData.price,
        category: itemData.category,
        promoBadge: promoBadge,
        order: slideOrder,
        active: isActive,
        createdAt: currentEditingSlideId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Save to localStorage
    saveSlideToStorage(slide);
    
    // Remove modal
    const modal = document.getElementById('menu-items-modal');
    if (modal) modal.remove();
    
    showAlert('✅ Slide added successfully!', 'success');
    
    // Refresh slideshow display
    loadSlideshow();
}

function saveSlideToStorage(slide) {
    let slides = JSON.parse(localStorage.getItem('slideshowSlides') || '[]');
    
    if (currentEditingSlideId) {
        // Update existing slide
        slides = slides.map(s => {
            if (s._id === currentEditingSlideId) {
                return { ...s, ...slide };
            }
            return s;
        });
    } else {
        // Add new slide
        slides.push(slide);
    }
    
    // Sort by order
    slides.sort((a, b) => a.order - b.order);
    localStorage.setItem('slideshowSlides', JSON.stringify(slides));
}

function closeAddSlideModal() {
    const modal = document.getElementById('add-slide-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset editing state
    currentEditingSlideId = null;
}

function editSlide(slideId) {
    console.log('Editing slide:', slideId);
    
    // Get slides from localStorage
    let slides = JSON.parse(localStorage.getItem('slideshowSlides') || '[]');
    
    // Find the slide to edit
    const slideToEdit = slides.find(slide => slide._id === slideId);
    if (!slideToEdit) {
        showAlert('Slide not found!');
        return;
    }
    
    // Set editing state
    currentEditingSlideId = slideId;
    
    // Show menu items modal with pre-filled data
    showMenuItemsSelectionModal();
    
    // Fill form with existing data after a small delay
    setTimeout(() => {
        const customTitle = document.getElementById('custom-slide-title');
        const customDescription = document.getElementById('custom-slide-description');
        const slidePromoBadge = document.getElementById('slide-promo-badge');
        const slideOrder = document.getElementById('slide-order');
        const slideActive = document.getElementById('slide-active');
        
        if (customTitle) customTitle.value = slideToEdit.title;
        if (customDescription) customDescription.value = slideToEdit.description || '';
        if (slidePromoBadge) slidePromoBadge.value = slideToEdit.promoBadge || '';
        if (slideOrder) slideOrder.value = slideToEdit.order || 0;
        if (slideActive) slideActive.checked = slideToEdit.active !== false;
        
        // Try to find and select the corresponding menu item
        if (slideToEdit.originalItem) {
            setTimeout(() => {
                const itemSelectors = document.querySelectorAll('.menu-item-selector');
                itemSelectors.forEach(selector => {
                    const itemData = JSON.parse(selector.getAttribute('data-item') || '{}');
                    if (itemData.name === slideToEdit.originalItem) {
                        const radio = selector.querySelector('input[type="radio"]');
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change'));
                        }
                    }
                });
            }, 200);
        }
    }, 300);
}

async function deleteSlide(slideId) {
    if (!confirm('Are you sure you want to delete this slide? This action cannot be undone.')) {
        return;
    }
    
    // Get slides from localStorage
    let slides = JSON.parse(localStorage.getItem('slideshowSlides') || '[]');
    
    // Filter out the slide to delete
    const updatedSlides = slides.filter(slide => slide._id !== slideId);
    
    // Save to localStorage
    localStorage.setItem('slideshowSlides', JSON.stringify(updatedSlides));
    
    showAlert('✅ Slide deleted successfully!');
    
    // Refresh slideshow display
    loadSlideshow();
}

function toggleSlide(slideId) {
    // Get slides from localStorage
    let slides = JSON.parse(localStorage.getItem('slideshowSlides') || '[]');
    
    // Find the slide
    const slideIndex = slides.findIndex(slide => slide._id === slideId);
    if (slideIndex === -1) return;
    
    // Toggle active status
    slides[slideIndex].active = !slides[slideIndex].active;
    slides[slideIndex].updatedAt = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem('slideshowSlides', JSON.stringify(slides));
    
    showAlert(`✅ Slide ${slides[slideIndex].active ? 'activated' : 'deactivated'}!`);
    
    // Refresh slideshow display
    loadSlideshow();
}

// ================================
// SLIDESHOW PREVIEW UPDATE
// ================================

function updateSlideshowPreview() {
    const slidesContainer = document.getElementById('slideshow-current');
    if (!slidesContainer) return;
    
    const slides = JSON.parse(localStorage.getItem('slideshowSlides') || '[]');
    const activeSlides = slides.filter(slide => slide.active);
    
    slidesContainer.innerHTML = '';
    
    if (activeSlides.length === 0) {
        slidesContainer.innerHTML = '<div class="empty-message">No active slides</div>';
        return;
    }
    
    activeSlides.sort((a, b) => a.order - b.order);
    
    activeSlides.forEach((slide, index) => {
        const slideCard = document.createElement('div');
        slideCard.className = 'slide-card';
        slideCard.innerHTML = `
            <img src="${slide.imageUrl}" alt="${slide.title}" class="slide-image" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOGI0NTEzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSJ3aGl0ZSI+JHtzbGlkZS50aXRsZX08L3RleHQ+PC9zdmc+'">
            <div class="slide-info">
                <h4>${slide.title}</h4>
                <p>${slide.description || 'No description'}</p>
                <p><small>Order: ${slide.order} | ${slide.promoBadge ? 'Badge: ' + slide.promoBadge : 'No badge'}</small></p>
            </div>
        `;
        
        slidesContainer.appendChild(slideCard);
    });
}

// ================================
// ORDERS FUNCTIONS
// ================================

async function loadAllOrders() {
    console.log('Loading all orders...');
    
    // Demo orders
    const demoOrders = [
        {
            _id: 'order_001',
            customerName: 'John Doe',
            customerPhone: '09123456789',
            items: [
                { name: 'Regular Nachos', quantity: 2, price: 35 },
                { name: 'Mango Graham', quantity: 1, price: 40 }
            ],
            total: 110,
            status: 'completed',
            paymentMethod: 'Cash on Pick-up',
            pickupTime: '6:30 PM',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
            _id: 'order_002',
            customerName: 'Jane Smith',
            customerPhone: '09198765432',
            items: [
                { name: 'Overload Cheesy Nachos', quantity: 1, price: 95 },
                { name: 'Biscoff', quantity: 1, price: 159 }
            ],
            total: 254,
            status: 'processing',
            paymentMethod: 'Gcash',
            pickupTime: '7:00 PM',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        },
        {
            _id: 'order_003',
            customerName: 'Mike Johnson',
            customerPhone: '09151112233',
            items: [
                { name: 'Shawarma Fries', quantity: 1, price: 120 },
                { name: 'Nacho Combo', quantity: 2, price: 75 }
            ],
            total: 270,
            status: 'pending',
            paymentMethod: 'Bank Transfer',
            pickupTime: '7:30 PM',
            timestamp: new Date() // Just now
        },
        {
            _id: 'order_004',
            customerName: 'Sarah Williams',
            customerPhone: '09169998877',
            items: [
                { name: 'Veggie Nachos', quantity: 1, price: 65 },
                { name: 'Oreo', quantity: 1, price: 149 }
            ],
            total: 214,
            status: 'cancelled',
            paymentMethod: 'Gcash',
            pickupTime: '8:00 PM',
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
        }
    ];
    
    renderOrdersList(demoOrders);
    updateOrdersSummary(demoOrders);
    
    // Add event listeners to order items
    document.querySelectorAll('.order-item').forEach(item => {
        item.addEventListener('click', function() {
            const orderIdElement = this.querySelector('.order-id');
            if (orderIdElement) {
                const orderId = orderIdElement.textContent.replace('#', '');
                showOrderDetails(orderId);
            }
        });
    });
}

function renderOrdersList(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #666;">No orders found</p>';
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <div class="order-id-time">
                    <span class="order-id">#${order._id.substring(0, 8)}</span>
                    <span class="order-time">${new Date(order.timestamp).toLocaleString()}</span>
                </div>
                <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-body">
                <div class="order-customer">
                    <strong>${order.customerName || 'Guest'}</strong>
                    ${order.customerPhone ? `<br><small>${order.customerPhone}</small>` : ''}
                </div>
                <div class="order-items-preview">
                    ${order.items.slice(0, 3).map(item => 
                        `<span>${item.name} x${item.quantity}</span>`
                    ).join(', ')}
                    ${order.items.length > 3 ? `... +${order.items.length - 3} more` : ''}
                </div>
                <div class="order-total">₱${order.total.toFixed(2)}</div>
            </div>
            <div class="order-footer">
                <span class="order-payment">${order.paymentMethod}</span>
                <span class="order-pickup">Pickup: ${order.pickupTime}</span>
            </div>
        </div>
    `).join('');
}

function updateOrdersSummary(orders) {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    
    const summaryTotal = document.getElementById('summary-total');
    const summaryPending = document.getElementById('summary-pending');
    const summaryProcessing = document.getElementById('summary-processing');
    const summaryCompleted = document.getElementById('summary-completed');
    
    if (summaryTotal) summaryTotal.textContent = total;
    if (summaryPending) summaryPending.textContent = pending;
    if (summaryProcessing) summaryProcessing.textContent = processing;
    if (summaryCompleted) summaryCompleted.textContent = completed;
}

function showOrderDetails(orderId) {
    showAlert(`Order Details for #${orderId}\n\nCustomer: John Doe\nItems: Regular Nachos x2, Mango Graham x1\nTotal: ₱110.00\nStatus: Completed\nPayment: Cash on Pick-up\nPickup Time: 6:30 PM`);
}

function filterOrders() {
    const orderFilter = document.getElementById('order-filter');
    const orderDate = document.getElementById('order-date');
    
    if (!orderFilter || !orderDate) return;
    
    const filterValue = orderFilter.value;
    const dateValue = orderDate.value;
    
    if (filterValue !== 'all') {
        showAlert(`Filtering orders by: ${filterValue} ${dateValue ? 'and date: ' + dateValue : ''}`);
    }
    
    // In a real app, you would filter the orders list
    // For demo, just reload all orders
    loadAllOrders();
}

function searchOrders() {
    const orderSearch = document.getElementById('order-search');
    if (!orderSearch) return;
    
    const searchTerm = orderSearch.value.toLowerCase();
    const orderItems = document.querySelectorAll('.order-item');
    
    orderItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
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
// GLOBAL EXPORTS
// ================================

// Make functions available globally for inline event handlers
window.showOrderDetails = showOrderDetails;
window.editSlide = editSlide;
window.deleteSlide = deleteSlide;
window.toggleSlide = toggleSlide;
window.closeAddSlideModal = closeAddSlideModal;
window.saveSuperadminSettings = saveSuperadminSettings;
window.updateSlideshowPreview = updateSlideshowPreview;