// Sync products from admin to menu pages
function syncProductsToPages() {
    // Get all products from localStorage
    const allProducts = JSON.parse(localStorage.getItem('allProducts') || '[]');
    
    // Separate by category
    const nachos = allProducts.filter(p => p.category === 'nachos' && p.available !== false);
    const desserts = allProducts.filter(p => p.category === 'desserts' && p.available !== false);
    
    // Save to page-specific storage
    localStorage.setItem('nachosMenu', JSON.stringify(nachos));
    localStorage.setItem('dessertsMenu', JSON.stringify(desserts));
    
    console.log(`Synced ${nachos.length} nachos and ${desserts.length} desserts`);
    return { nachos, desserts };
}

// Update menu pages dynamically
function updateMenuPages() {
    const { nachos, desserts } = syncProductsToPages();
    
    // You can call this function when products are updated in admin
    return { nachos, desserts };
}

// Initialize sync on page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin.html')) {
        // Only sync if we're in admin
        syncProductsToPages();
    }
});

// Export for use in other files
window.syncProductsToPages = syncProductsToPages;
window.updateMenuPages = updateMenuPages;