// ================================
// ENHANCED ADMIN PANEL SCRIPT
// Complete with caching, real-time updates, and better UX
// ================================

class EnhancedAdminPanel {
    constructor() {
        this.config = {
            API_BASE_URL: 'https://aifoodies.up.railway.app/api',
            POLLING_INTERVAL: 30000,
            CACHE_TTL: 300000,
            MAX_RETRIES: 3
        };
        
        this.state = {
            adminToken: localStorage.getItem('adminToken'),
            adminRole: localStorage.getItem('adminRole') || 'admin',
            currentSection: 'dashboard',
            menuItems: { nachos: [], desserts: [] },
            orders: [],
            filters: {
                orders: { status: 'all', date: '', search: '' },
                products: { category: '', search: '' }
            },
            pagination: {
                orders: { current: 1, total: 1, perPage: 10 },
                products: { current: 1, total: 1, perPage: 12 }
            },
            isLoading: false,
            cache: new Map(),
            updateIntervals: {}
        };
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Enhanced Admin Panel Initializing...');
        
        // Check authentication
        if (!this.state.adminToken || !(await this.verifyToken())) {
            this.showLoginModal();
            return;
        }
        
        // Setup UI
        this.setupUI();
        this.setupEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        // Start real-time updates
        this.startRealTimeUpdates();
        
        // Show keyboard shortcuts hint
        setTimeout(() => {
            this.showNotification('💡 Press ? to see keyboard shortcuts', 'info');
        }, 3000);
        
        console.log('✅ Admin Panel Ready');
    }
    
