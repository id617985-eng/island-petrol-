// availability-service.js - Real-time availability management

class AvailabilityService {
    constructor() {
        this.availability = {};
        this.listeners = [];
        this.isPolling = false;
        this.pollingInterval = null;
    }

    // Initialize with API service
    init(apiService) {
        this.apiService = apiService;
    }

    // Get current availability
    getAvailability() {
        return { ...this.availability };
    }

    // Check if item is available
    isItemAvailable(itemName) {
        // Default to true if item not in availability list
        return this.availability[itemName] !== false;
    }

    // Update availability from server
    async fetchAvailability() {
        try {
            if (!this.apiService) {
                console.warn('API service not initialized');
                const localAvailability = JSON.parse(localStorage.getItem('itemAvailability') || '{}');
                this.availability = localAvailability;
                this.notifyListeners();
                return this.availability;
            }
            
            const newAvailability = await this.apiService.getAvailability();
            
            // Check if availability has changed
            const hasChanged = JSON.stringify(this.availability) !== JSON.stringify(newAvailability);
            
            if (hasChanged) {
                this.availability = newAvailability;
                this.notifyListeners();
                console.log('Availability updated from server');
            }
            
            return this.availability;
        } catch (error) {
            console.error('Error fetching availability:', error);
            // Fallback to localStorage if API fails
            const localAvailability = JSON.parse(localStorage.getItem('itemAvailability') || '{}');
            this.availability = localAvailability;
            return this.availability;
        }
    }

    // Start polling for updates
    startPolling(interval = 30000) {
        if (this.isPolling) return;
        
        this.isPolling = true;
        
        // Initial fetch
        this.fetchAvailability();
        
        // Start polling
        this.pollingInterval = setInterval(() => {
            this.fetchAvailability();
        }, interval);
        
        console.log(`Started availability polling every ${interval}ms`);
    }

    // Stop polling
    stopPolling() {
        this.isPolling = false;
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('Stopped availability polling');
        }
    }

    // Subscribe to availability changes
    subscribe(callback) {
        if (typeof callback !== 'function') {
            console.error('Callback must be a function');
            return () => {};
        }
        
        this.listeners.push(callback);
        
        // Call immediately with current availability
        callback(this.availability);
        
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.availability);
            } catch (error) {
                console.error('Error in availability listener:', error);
            }
        });
    }

    // Update availability locally (for admin panel)
    updateLocalAvailability(itemName, isAvailable) {
        this.availability[itemName] = isAvailable;
        this.notifyListeners();
    }
}

// Create a singleton instance
const availabilityService = new AvailabilityService();
window.availabilityService = availabilityService;