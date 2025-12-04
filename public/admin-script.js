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
    
    // Slideshow buttons - USE EVENT DELEGATION
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

// NEW FUNCTION: Setup slideshow event listeners with delegation
function setupSlideshowEventListeners() {
    console.log('Setting up slideshow event listeners');
    
    // Add slide button
    const addSlideBtn = document.getElementById('add-slide-btn');
    if (addSlideBtn) {
        addSlideBtn.addEventListener('click', function() {
            currentEditingSlideId = null;
            showAddSlideModal(false);
        });
    }
    
    // Refresh slideshow button
    const refreshSlideshowBtn = document.getElementById('refresh-slideshow');
    if (refreshSlideshowBtn) {
        refreshSlideshowBtn.addEventListener('click', refreshSlideshow);
    }
    
    // Save slide button (in modal)
    const saveSlideBtn = document.getElementById('save-slide-btn');
    if (saveSlideBtn) {
        saveSlideBtn.addEventListener('click', addNewSlide);
    }
    
    // Cancel add slide button
    const cancelAddSlide = document.getElementById('cancel-add-slide');
    if (cancelAddSlide) {
        cancelAddSlide.addEventListener('click', closeAddSlideModal);
    }
    
    // Use event delegation for dynamically created slide buttons
    document.addEventListener('click', function(e) {
        // Check for edit slide buttons
        if (e.target.closest('.edit-slide-btn')) {
            const slideId = e.target.closest('.edit-slide-btn').getAttribute('data-id');
            if (slideId) {
                editSlide(slideId);
            }
        }
        
        // Check for delete slide buttons
        if (e.target.closest('.delete-slide-btn')) {
            const slideId = e.target.closest('.delete-slide-btn').getAttribute('data-id');
            if (slideId) {
                deleteSlide(slideId);
            }
        }
        
        // Check for edit slide list buttons
        if (e.target.closest('.edit-slide-list-btn')) {
            const slideId = e.target.closest('.edit-slide-list-btn').getAttribute('data-id');
            if (slideId) {
                editSlide(slideId);
            }
        }
        
        // Check for delete slide list buttons
        if (e.target.closest('.delete-slide-list-btn')) {
            const slideId = e.target.closest('.delete-slide-list-btn').getAttribute('data-id');
            if (slideId) {
                deleteSlide(slideId);
            }
        }
    });
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
// SLIDESHOW FUNCTIONS (updated with proper event handling)
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
                createdAt: new Date()
            },
            {
                _id: 'slide_2',
                title: 'Fresh Ingredients',
                description: 'We use only the freshest ingredients',
                imageUrl: 'https://via.placeholder.com/400x200/8b4513/ffffff?text=Fresh+Ingredients',
                order: 2,
                active: true,
                createdAt: new Date(Date.now() - 86400000)
            },
            {
                _id: 'slide_3',
                title: 'Special Offers',
                description: 'Check out our weekly specials',
                imageUrl: 'https://via.placeholder.com/400x200/e65100/ffffff?text=Special+Offers',
                order: 3,
                active: false,
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
    const listContainer = document.getElementById('slideshow-list');
    
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
                <div class="slide-card active" data-id="${slide._id}">
                    <img src="${slide.imageUrl}" alt="${slide.title}" class="slide-image" onerror="this.src='https://via.placeholder.com/400x200/8b4513/ffffff?text=${encodeURIComponent(slide.title)}'">
                    <div class="slide-info">
                        <h4>${slide.title}</h4>
                        <p>${slide.description || 'No description'}</p>
                        <div class="slide-meta">
                            <span>Order: ${slide.order}</span>
                            <span class="slide-status ${slide.active ? 'active' : 'inactive'}">${slide.active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div class="slide-actions">
                            <button class="edit-slide-btn action-btn secondary" style="padding: 8px 12px; font-size: 12px;" data-id="${slide._id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="delete-slide-btn action-btn danger" style="padding: 8px 12px; font-size: 12px;" data-id="${slide._id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners to the newly created buttons
            setTimeout(() => {
                document.querySelectorAll('.edit-slide-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const slideId = this.getAttribute('data-id');
                        editSlide(slideId);
                    });
                });
                
                document.querySelectorAll('.delete-slide-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const slideId = this.getAttribute('data-id');
                        deleteSlide(slideId);
                    });
                });
            }, 100);
        }
    }
    
    // Render slides list
    if (listContainer) {
        if (slides.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No slides found</p>';
        } else {
            listContainer.innerHTML = slides.map(slide => `
                <div class="slide-list-item ${slide.active ? 'active' : ''}" data-id="${slide._id}">
                    <div class="slide-list-preview">
                        <img src="${slide.imageUrl}" alt="${slide.title}" class="slide-list-image" onerror="this.src='https://via.placeholder.com/60x60/8b4513/ffffff?text=${encodeURIComponent(slide.title.substring(0, 10))}'">
                        <div class="slide-list-info">
                            <h5>${slide.title}</h5>
                            <p>${slide.description ? slide.description.substring(0, 50) + (slide.description.length > 50 ? '...' : '') : 'No description'}</p>
                            <div class="slide-list-meta">
                                <small>Order: ${slide.order}</small>
                                <small>${new Date(slide.createdAt).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>
                    <div class="slide-list-actions">
                        <label class="toggle-switch small">
                            <input type="checkbox" class="toggle-slide-active" ${slide.active ? 'checked' : ''} data-id="${slide._id}">
                            <span class="toggle-slider"></span>
                        </label>
                        <button class="action-btn icon-btn edit-slide-list-btn" data-id="${slide._id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn icon-btn danger delete-slide-list-btn" data-id="${slide._id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Add event listeners to the list items
            setTimeout(() => {
                document.querySelectorAll('.toggle-slide-active').forEach(toggle => {
                    toggle.addEventListener('change', function() {
                        const slideId = this.getAttribute('data-id');
                        toggleSlideActive(slideId, this.checked);
                    });
                });
                
                document.querySelectorAll('.edit-slide-list-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const slideId = this.getAttribute('data-id');
                        editSlide(slideId);
                    });
                });
                
                document.querySelectorAll('.delete-slide-list-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const slideId = this.getAttribute('data-id');
                        deleteSlide(slideId);
                    });
                });
            }, 100);
        }
    }
}

function showAddSlideModal(editMode = false) {
    const modal = document.getElementById('add-slide-modal');
    const modalTitle = modal.querySelector('.modal-content h2');
    const saveBtn = document.getElementById('save-slide-btn');
    
    if (editMode) {
        modalTitle.textContent = 'Edit Slide';
        saveBtn.textContent = 'Update Slide';
    } else {
        modalTitle.textContent = 'Add New Slide';
        saveBtn.textContent = 'Add Slide';
        
        // Reset form
        const slideTitle = document.getElementById('slide-title');
        const slideDescription = document.getElementById('slide-description');
        const slideImageUrl = document.getElementById('slide-image-url');
        const slideOrder = document.getElementById('slide-order');
        const slideActive = document.getElementById('slide-active');
        
        if (slideTitle) slideTitle.value = '';
        if (slideDescription) slideDescription.value = '';
        if (slideImageUrl) slideImageUrl.value = '';
        if (slideOrder) slideOrder.value = (document.querySelectorAll('.slide-card').length + 1).toString();
        if (slideActive) slideActive.checked = true;
    }
    
    modal.style.display = 'flex';
}

function closeAddSlideModal() {
    const modal = document.getElementById('add-slide-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset editing state
    currentEditingSlideId = null;
}

async function addNewSlide() {
    const slideTitle = document.getElementById('slide-title');
    const slideDescription = document.getElementById('slide-description');
    const slideImageUrl = document.getElementById('slide-image-url');
    const slideOrder = document.getElementById('slide-order');
    const slideActive = document.getElementById('slide-active');
    
    if (!slideTitle || !slideImageUrl || !slideOrder || !slideActive) return;
    
    const title = slideTitle.value.trim();
    const description = slideDescription.value.trim();
    const imageUrl = slideImageUrl.value.trim();
    const order = parseInt(slideOrder.value) || 0;
    const active = slideActive.checked;
    
    if (!title) {
        showAlert('Title is required');
        return;
    }
    
    if (!imageUrl) {
        showAlert('Image URL is required');
        return;
    }
    
    // Get existing slides
    let slides = JSON.parse(localStorage.getItem('slideshowSlides') || '[]');
    
    if (currentEditingSlideId) {
        // Update existing slide
        slides = slides.map(slide => {
            if (slide._id === currentEditingSlideId) {
                return {
                    ...slide,
                    title,
                    description,
                    imageUrl,
                    order,
                    active,
                    updatedAt: new Date()
                };
            }
            return slide;
        });
        showAlert('✅ Slide updated successfully!');
    } else {
        // Add new slide
        const newSlide = {
            _id: 'slide_' + Date.now(),
            title,
            description,
            imageUrl,
            order,
            active,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        slides.push(newSlide);
        showAlert('✅ Slide added successfully!');
    }
    
    // Save to localStorage
    localStorage.setItem('slideshowSlides', JSON.stringify(slides));
    
    // Reset and close modal
    closeAddSlideModal();
    
    // Refresh slideshow display
    loadSlideshow();
}

async function editSlide(slideId) {
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
    
    // Populate form with slide data
    const slideTitle = document.getElementById('slide-title');
    const slideDescription = document.getElementById('slide-description');
    const slideImageUrl = document.getElementById('slide-image-url');
    const slideOrder = document.getElementById('slide-order');
    const slideActive = document.getElementById('slide-active');
    
    if (slideTitle) slideTitle.value = slideToEdit.title;
    if (slideDescription) slideDescription.value = slideToEdit.description || '';
    if (slideImageUrl) slideImageUrl.value = slideToEdit.imageUrl;
    if (slideOrder) slideOrder.value = slideToEdit.order;
    if (slideActive) slideActive.checked = slideToEdit.active;
    
    // Show modal in edit mode
    showAddSlideModal(true);
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

async function toggleSlideActive(slideId, active) {
    // Get slides from localStorage
    let slides = JSON.parse(localStorage.getItem('slideshowSlides') || '[]');
    
    // Update slide active status
    slides = slides.map(slide => {
        if (slide._id === slideId) {
            return {
                ...slide,
                active,
                updatedAt: new Date()
            };
        }
        return slide;
    });
    
    // Save to localStorage
    localStorage.setItem('slideshowSlides', JSON.stringify(slides));
    
    showAlert(`✅ Slide ${active ? 'activated' : 'deactivated'}!`);
    
    // Refresh slideshow display
    loadSlideshow();
}

function refreshSlideshow() {
    loadSlideshow();
    showAlert('Slideshow refreshed!');
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
window.toggleSlideActive = toggleSlideActive;
window.closeAddSlideModal = closeAddSlideModal;
window.saveSuperadminSettings = saveSuperadminSettings;