    setupUI() {
        // Role-specific UI
        if (this.state.adminRole === 'superadmin') {
            this.addSuperAdminFeatures();
        }
        
        // Update role badge
        const roleBadge = document.getElementById('admin-role-badge');
        if (roleBadge) {
            if (this.state.adminRole === 'superadmin') {
                roleBadge.textContent = 'SUPERADMIN';
                roleBadge.style.display = 'inline-block';
            } else {
                roleBadge.style.display = 'none';
            }
        }
        
        // Initialize charts
        this.initCharts();
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
        
        // Header actions
        document.getElementById('back-to-store')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                this.logout();
            }
        });
        
        // Quick actions
        document.getElementById('view-all-orders')?.addEventListener('click', () => {
            this.showSection('orders');
        });
        
        document.getElementById('quick-refresh')?.addEventListener('click', () => {
            this.refreshAllData();
        });
        
        document.getElementById('quick-shortcuts')?.addEventListener('click', () => {
            this.toggleKeyboardShortcuts();
        });
        
        // Search and filters
        this.setupSearchFilters();
        
        // Product management
        this.setupProductManagement();
        
        // Availability controls
        this.setupAvailabilityControls();
        
        // Modal handling
        this.setupModalHandlers();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Floating actions
        this.setupFloatingActions();
    }
    
    setupSearchFilters() {
        const searchInputs = ['order-search', 'product-search', 'availability-search'];
        
        searchInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    if (id === 'order-search') {
                        this.state.filters.orders.search = value;
                        this.filterOrders();
                    } else if (id === 'product-search') {
                        this.state.filters.products.search = value;
                        this.filterProducts();
                    } else if (id === 'availability-search') {
                        this.filterAvailability(value);
                    }
                });
            }
        });
        
        // Order filters
        const orderFilter = document.getElementById('order-filter');
        const orderDate = document.getElementById('order-date');
        
        if (orderFilter) {
            orderFilter.addEventListener('change', (e) => {
                this.state.filters.orders.status = e.target.value;
                this.filterOrders();
            });
        }
        
        if (orderDate) {
            orderDate.addEventListener('change', (e) => {
                this.state.filters.orders.date = e.target.value;
                this.filterOrders();
            });
        }
        
        // Product category filter
        const productCategoryFilter = document.getElementById('product-category-filter');
        if (productCategoryFilter) {
            productCategoryFilter.addEventListener('change', (e) => {
                this.state.filters.products.category = e.target.value;
                this.filterProducts();
            });
        }
    }
    
    setupProductManagement() {
        document.getElementById('add-product-btn')?.addEventListener('click', () => {
            this.showAddProductModal();
        });
        
        document.getElementById('refresh-products')?.addEventListener('click', () => {
            this.loadProducts(true);
        });
        
        document.getElementById('export-products')?.addEventListener('click', () => {
            this.exportProducts();
        });
        
        document.getElementById('save-product-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveProduct();
        });
        
        document.getElementById('cancel-add-product')?.addEventListener('click', () => {
            this.hideAddProductModal();
        });
        
        // Image preview
        const productImageInput = document.getElementById('product-image');
        if (productImageInput) {
            productImageInput.addEventListener('input', () => {
                this.updateProductImagePreview();
            });
        }
    }
    
    setupAvailabilityControls() {
        document.getElementById('reset-all-availability')?.addEventListener('click', () => {
            this.resetAllAvailability();
        });
        
        document.getElementById('toggle-all-availability')?.addEventListener('click', () => {
            this.toggleAllAvailability();
        });
        
        document.getElementById('save-availability')?.addEventListener('click', () => {
            this.saveAvailabilityChanges();
        });
    }
    
    setupModalHandlers() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    if (modal.id === 'add-product-modal') {
                        this.resetProductForm();
                    }
                }
            });
        });
        
        // Custom alert
        document.getElementById('custom-alert-ok')?.addEventListener('click', () => {
            document.getElementById('custom-alert').style.display = 'none';
        });
        
        // Order details modal
        document.getElementById('close-order-details')?.addEventListener('click', () => {
            document.getElementById('order-details-modal').style.display = 'none';
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key) {
                case 'Escape':
                    this.closeAllModals();
                    break;
                    
                case 'k':
                case 'K':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        const searchInput = document.getElementById('order-search') || 
                                           document.getElementById('product-search');
                        if (searchInput) {
                            searchInput.focus();
                        }
                    }
                    break;
                    
                case 'r':
                case 'R':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.refreshCurrentSection();
                    }
                    break;
                    
                case '?':
                    e.preventDefault();
                    this.toggleKeyboardShortcuts();
                    break;
                    
                case 'F5':
                    e.preventDefault();
                    this.refreshAllData();
                    break;
            }
        });
    }
    
    setupFloatingActions() {
        const floatingBtn = document.querySelector('.floating-btn');
        const floatingMenu = document.querySelector('.floating-actions-menu');
        
        if (floatingBtn && floatingMenu) {
            floatingBtn.addEventListener('click', () => {
                floatingMenu.style.display = floatingMenu.style.display === 'flex' ? 'none' : 'flex';
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!floatingBtn.contains(e.target) && !floatingMenu.contains(e.target)) {
                    floatingMenu.style.display = 'none';
                }
            });
        }
    }
    
    async loadInitialData() {
        this.showGlobalLoader();
        
        try {
            await Promise.allSettled([
                this.loadMenuItems(),
                this.loadOrders(),
                this.loadDashboardStats()
            ]);
            
            this.hideGlobalLoader();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Failed to load data. Please refresh the page.', 'error');
        }
    }
    
    async verifyToken() {
        try {
            const response = await fetch(`${this.config.API_BASE_URL}/admin/verify-role`, {
                headers: {
                    'Authorization': `Bearer ${this.state.adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    this.state.adminRole = data.admin.role;
                    localStorage.setItem('adminRole', this.state.adminRole);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }
    
    async loadMenuItems(forceRefresh = false) {
        const cacheKey = 'menuItems';
        
        if (!forceRefresh) {
            const cached = this.getCached(cacheKey);
            if (cached) {
                this.state.menuItems = cached;
                this.updateProductsDisplay();
                return;
            }
        }
        
        try {
            const response = await this.apiRequest(`${this.config.API_BASE_URL}/menu-items`);
            
            if (response) {
                this.state.menuItems = this.organizeByCategory(response);
                this.cacheData(cacheKey, this.state.menuItems);
                this.updateProductsDisplay();
                this.updateAvailabilityDisplay();
            }
        } catch (error) {
            console.error('Failed to load menu items:', error);
            // Fallback to local storage
            this.loadFromLocalStorage();
        }
    }
    
    async loadOrders(forceRefresh = false) {
        const cacheKey = 'orders';
        
        if (!forceRefresh) {
            const cached = this.getCached(cacheKey);
            if (cached) {
                this.state.orders = cached;
                this.updateOrdersDisplay();
                this.updateDashboardStats();
                return;
            }
        }
        
        try {
            const response = await this.apiRequest(`${this.config.API_BASE_URL}/admin/orders`);
            
            if (response && response.orders) {
                this.state.orders = response.orders;
                this.cacheData(cacheKey, this.state.orders);
                this.updateOrdersDisplay();
                this.updateDashboardStats();
                this.updateRecentOrders();
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        }
    }
    
    async loadDashboardStats() {
        try {
            const response = await this.apiRequest(`${this.config.API_BASE_URL}/admin/stats`);
            
            if (response) {
                this.updateStatsDisplay(response);
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            // Calculate from local data
            this.calculateLocalStats();
        }
    }
    
    updateStatsDisplay(stats) {
        const elements = {
            'total-orders': stats.totalOrders || 0,
            'total-sales': `₱${(stats.totalSales || 0).toFixed(2)}`,
            'today-orders': stats.todayOrders || 0,
            'today-sales': `₱${(stats.todaySales || 0).toFixed(2)}`,
            'quick-total-orders': stats.totalOrders || 0,
            'quick-total-sales': `₱${(stats.totalSales || 0).toFixed(0)}`,
            'quick-today-orders': stats.todayOrders || 0,
            'quick-today-sales': `₱${(stats.todaySales || 0).toFixed(0)}`,
            'quick-avg-order': stats.avgOrderValue ? `₱${stats.avgOrderValue.toFixed(0)}` : '₱0'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update sales chart
        this.updateSalesChart(stats);
    }
    
    calculateLocalStats() {
        const totalOrders = this.state.orders.length;
        const totalSales = this.state.orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const today = new Date().toDateString();
        const todayOrders = this.state.orders.filter(order => {
            const orderDate = new Date(order.timestamp || order.orderTime).toDateString();
            return orderDate === today;
        });
        const todaySales = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        
        const localStats = {
            totalOrders,
            totalSales,
            todayOrders: todayOrders.length,
            todaySales,
            avgOrderValue
        };
        
        this.updateStatsDisplay(localStats);
    }
    
    updateSalesChart(stats) {
        const ctx = document.getElementById('sales-chart');
        if (!ctx) return;
        
        // Destroy existing chart if any
        if (window.salesChart) {
            window.salesChart.destroy();
        }
        
        const data = {
            labels: ['Last 7 Days', 'Last 30 Days', 'Total'],
            datasets: [{
                label: 'Sales (₱)',
                data: [
                    stats.last7DaysSales || (stats.todaySales * 7) || 10000,
                    stats.last30DaysSales || (stats.todaySales * 30) || 30000,
                    stats.totalSales || 50000
                ],
                backgroundColor: 'rgba(139, 69, 19, 0.1)',
                borderColor: '#8b4513',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#FF6A00',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        };
        
        window.salesChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(44, 62, 80, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#8b4513',
                        borderWidth: 1,
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
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
    
    updateProductsDisplay() {
        const container = document.getElementById('products-list');
        if (!container) return;
        
        let filteredProducts = this.getAllProducts();
        
        // Apply filters
        if (this.state.filters.products.search) {
            const searchTerm = this.state.filters.products.search.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm)
            );
        }
        
        if (this.state.filters.products.category) {
            filteredProducts = filteredProducts.filter(
                product => product.category === this.state.filters.products.category
            );
        }
        
        if (filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h3>No Products Found</h3>
                    <p>${this.state.filters.products.search || this.state.filters.products.category ? 
                        'No products match your filters' : 
                        'Add your first product to get started'}</p>
                </div>
            `;
            return;
        }
        
        // Pagination
        const totalPages = Math.ceil(filteredProducts.length / this.state.pagination.products.perPage);
        this.state.pagination.products.total = totalPages;
        
        const startIndex = (this.state.pagination.products.current - 1) * this.state.pagination.products.perPage;
        const paginatedProducts = filteredProducts.slice(startIndex, startIndex + this.state.pagination.products.perPage);
        
        container.innerHTML = paginatedProducts.map(product => `
            <div class="product-item" data-product-id="${product._id || product.id}">
                <div class="product-image">
                    <img src="${product.imageUrl || product.image || this.getPlaceholderImage(product.category)}" 
                         alt="${product.name}"
                         onerror="this.src='${this.getPlaceholderImage(product.category)}'">
                </div>
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>${product.description || 'No description available'}</p>
                    <div class="product-meta">
                        <span class="product-category">${product.category}</span>
                        <span class="product-price">₱${product.price.toFixed(2)}</span>
                        <span class="product-status ${product.isAvailable ? 'available' : 'unavailable'}">
                            ${product.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    <div class="product-actions-buttons">
                        <button class="action-btn primary small" onclick="adminPanel.editProduct('${product._id || product.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn danger small" onclick="adminPanel.deleteProduct('${product._id || product.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    updateOrdersDisplay() {
        const tableBody = document.getElementById('orders-table-body');
        const mobileView = document.getElementById('orders-mobile-view');
        
        if (!tableBody || !mobileView) return;
        
        let filteredOrders = [...this.state.orders];
        
        // Apply filters
        if (this.state.filters.orders.status !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === this.state.filters.orders.status);
        }
        
        if (this.state.filters.orders.date) {
            const filterDate = new Date(this.state.filters.orders.date).toDateString();
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.timestamp || order.orderTime).toDateString();
                return orderDate === filterDate;
            });
        }
        
        if (this.state.filters.orders.search) {
            const searchTerm = this.state.filters.orders.search.toLowerCase();
            filteredOrders = filteredOrders.filter(order =>
                order.customerName?.toLowerCase().includes(searchTerm) ||
                order._id?.toLowerCase().includes(searchTerm) ||
                order.items?.some(item => item.name.toLowerCase().includes(searchTerm))
            );
        }
        
        // Sort by date (newest first)
        filteredOrders.sort((a, b) => new Date(b.timestamp || b.orderTime) - new Date(a.timestamp || a.orderTime));
        
        if (filteredOrders.length === 0) {
            tableBody.innerHTML = '';
            mobileView.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No Orders Found</h3>
                    <p>${this.state.filters.orders.search || this.state.filters.orders.date || this.state.filters.orders.status !== 'all' ? 
                        'No orders match your filters' : 
                        'No orders have been placed yet'}</p>
                </div>
            `;
            return;
        }
        
        // Pagination
        const totalPages = Math.ceil(filteredOrders.length / this.state.pagination.orders.perPage);
        this.state.pagination.orders.total = totalPages;
        
        const startIndex = (this.state.pagination.orders.current - 1) * this.state.pagination.orders.perPage;
        const paginatedOrders = filteredOrders.slice(startIndex, startIndex + this.state.pagination.orders.perPage);
        
        // Desktop view
        tableBody.innerHTML = paginatedOrders.map(order => `
            <tr onclick="adminPanel.showOrderDetails('${order._id || order.id}')">
                <td><strong>#${(order._id || '').substring(0, 8)}</strong></td>
                <td>${order.customerName || 'Guest'}</td>
                <td>${this.formatDate(order.timestamp || order.orderTime)}</td>
                <td>${order.items?.length || 0} items</td>
                <td><strong>₱${(order.total || 0).toFixed(2)}</strong></td>
                <td><span class="order-status ${order.status || 'pending'}">${order.status || 'pending'}</span></td>
                <td>
                    <button class="action-btn primary small" onclick="event.stopPropagation(); adminPanel.showOrderDetails('${order._id || order.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Mobile view
        mobileView.innerHTML = paginatedOrders.map(order => `
            <div class="data-card" onclick="adminPanel.showOrderDetails('${order._id || order.id}')">
                <div class="card-field">
                    <strong>Order ID:</strong>
                    <span>#${(order._id || '').substring(0, 8)}</span>
                </div>
                <div class="card-field">
                    <strong>Customer:</strong>
                    <span>${order.customerName || 'Guest'}</span>
                </div>
                <div class="card-field">
                    <strong>Date:</strong>
                    <span>${this.formatDate(order.timestamp || order.orderTime, true)}</span>
                </div>
                <div class="card-field">
                    <strong>Total:</strong>
                    <span>₱${(order.total || 0).toFixed(2)}</span>
                </div>
                <div class="card-field">
                    <strong>Status:</strong>
                    <span class="order-status ${order.status || 'pending'}">${order.status || 'pending'}</span>
                </div>
                <div style="margin-top: 10px;">
                    <button class="action-btn primary small" onclick="event.stopPropagation(); adminPanel.showOrderDetails('${order._id || order.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `).join('');
        
        // Update summary
        this.updateOrdersSummary(filteredOrders);
    }
    
    updateRecentOrders() {
        const container = document.getElementById('recent-orders-list');
        if (!container) return;
        
        const recentOrders = [...this.state.orders]
            .sort((a, b) => new Date(b.timestamp || b.orderTime) - new Date(a.timestamp || a.orderTime))
            .slice(0, 5);
        
        if (recentOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>No Recent Orders</h3>
                    <p>Orders will appear here when customers place them</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recentOrders.map(order => `
            <div class="order-preview-item" onclick="adminPanel.showOrderDetails('${order._id || order.id}')">
                <div class="order-preview-header">
                    <div class="customer-name">${order.customerName || 'Customer'}</div>
                    <div class="order-status ${order.status || 'pending'}">${order.status || 'pending'}</div>
                </div>
                <div class="order-preview-details">
                    <div class="order-items">${order.items?.length || 0} items</div>
                    <div class="order-total">₱${(order.total || 0).toFixed(2)}</div>
                </div>
                <div class="order-preview-footer" style="margin-top: 10px; font-size: 12px; color: #666;">
                    ${this.formatDate(order.timestamp || order.orderTime, true)}
                </div>
            </div>
        `).join('');
    }
    
    updateAvailabilityDisplay() {
        const nachosContainer = document.getElementById('nachos-availability');
        const dessertsContainer = document.getElementById('desserts-availability');
        
        if (nachosContainer && this.state.menuItems.nachos) {
            nachosContainer.innerHTML = this.state.menuItems.nachos.map(item => `
                <div class="availability-item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">₱${item.price.toFixed(2)}</span>
                    <label class="toggle-switch">
                        <input type="checkbox" ${item.isAvailable ? 'checked' : ''} 
                               data-item-name="${item.name}"
                               onchange="adminPanel.toggleItemAvailability('${item.name}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            `).join('');
        }
        
        if (dessertsContainer && this.state.menuItems.desserts) {
            dessertsContainer.innerHTML = this.state.menuItems.desserts.map(item => `
                <div class="availability-item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">₱${item.price.toFixed(2)}</span>
                    <label class="toggle-switch">
                        <input type="checkbox" ${item.isAvailable ? 'checked' : ''} 
                               data-item-name="${item.name}"
                               onchange="adminPanel.toggleItemAvailability('${item.name}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            `).join('');
        }
    }
    
    updateOrdersSummary(orders) {
        const elements = {
            'summary-total': orders.length,
            'summary-pending': orders.filter(o => o.status === 'pending').length,
            'summary-processing': orders.filter(o => o.status === 'processing').length,
            'summary-completed': orders.filter(o => o.status === 'completed').length,
            'summary-cancelled': orders.filter(o => o.status === 'cancelled').length
        };
        
        Object.entries(elements).forEach(([id, count]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = count;
            }
        });
    }
    
    filterAvailability(searchTerm) {
        const items = document.querySelectorAll('.availability-item');
        const term = searchTerm.toLowerCase();
        
        items.forEach(item => {
            const itemName = item.querySelector('.item-name').textContent.toLowerCase();
            item.style.display = itemName.includes(term) ? 'flex' : 'none';
        });
    }
    
    filterProducts() {
        this.state.pagination.products.current = 1;
        this.updateProductsDisplay();
    }
    
    filterOrders() {
        this.state.pagination.orders.current = 1;
        this.updateOrdersDisplay();
    }
    
    showSection(sectionId) {
        // Update current section
        this.state.currentSection = sectionId;
        
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
        
        // Load section-specific data
        switch(sectionId) {
            case 'dashboard':
                this.updateDashboardStats();
                this.updateRecentOrders();
                break;
            case 'availability':
                this.updateAvailabilityDisplay();
                break;
            case 'products':
                this.updateProductsDisplay();
                break;
            case 'orders':
                this.updateOrdersDisplay();
                break;
        }
    }
    
    // API Methods
    async apiRequest(url, options = {}, retryCount = 0) {
        const defaultHeaders = {
            'Authorization': `Bearer ${this.state.adminToken}`,
            'Content-Type': 'application/json'
        };
        
        const config = {
            method: 'GET',
            headers: { ...defaultHeaders, ...options.headers },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired
                    this.logout();
                    throw new Error('Authentication expired');
                }
                
                const error = await response.json().catch(() => ({ message: 'Server error' }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            if (retryCount < this.config.MAX_RETRIES) {
                console.warn(`Retrying request (${retryCount + 1}/${this.config.MAX_RETRIES})...`);
                await this.delay(1000 * (retryCount + 1));
                return this.apiRequest(url, options, retryCount + 1);
            }
            
            throw error;
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Cache Management
    cacheData(key, data, ttl = this.config.CACHE_TTL) {
        const cacheItem = {
            data,
            timestamp: Date.now(),
            ttl
        };
        this.state.cache.set(key, cacheItem);
    }
    
    getCached(key) {
        const item = this.state.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > item.ttl) {
            this.state.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    // Product Management Methods
    showAddProductModal(productId = null) {
        this.editingProductId = productId;
        const modal = document.getElementById('add-product-modal');
        
        if (modal) {
            // Reset form
            this.resetProductForm();
            
            // Set title
            document.getElementById('product-modal-title').innerHTML = productId ? 
                '<i class="fas fa-edit"></i> Edit Product' : 
                '<i class="fas fa-plus-circle"></i> Add New Product';
            
            // Fill form if editing
            if (productId) {
                this.fillProductForm(productId);
            }
            
            modal.style.display = 'flex';
            document.getElementById('product-name').focus();
        }
    }
    
    hideAddProductModal() {
        const modal = document.getElementById('add-product-modal');
        if (modal) {
            modal.style.display = 'none';
            this.editingProductId = null;
            this.resetProductForm();
        }
    }
    
    resetProductForm() {
        const form = document.getElementById('add-product-modal');
        if (form) {
            form.querySelectorAll('input, textarea, select').forEach(element => {
                if (element.type === 'checkbox') {
                    element.checked = true;
                } else {
                    element.value = '';
                }
            });
            
            // Clear errors
            form.querySelectorAll('.error-message').forEach(error => {
                error.classList.remove('show');
            });
            
            form.querySelectorAll('.error').forEach(element => {
                element.classList.remove('error');
            });
            
            // Reset image preview
            this.updateProductImagePreview();
        }
    }
    
    fillProductForm(productId) {
        const product = this.findProductById(productId);
        if (!product) return;
        
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-image').value = product.imageUrl || product.image || '';
        document.getElementById('product-available').checked = product.isAvailable !== false;
        
        this.updateProductImagePreview();
    }
    
    updateProductImagePreview() {
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
    
    async saveProduct() {
        const form = document.getElementById('add-product-modal');
        if (!form) return;
        
        // Validate form
        if (!this.validateProductForm()) {
            this.showNotification('Please fix the errors in the form.', 'error');
            return;
        }
        
        // Get form values
        const productData = {
            name: document.getElementById('product-name').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            description: document.getElementById('product-description').value.trim(),
            imageUrl: document.getElementById('product-image').value.trim(),
            isAvailable: document.getElementById('product-available').checked,
            ingredients: 'Fresh ingredients' // Default for compatibility
        };
        
        // Show loading
        const saveBtn = document.getElementById('save-product-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
        
        try {
            const isNew = !this.editingProductId;
            const url = isNew ? 
                `${this.config.API_BASE_URL}/admin/menu-items` : 
                `${this.config.API_BASE_URL}/admin/menu-items/${this.editingProductId}`;
            
            const method = isNew ? 'POST' : 'PUT';
            
            await this.apiRequest(url, {
                method,
                body: JSON.stringify(productData)
            });
            
            // Show success
            const successMsg = document.getElementById('add-product-success');
            if (successMsg) {
                successMsg.textContent = `✅ Product "${productData.name}" ${isNew ? 'created' : 'updated'} successfully!`;
                successMsg.classList.add('show');
            }
            
            // Refresh data
            await this.loadMenuItems(true);
            
            // Update UI
            if (this.state.currentSection === 'availability') {
                this.updateAvailabilityDisplay();
            }
            
            // Reset button
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
            
            // Close modal after delay for new products
            if (isNew) {
                setTimeout(() => {
                    this.hideAddProductModal();
                }, 2000);
            }
            
        } catch (error) {
            this.showNotification(`❌ Error saving product: ${error.message}`, 'error');
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }
    
    validateProductForm() {
        let isValid = true;
        const form = document.getElementById('add-product-modal');
        
        // Clear previous errors
        form.querySelectorAll('.error-message').forEach(error => {
            error.classList.remove('show');
        });
        
        form.querySelectorAll('.error').forEach(element => {
            element.classList.remove('error');
        });
        
        // Validate required fields
        const requiredFields = [
            { id: 'product-name', errorId: 'name-error', message: 'Product name is required' },
            { id: 'product-price', errorId: 'price-error', message: 'Valid price is required' },
            { id: 'product-category', errorId: 'category-error', message: 'Category is required' }
        ];
        
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            const errorElement = document.getElementById(field.errorId);
            
            if (!element.value.trim() || (field.id === 'product-price' && parseFloat(element.value) <= 0)) {
                isValid = false;
                element.classList.add('error');
                if (errorElement) {
                    errorElement.textContent = field.message;
                    errorElement.classList.add('show');
                }
            }
        });
        
        return isValid;
    }
    
    editProduct(productId) {
        this.showAddProductModal(productId);
    }
    
    async deleteProduct(productId) {
        if (!confirm('⚠️ Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }
        
        try {
            await this.apiRequest(`${this.config.API_BASE_URL}/admin/menu-items/${productId}`, {
                method: 'DELETE'
            });
            
            // Refresh data
            await this.loadMenuItems(true);
            
            this.showNotification('✅ Product deleted successfully!', 'success');
        } catch (error) {
            this.showNotification(`❌ Error deleting product: ${error.message}`, 'error');
        }
    }
    
    // Availability Methods
    async toggleItemAvailability(itemName, isAvailable) {
        try {
            await this.apiRequest(`${this.config.API_BASE_URL}/admin/menu-items/${itemName}/availability`, {
                method: 'PUT',
                body: JSON.stringify({ isAvailable })
            });
            
            // Update local data
            this.updateItemAvailability(itemName, isAvailable);
            
        } catch (error) {
            this.showNotification(`❌ Error updating availability: ${error.message}`, 'error');
            
            // Revert checkbox
            const checkbox = document.querySelector(`input[data-item-name="${itemName}"]`);
            if (checkbox) {
                checkbox.checked = !isAvailable;
            }
        }
    }
    
    async resetAllAvailability() {
        if (!confirm('Are you sure you want to mark ALL items as available?')) return;
        
        try {
            const updates = this.getAllProducts().map(item => ({
                name: item.name,
                isAvailable: true
            }));
            
            await this.apiRequest(`${this.config.API_BASE_URL}/admin/menu-items/availability/batch`, {
                method: 'PUT',
                body: JSON.stringify({ updates })
            });
            
            // Update local data
            this.getAllProducts().forEach(item => {
                item.isAvailable = true;
            });
            
            // Update UI
            this.updateAvailabilityDisplay();
            
            this.showNotification('✅ All items marked as available!', 'success');
        } catch (error) {
            this.showNotification(`❌ Error resetting availability: ${error.message}`, 'error');
        }
    }
    
    async toggleAllAvailability() {
        const allItems = this.getAllProducts();
        const allAvailable = allItems.every(item => item.isAvailable);
        
        try {
            const updates = allItems.map(item => ({
                name: item.name,
                isAvailable: !allAvailable
            }));
            
            await this.apiRequest(`${this.config.API_BASE_URL}/admin/menu-items/availability/batch`, {
                method: 'PUT',
                body: JSON.stringify({ updates })
            });
            
            // Update local data
            allItems.forEach(item => {
                item.isAvailable = !allAvailable;
            });
            
            // Update UI
            this.updateAvailabilityDisplay();
            
            this.showNotification(`✅ All items ${!allAvailable ? 'enabled' : 'disabled'}!`, 'success');
        } catch (error) {
            this.showNotification(`❌ Error toggling availability: ${error.message}`, 'error');
        }
    }
    
    async saveAvailabilityChanges() {
        const checkboxes = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
        const updates = [];
        
        checkboxes.forEach(checkbox => {
            const itemName = checkbox.dataset.itemName;
            const isAvailable = checkbox.checked;
            const item = this.findProductByName(itemName);
            
            if (item && item.isAvailable !== isAvailable) {
                updates.push({ name: itemName, isAvailable });
            }
        });
        
        if (updates.length === 0) {
            this.showNotification('✅ No changes to save.', 'info');
            return;
        }
        
        try {
            await this.apiRequest(`${this.config.API_BASE_URL}/admin/menu-items/availability/batch`, {
                method: 'PUT',
                body: JSON.stringify({ updates })
            });
            
            // Update local data
            updates.forEach(update => {
                this.updateItemAvailability(update.name, update.isAvailable);
            });
            
            this.showNotification(`✅ ${updates.length} availability changes saved!`, 'success');
        } catch (error) {
            this.showNotification(`❌ Error saving availability changes: ${error.message}`, 'error');
        }
    }
    
    // Order Methods
    showOrderDetails(orderId) {
        const order = this.state.orders.find(o => o._id === orderId || o.id === orderId);
        if (!order) {
            this.showNotification('Order not found!', 'error');
            return;
        }
        
        const modal = document.getElementById('order-details-modal');
        const content = document.getElementById('order-details-content');
        
        if (modal && content) {
            content.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <h4 style="color: #8b4513; margin-bottom: 10px;">Order Info</h4>
                        <p><strong>Order ID:</strong> ${(order._id || '').substring(6, 12) || 'N/A'}</p>
                        <p><strong>Customer:</strong> ${order.customerName || 'Unknown'}</p>
                        <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                        <p><strong>Date:</strong> ${this.formatDate(order.timestamp || order.orderTime)}</p>
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 10px;">
                        <h4 style="color: #8b4513; margin-bottom: 10px;">Payment & Status</h4>
                        <p><strong>Status:</strong> <span class="order-status ${order.status || 'pending'}">${order.status || 'pending'}</span></p>
                        <p><strong>Total:</strong> <span style="color: #FF6A00; font-weight: bold;">₱${(order.total || 0).toFixed(2)}</span></p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Cash'}</p>
                        <p><strong>Pickup Time:</strong> ${order.pickupTime || 'ASAP'}</p>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4 style="color: #8b4513; margin-bottom: 15px;">Order Items:</h4>
                    <div style="background: white; border-radius: 10px; overflow: hidden; border: 1px solid #eee;">
                        ${(order.items || []).map(item => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; background: #f8f9fa;">
                                <div style="flex: 1;">
                                    <strong>${item.name}</strong>
                                    <div style="font-size: 12px; color: #666;">Qty: ${item.quantity || 1}</div>
                                </div>
                                <div style="color: #FF6A00; font-weight: bold;">
                                    ₱${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            modal.style.display = 'flex';
        }
    }
    
    exportOrders() {
        const ordersToExport = [...this.state.orders];
        
        // Convert to CSV
        const headers = ['Order ID', 'Customer', 'Date', 'Status', 'Total', 'Items Count', 'Payment Method'];
        const csvData = ordersToExport.map(order => [
            (order._id || '').substring(6, 12) || 'N/A',
            order.customerName || 'Customer',
            this.formatDate(order.timestamp || order.orderTime, false, true),
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
        this.downloadCSV(csv, `orders-${new Date().toISOString().split('T')[0]}.csv`);
        
        this.showNotification('✅ Orders exported successfully!', 'success');
    }
    
    exportProducts() {
        const products = this.getAllProducts();
        
        const headers = ['Name', 'Category', 'Price', 'Description', 'Available', 'Image URL'];
        const csvData = products.map(product => [
            product.name,
            product.category,
            `₱${product.price.toFixed(2)}`,
            product.description || '',
            product.isAvailable ? 'Yes' : 'No',
            product.imageUrl || product.image || ''
        ]);
        
        let csv = headers.join(',') + '\n';
        csvData.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        this.downloadCSV(csv, `products-${new Date().toISOString().split('T')[0]}.csv`);
        this.showNotification('✅ Products exported successfully!', 'success');
    }
    
    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Real-time Updates
    startRealTimeUpdates() {
        // Clear existing intervals
        Object.values(this.state.updateIntervals).forEach(clearInterval);
        
        // Start new intervals
        this.state.updateIntervals.orders = setInterval(() => {
            if (this.state.currentSection === 'dashboard' || this.state.currentSection === 'orders') {
                this.loadOrders(true);
            }
        }, this.config.POLLING_INTERVAL);
        
        this.state.updateIntervals.stats = setInterval(() => {
            if (this.state.currentSection === 'dashboard') {
                this.loadDashboardStats();
            }
        }, this.config.POLLING_INTERVAL * 2);
    }
    
    // Utility Methods
    formatDate(dateString, short = false, csvFormat = false) {
        const date = new Date(dateString);
        
        if (csvFormat) {
            return date.toISOString().split('T')[0];
        }
        
        if (short) {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    
    getPlaceholderImage(category) {
        return category === 'nachos' ? 
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOGI0NTEzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSJ3aGl0ZSI+TjwvdGV4dD48L3N2Zz4=' :
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTk1MTAwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSJ3aGl0ZSI+RDwvdGV4dD48L3N2Zz4=';
    }
    
    getAllProducts() {
        return [...this.state.menuItems.nachos, ...this.state.menuItems.desserts];
    }
    
    findProductById(productId) {
        return this.getAllProducts().find(p => (p._id || p.id) === productId);
    }
    
    findProductByName(productName) {
        return this.getAllProducts().find(p => p.name === productName);
    }
    
    updateItemAvailability(itemName, isAvailable) {
        for (let category in this.state.menuItems) {
            const item = this.state.menuItems[category].find(p => p.name === itemName);
            if (item) {
                item.isAvailable = isAvailable;
                break;
            }
        }
    }
    
    organizeByCategory(items) {
        return {
            nachos: items.filter(item => item.category === 'nachos'),
            desserts: items.filter(item => item.category === 'desserts')
        };
    }
    
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('menuItems');
            if (stored) {
                this.state.menuItems = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
    }
    
    // UI Helper Methods
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    showGlobalLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    }
    
    hideGlobalLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    showLoginModal() {
        // You can implement a login modal here
        window.location.href = 'login.html';
    }
    
    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRole');
        window.location.href = 'index.html';
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    toggleKeyboardShortcuts() {
        const shortcuts = document.getElementById('keyboard-shortcuts');
        if (shortcuts) {
            shortcuts.classList.toggle('show');
        }
    }
    
    refreshAllData() {
        this.showNotification('Refreshing all data...', 'info');
        this.loadInitialData();
    }
    
    refreshCurrentSection() {
        switch(this.state.currentSection) {
            case 'dashboard':
                this.loadDashboardStats();
                break;
            case 'orders':
                this.loadOrders(true);
                break;
            case 'products':
                this.loadMenuItems(true);
                break;
            case 'availability':
                this.updateAvailabilityDisplay();
                break;
        }
    }
    
    // SuperAdmin Methods
    addSuperAdminFeatures() {
        // Add SuperAdmin nav button
        const adminNav = document.querySelector('.admin-nav');
        if (adminNav && !document.querySelector('.admin-nav-btn[data-section="superadmin"]')) {
            const superAdminBtn = document.createElement('button');
            superAdminBtn.className = 'admin-nav-btn';
            superAdminBtn.setAttribute('data-section', 'superadmin');
            superAdminBtn.innerHTML = '<i class="fas fa-user-crown"></i> SuperAdmin';
            superAdminBtn.addEventListener('click', () => this.showSection('superadmin'));
            adminNav.appendChild(superAdminBtn);
        }
        
        // Add SuperAdmin section
        const adminSections = document.querySelector('.admin-sections');
        if (adminSections && !document.getElementById('superadmin-section')) {
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
                            <button class="action-btn secondary" onclick="adminPanel.showSuperAdminSettings()">
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
                                <button class="action-btn secondary" onclick="adminPanel.backupData()">
                                    <i class="fas fa-download"></i> Backup
                                </button>
                                <button class="action-btn danger" onclick="adminPanel.resetDemoData()">
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
                            <button class="action-btn secondary" onclick="adminPanel.manageUsers()">
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
        }
    }
    
    showSuperAdminSettings() {
        this.showNotification('SuperAdmin settings feature coming soon!', 'info');
    }
    
    backupData() {
        const backupData = {
            menuItems: this.state.menuItems,
            orders: this.state.orders,
            settings: JSON.parse(localStorage.getItem('superAdminSettings') || '{}'),
            backupDate: new Date().toISOString(),
            backupVersion: '2.0'
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = `ai-nachos-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showNotification('✅ Data backup completed successfully!', 'success');
    }
    
    resetDemoData() {
        if (confirm('⚠️ Are you sure you want to reset all demo data? This will clear all local data but keep server data.')) {
            // Clear localStorage except admin credentials
            const adminToken = localStorage.getItem('adminToken');
            const adminRole = localStorage.getItem('adminRole');
            const superAdminSettings = localStorage.getItem('superAdminSettings');
            
            localStorage.clear();
            
            // Restore admin data
            if (adminToken) localStorage.setItem('adminToken', adminToken);
            if (adminRole) localStorage.setItem('adminRole', adminRole);
            if (superAdminSettings) localStorage.setItem('superAdminSettings', superAdminSettings);
            
            this.showNotification('✅ Demo data reset successfully! Refreshing...', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }
    
    manageUsers() {
        this.showNotification('User management feature coming soon!', 'info');
    }
    
    initCharts() {
        // Initialize charts if needed
    }
}

// Initialize the admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new EnhancedAdminPanel();
});

// Make methods available globally for inline event handlers
window.showOrderDetails = (orderId) => window.adminPanel?.showOrderDetails(orderId);
window.editProduct = (productId) => window.adminPanel?.editProduct(productId);
window.deleteProduct = (productId) => window.adminPanel?.deleteProduct(productId);
window.toggleItemAvailability = (itemName, isAvailable) => window.adminPanel?.toggleItemAvailability(itemName, isAvailable);
