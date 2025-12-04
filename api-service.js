// api-service.js - Central API service for all HTTP requests

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8080/api' 
    : '/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('adminToken');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('adminToken', token);
        } else {
            localStorage.removeItem('adminToken');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: 'Network response was not ok'
            }));
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    // Public APIs
    async getAvailability() {
        try {
            const response = await fetch(`${API_BASE_URL}/availability`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching availability:', error);
            throw error;
        }
    }

    async getMenuItems(category = null) {
        try {
            const url = category 
                ? `${API_BASE_URL}/menu-items?category=${category}`
                : `${API_BASE_URL}/menu-items`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching menu items:', error);
            throw error;
        }
    }

    // Admin APIs
    async adminLogin(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Admin login error:', error);
            throw error;
        }
    }

    async verifyAdminRole() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify-role`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Verify admin role error:', error);
            throw error;
        }
    }

    async getAdminMenuItems() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/menu-items`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching admin menu items:', error);
            throw error;
        }
    }

    async updateItemAvailability(itemName, isAvailable) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/menu-items/${encodeURIComponent(itemName)}/availability`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ isAvailable })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error updating availability:', error);
            throw error;
        }
    }

    async batchUpdateAvailability(updates) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/menu-items/availability/batch`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ updates })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error batch updating availability:', error);
            throw error;
        }
    }

    async getDashboardStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }

    async submitOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(orderData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error submitting order:', error);
            throw error;
        }
    }

    // Polling functionality
    startAvailabilityPolling(callback, interval = 30000) {
        this.stopAvailabilityPolling();
        
        this.availabilityInterval = setInterval(async () => {
            try {
                const availability = await this.getAvailability();
                if (callback && typeof callback === 'function') {
                    callback(availability);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, interval);
        
        return this.availabilityInterval;
    }

    stopAvailabilityPolling() {
        if (this.availabilityInterval) {
            clearInterval(this.availabilityInterval);
            this.availabilityInterval = null;
        }
    }
}

// Create a singleton instance
const apiService = new ApiService();
window.apiService = apiService;