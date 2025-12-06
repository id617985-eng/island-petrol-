// SuperAdmin Settings Management

document.addEventListener('DOMContentLoaded', function() {
    console.log('SuperAdmin module loaded');
    
    // Initialize SuperAdmin section
    initSuperAdminSection();
    
    // Load current settings
    loadSuperAdminSettings();
});

function initSuperAdminSection() {
    // Configure Admin Button button
    const configureBtn = document.getElementById('configure-admin-button');
    if (configureBtn) {
        configureBtn.addEventListener('click', function() {
            showSuperAdminSettingsModal();
        });
    }
    
    // Save settings button
    const saveSettingsBtn = document.getElementById('save-superadmin-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSuperAdminSettings);
    }
    
    // Close settings modal button
    const closeSettingsBtn = document.getElementById('close-superadmin-settings');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', function() {
            hideModal('superadmin-settings-modal');
        });
    }
    
    // Data backup button
    const backupBtn = document.getElementById('backup-data');
    if (backupBtn) {
        backupBtn.addEventListener('click', backupData);
    }
    
    // Reset demo data button
    const resetBtn = document.getElementById('reset-demo-data');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetDemoData);
    }
    
    // User management button
    const usersBtn = document.getElementById('manage-users');
    if (usersBtn) {
        usersBtn.addEventListener('click', manageUsers);
    }
}

function loadSuperAdminSettings() {
    // Get current settings from localStorage
    const settings = JSON.parse(localStorage.getItem('superAdminSettings') || '{}');
    
    // Set default values if not present
    const defaultSettings = {
        showAdminButton: true,
        liveOrders: true,
        chartAnimation: true,
        lastUpdated: new Date().toISOString()
    };
    
    const currentSettings = { ...defaultSettings, ...settings };
    
    // Update UI display
    updateSettingsDisplay(currentSettings);
    
    // Update modal checkboxes
    updateSettingsModal(currentSettings);
    
    console.log('Loaded SuperAdmin settings:', currentSettings);
}

function updateSettingsDisplay(settings) {
    const adminButtonStatus = document.getElementById('admin-button-status');
    const liveOrdersStatus = document.getElementById('live-orders-status');
    const chartAnimationStatus = document.getElementById('chart-animation-status');
    
    if (adminButtonStatus) {
        adminButtonStatus.textContent = settings.showAdminButton ? 'Enabled' : 'Disabled';
        adminButtonStatus.className = `setting-value ${settings.showAdminButton ? 'enabled' : 'disabled'}`;
    }
    
    if (liveOrdersStatus) {
        liveOrdersStatus.textContent = settings.liveOrders ? 'Enabled' : 'Disabled';
        liveOrdersStatus.className = `setting-value ${settings.liveOrders ? 'enabled' : 'disabled'}`;
    }
    
    if (chartAnimationStatus) {
        chartAnimationStatus.textContent = settings.chartAnimation ? 'Enabled' : 'Disabled';
        chartAnimationStatus.className = `setting-value ${settings.chartAnimation ? 'enabled' : 'disabled'}`;
    }
}

function updateSettingsModal(settings) {
    const toggleAdminButton = document.getElementById('toggle-admin-button');
    const toggleLiveOrders = document.getElementById('toggle-live-orders');
    const toggleChartAnimation = document.getElementById('toggle-sales-chart');
    
    if (toggleAdminButton) toggleAdminButton.checked = settings.showAdminButton;
    if (toggleLiveOrders) toggleLiveOrders.checked = settings.liveOrders;
    if (toggleChartAnimation) toggleChartAnimation.checked = settings.chartAnimation;
}

function showSuperAdminSettingsModal() {
    showModal('superadmin-settings-modal');
}

function saveSuperAdminSettings() {
    // Get values from checkboxes
    const showAdminButton = document.getElementById('toggle-admin-button').checked;
    const liveOrders = document.getElementById('toggle-live-orders').checked;
    const chartAnimation = document.getElementById('toggle-sales-chart').checked;
    
    // Create settings object
    const settings = {
        showAdminButton: showAdminButton,
        liveOrders: liveOrders,
        chartAnimation: chartAnimation,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin'
    };
    
    // Save to localStorage
    localStorage.setItem('superAdminSettings', JSON.stringify(settings));
    
    // Update display
    updateSettingsDisplay(settings);
    
    // Show success message
    showCustomAlert('Settings saved successfully!', 'success');
    
    // Close modal
    hideModal('superadmin-settings-modal');
    
    console.log('Saved SuperAdmin settings:', settings);
}

function backupData() {
    // Gather all data from localStorage
    const backupData = {
        superAdminSettings: JSON.parse(localStorage.getItem('superAdminSettings') || '{}'),
        slideshowSlides: JSON.parse(localStorage.getItem('slideshowSlides') || '[]'),
        orders: JSON.parse(localStorage.getItem('orders') || '[]'),
        products: JSON.parse(localStorage.getItem('products') || '[]'),
        backupDate: new Date().toISOString(),
        backupVersion: '1.0'
    };
    
    // Create download link
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ai-nachos-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showCustomAlert('Data backup completed successfully!', 'success');
}

function resetDemoData() {
    if (confirm('Are you sure you want to reset all data to demo defaults? This action cannot be undone.')) {
        // Clear all data except superadmin settings
        const superAdminSettings = JSON.parse(localStorage.getItem('superAdminSettings') || '{}');
        
        // Clear other data
        localStorage.removeItem('slideshowSlides');
        localStorage.removeItem('orders');
        localStorage.removeItem('products');
        
        // Restore superadmin settings
        localStorage.setItem('superAdminSettings', JSON.stringify(superAdminSettings));
        
        showCustomAlert('Demo data reset successfully! Please refresh the page.', 'success');
        
        // Refresh after 2 seconds
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
}

function manageUsers() {
    showCustomAlert('User management feature coming soon!', 'info');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function showCustomAlert(message, type = 'info') {
    const alertModal = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('custom-alert-message');
    
    if (alertModal && alertMessage) {
        alertMessage.textContent = message;
        alertModal.style.display = 'flex';
    }
}