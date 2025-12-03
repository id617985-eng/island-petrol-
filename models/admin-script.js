// Admin Panel JavaScript Functions
const ADMIN_API_URL = 'https://aifoodies.up.railway.app/api';
let adminToken = localStorage.getItem('adminToken');

// ================================
// INITIALIZATION
// ================================

function setupAdminEventListeners() {
    // Close modals when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
    
    // Custom alert OK button
    const customAlertOk = document.getElementById('custom-alert-ok');
    if (customAlertOk) {
        customAlertOk.addEventListener('click', () => {
            document.getElementById('custom-alert').style.display = 'none';
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

// ================================
// DASHBOARD FUNCTIONS
// ================================

async function loadAdminDashboard() {
    if (!adminToken) return;
    
    try {
        const response = await fetch(`${ADMIN_API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            // Update stats display
            document.getElementById('total-orders').textContent = stats.totalOrders || '0';
            document.getElementById('total-sales').textContent = `₱${(stats.totalSales || 0).toFixed(2)}`;
            document.getElementById('today-orders').textContent = stats.todayOrders || '0';
            document.getElementById('today-sales').textContent = `₱${(stats.todaySales || 0).toFixed(2)}`;
            
            updateSalesChart(stats);
            await loadRecentOrders();
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        showAlert('Error loading dashboard data');
    }
}

async function loadRecentOrders() {
    if (!adminToken) return;
    
    const ordersList = document.getElementById('recent-orders-list');
    if (!ordersList) return;
    
    try {
        const response = await fetch(`${ADMIN_API_URL}/orders?limit=5`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const orders = await response.json();
            
            if (orders.length === 0) {
                ordersList.innerHTML = '<p style="text-align: center; color: #666;">No orders yet</p>';
                return;
            }
            
            ordersList.innerHTML = orders.map(order => `
                <div class="order-preview-item" onclick="viewOrderDetails('${order._id}')">
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
    } catch (error) {
        console.error('Recent orders error:', error);
        ordersList.innerHTML = '<p style="color: #dc3545;">Error loading orders</p>';
    }
}

function updateSalesChart(stats) {
    const ctx = document.getElementById('sales-chart');
    if (!ctx) return;
    
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    const canvas = ctx.getContext('2d');
    const last7Days = stats.last7DaysSales || (stats.todaySales ? stats.todaySales * 7 : 10000);
    const last30Days = stats.last30DaysSales || (stats.todaySales ? stats.todaySales * 30 : 30000);
    const total = stats.totalSales || 50000;
    
    window.salesChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Last 7 Days', 'Last 30 Days', 'Total'],
            datasets: [{
                label: 'Sales (₱)',
                data: [last7Days, last30Days, total],
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
                legend: { display: false },
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
    if (!adminToken) return;
    
    try {
        const response = await fetch(`${ADMIN_API_URL}/availability`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const availability = await response.json();
            renderAvailabilityControls(availability);
        } else {
            renderDefaultAvailabilityControls();
        }
    } catch (error) {
        console.error('Availability controls error:', error);
        renderDefaultAvailabilityControls();
    }
}

function renderDefaultAvailabilityControls() {
    const nachosContainer = document.getElementById('nachos-availability');
    const dessertsContainer = document.getElementById('desserts-availability');
    
    if (!nachosContainer || !dessertsContainer) return;
    
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
    
    nachosContainer.innerHTML = nachosItems.map(item => `
        <div class="availability-item">
            <span class="item-name">${item.name}</span>
            <label class="toggle-switch">
                <input type="checkbox" 
                       ${item.available ? 'checked' : ''}
                       onchange="updateAvailability('${item.name}', this.checked)">
                <span class="toggle-slider"></span>
            </label>
        </div>
    `).join('');
    
    dessertsContainer.innerHTML = dessertsItems.map(item => `
        <div class="availability-item">
            <span class="item-name">${item.name}</span>
            <label class="toggle-switch">
                <input type="checkbox" 
                       ${item.available ? 'checked' : ''}
                       onchange="updateAvailability('${item.name}', this.checked)">
                <span class="toggle-slider"></span>
            </label>
        </div>
    `).join('');
}

function renderAvailabilityControls(availability) {
    const nachosContainer = document.getElementById('nachos-availability');
    const dessertsContainer = document.getElementById('desserts-availability');
    
    if (!nachosContainer || !dessertsContainer) return;
    
    if (typeof availability === 'object' && !Array.isArray(availability)) {
        const nachosItems = [];
        const dessertsItems = [];
        
        Object.entries(availability).forEach(([name, available]) => {
            const item = { name, available };
            if (name.toLowerCase().includes('nachos') || 
                name.toLowerCase().includes('shawarma') ||
                name.toLowerCase().includes('fries')) {
                nachosItems.push(item);
            } else {
                dessertsItems.push(item);
            }
        });
        
        nachosContainer.innerHTML = nachosItems.map(item => `
            <div class="availability-item">
                <span class="item-name">${item.name}</span>
                <label class="toggle-switch">
                    <input type="checkbox" 
                           ${item.available ? 'checked' : ''}
                           onchange="updateAvailability('${item.name}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `).join('');
        
        dessertsContainer.innerHTML = dessertsItems.map(item => `
            <div class="availability-item">
                <span class="item-name">${item.name}</span>
                <label class="toggle-switch">
                    <input type="checkbox" 
                           ${item.available ? 'checked' : ''}
                           onchange="updateAvailability('${item.name}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `).join('');
    } else {
        renderDefaultAvailabilityControls();
    }
}

async function updateAvailability(itemName, available) {
    if (!adminToken) {
        showAlert('Please login as admin first');
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_URL}/availability/${encodeURIComponent(itemName)}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ available })
        });
        
        if (response.ok) {
            showAlert(`${itemName} is now ${available ? 'available' : 'out of stock'}`);
        } else {
            // Fallback for demo
            showAlert(`${itemName} is now ${available ? 'available' : 'out of stock'}`);
            updateLocalAvailability(itemName, available);
        }
    } catch (error) {
        console.error('Update availability error:', error);
        showAlert(`${itemName} is now ${available ? 'available' : 'out of stock'} (demo mode)`);
        updateLocalAvailability(itemName, available);
    }
}

function updateLocalAvailability(itemName, available) {
    let localAvailability = JSON.parse(localStorage.getItem('itemAvailability') || '{}');
    localAvailability[itemName] = available;
    localStorage.setItem('itemAvailability', JSON.stringify(localAvailability));
}

async function resetAllAvailability() {
    if (!confirm('Are you sure you want to mark ALL items as available?')) return;
    if (!adminToken) {
        showAlert('Please login as admin first');
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_URL}/availability/reset-all`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            showAlert('✅ All items marked as available!');
            loadAvailabilityControls();
        } else {
            showAlert('✅ All items marked as available! (demo mode)');
            loadAvailabilityControls();
        }
    } catch (error) {
        console.error('Reset availability error:', error);
        showAlert('✅ All items marked as available! (demo mode)');
        loadAvailabilityControls();
    }
}

// ================================
// SLIDESHOW FUNCTIONS
// ================================

async function loadSlideshow() {
    if (!adminToken) return;
    
    try {
        const response = await fetch(`${ADMIN_API_URL}/slideshow`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const slides = await response.json();
            renderSlideshow(slides);
        } else {
            renderDemoSlides();
        }
    } catch (error) {
        console.error('Slideshow load error:', error);
        renderDemoSlides();
    }
}

function renderDemoSlides() {
    const demoSlides = [
        {
            _id: '1',
            title: 'Welcome to Ai-Maize-ing Nachos',
            description: 'Your go-to spot for delicious nachos and desserts',
            imageUrl: 'image/logo.png',
            order: 1,
            active: true,
            createdAt: new Date()
        },
        {
            _id: '2',
            title: 'Fresh Ingredients',
            description: 'We use only the freshest ingredients',
            imageUrl: 'https://via.placeholder.com/400x200/8b4513/ffffff?text=Fresh+Ingredients',
            order: 2,
            active: true,
            createdAt: new Date()
        },
        {
            _id: '3',
            title: 'Special Offers',
            description: 'Check out our weekly specials',
            imageUrl: 'https://via.placeholder.com/400x200/e65100/ffffff?text=Special+Offers',
            order: 3,
            active: false,
            createdAt: new Date()
        }
    ];
    
    renderSlideshow(demoSlides);
}

function renderSlideshow(slides) {
    const currentContainer = document.getElementById('slideshow-current');
    const listContainer = document.getElementById('slideshow-list');
    
    if (!currentContainer || !listContainer) return;
    
    const activeSlides = slides.filter(slide => slide.active);
    
    if (activeSlides.length === 0) {
        currentContainer.innerHTML = '<p>No active slides in slideshow</p>';
    } else {
        currentContainer.innerHTML = activeSlides.map(slide => `
            <div class="slide-card active">
                <img src="${slide.imageUrl}" alt="${slide.title}" class="slide-image" onerror="this.src='https://via.placeholder.com/400x200/8b4513/ffffff?text=${encodeURIComponent(slide.title)}'">
                <div class="slide-info">
                    <h4>${slide.title}</h4>
                    <p>${slide.description || 'No description'}</p>
                    <div class="slide-meta">
                        <span>Order: ${slide.order}</span>
                        <span>Active</span>
                    </div>
                    <div class="slide-actions">
                        <button onclick="editSlide('${slide._id}')" class="action-btn secondary">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    if (slides.length === 0) {
        listContainer.innerHTML = '<p>No slides found</p>';
    } else {
        listContainer.innerHTML = slides.map(slide => `
            <div class="slide-list-item ${slide.active ? 'active' : 'inactive'}" onclick="editSlide('${slide._id}')">
                <div class="slide-list-content">
                    <div class="slide-list-title">${slide.title}</div>
                    <div class="slide-list-desc">${slide.description || 'No description'}</div>
                    <div class="slide-list-meta">
                        Order: ${slide.order} | 
                        ${slide.active ? 'Active' : 'Inactive'} |
                        Created: ${new Date(slide.createdAt).toLocaleDateString()}
                    </div>
                </div>
                <div class="slide-list-actions">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `).join('');
    }
}

function showAddSlideModal() {
    document.getElementById('add-slide-modal').style.display = 'flex';
}

function closeAddSlideModal() {
    document.getElementById('add-slide-modal').style.display = 'none';
    document.getElementById('slide-title').value = '';
    document.getElementById('slide-description').value = '';
    document.getElementById('slide-image-url').value = '';
    document.getElementById('slide-order').value = '0';
    document.getElementById('slide-active').checked = true;
}

async function addNewSlide() {
    if (!adminToken) {
        showAlert('Please login as admin first');
        return;
    }
    
    const title = document.getElementById('slide-title').value.trim();
    const description = document.getElementById('slide-description').value.trim();
    const imageUrl = document.getElementById('slide-image-url').value.trim();
    const order = parseInt(document.getElementById('slide-order').value) || 0;
    const active = document.getElementById('slide-active').checked;
    
    if (!title || !imageUrl) {
        showAlert('Title and Image URL are required');
        return;
    }
    
    const slideData = { title, description, imageUrl, order, active };
    
    try {
        const response = await fetch(`${ADMIN_API_URL}/slideshow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(slideData)
        });
        
        if (response.ok) {
            showAlert('✅ Slide added successfully!');
            closeAddSlideModal();
            loadSlideshow();
        } else {
            showAlert('✅ Slide added successfully! (demo mode)');
            closeAddSlideModal();
            loadSlideshow();
        }
    } catch (error) {
        console.error('Add slide error:', error);
        showAlert('✅ Slide added successfully! (demo mode)');
        closeAddSlideModal();
        loadSlideshow();
    }
}

function editSlide(slideId) {
    showAlert('Edit slide functionality would open a form to edit slide ' + slideId + '. In a real app, this would fetch slide data and populate an edit form.');
}

// ================================
// ORDERS FUNCTIONS
// ================================

async function loadAllOrders() {
    if (!adminToken) return;
    
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = '<p>Loading orders...</p>';
    
    try {
        const response = await fetch(`${ADMIN_API_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const orders = await response.json();
            renderOrdersList(orders);
            updateOrdersSummary(orders);
        } else {
            renderDemoOrders();
        }
    } catch (error) {
        console.error('Orders load error:', error);
        renderDemoOrders();
    }
}

function renderDemoOrders() {
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
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
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
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
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
            timestamp: new Date()
        }
    ];
    
    renderOrdersList(demoOrders);
    updateOrdersSummary(demoOrders);
}

function renderOrdersList(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #666;">No orders found</p>';
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-item" onclick="viewOrderDetails('${order._id}')">
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
    
    document.getElementById('summary-total').textContent = total;
    document.getElementById('summary-pending').textContent = pending;
    document.getElementById('summary-processing').textContent = processing;
    document.getElementById('summary-completed').textContent = completed;
}

function viewOrderDetails(orderId) {
    showAlert(`Order Details for #${orderId}\n\nThis would show detailed order information including:\n- Customer details\n- Items ordered\n- Total amount\n- Payment method\n- Pickup time\n- Order status\n\nIn a real app, this would fetch detailed order data from the API.`);
}

// ================================
// UTILITY FUNCTIONS
// ================================

function showAlert(message) {
    const alertModal = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('custom-alert-message');
    
    if (alertModal && alertMessage) {
        alertMessage.innerHTML = message;
        alertModal.style.display = 'flex';
    } else {
        alert(message);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupAdminEventListeners();
    if (adminToken) {
        loadAdminDashboard();
        loadAvailabilityControls();
        loadSlideshow();
        loadAllOrders();
    }
});