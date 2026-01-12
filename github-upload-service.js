// ================================
// GITHUB UPLOAD SERVICE (CLIENT-SIDE)
// Now uses server API instead of direct GitHub API
// ================================

class GitHubUploadService {
    constructor() {
        this.baseURL = '/api/github'; // Relative URL to your server
        this.isConfigured = false;
        this.init();
    }
    
    async init() {
        // Test server connection on initialization
        try {
            const response = await fetch('/api/github/test');
            const data = await response.json();
            this.isConfigured = data.success;
            
            if (this.isConfigured) {
                console.log('✅ GitHub service connected via server');
            } else {
                console.warn('⚠️ GitHub service not configured on server');
            }
        } catch (error) {
            console.error('Failed to connect to server:', error);
            this.isConfigured = false;
        }
    }
    
    async uploadImage(file, filename = null) {
        try {
            // Convert file to base64
            const base64Content = await this.fileToBase64(file);
            const finalFilename = filename || this.generateFilename(file);
            
            const response = await fetch(`${this.baseURL}/upload-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageBase64: base64Content,
                    filename: finalFilename,
                    path: 'images'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                return {
                    success: true,
                    url: result.url,
                    filename: result.filename,
                    githubUrl: result.githubUrl,
                    sha: result.sha,
                    message: result.message || 'Upload successful'
                };
            } else {
                throw new Error(result.error || 'Upload failed');
            }
            
        } catch (error) {
            console.error('Image upload error:', error);
            
            // Create local fallback
            const fallback = await this.createLocalFallback(file, filename);
            
            return {
                success: false,
                error: error.message,
                fallback: fallback
            };
        }
    }
    
    async uploadMultipleImages(files) {
        const results = [];
        
        for (const file of files) {
            const result = await this.uploadImage(file);
            results.push(result);
            
            // Add small delay between uploads
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return results;
    }
    
    async uploadData(data, filename) {
        try {
            const response = await fetch(`${this.baseURL}/upload-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: data,
                    filename: filename,
                    path: 'data'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                return {
                    success: true,
                    url: result.url,
                    sha: result.sha,
                    message: result.message || 'Data uploaded successfully'
                };
            } else {
                throw new Error(result.error || 'Upload failed');
            }
            
        } catch (error) {
            console.error('Data upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async listImages() {
        try {
            const response = await fetch(`${this.baseURL}/images`);
            const result = await response.json();
            
            if (result.success) {
                return result.images;
            } else {
                throw new Error(result.error || 'Failed to list images');
            }
            
        } catch (error) {
            console.error('List images error:', error);
            throw error;
        }
    }
    
    async testConnection() {
        try {
            const response = await fetch(`${this.baseURL}/test`);
            const data = await response.json();
            
            return data;
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Helper methods remain the same
    generateFilename(file) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const extension = file.name.split('.').pop();
        return `item_${timestamp}_${random}.${extension}`;
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
        });
    }
    
    async createLocalFallback(file, filename) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                const key = `local_image_${Date.now()}_${filename || file.name}`;
                localStorage.setItem(key, dataUrl);
                
                resolve({
                    success: true,
                    url: dataUrl,
                    filename: filename || file.name,
                    isLocal: true,
                    storageKey: key,
                    message: 'Saved locally as fallback'
                });
            };
            reader.readAsDataURL(file);
        });
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.githubUploadService = new GitHubUploadService();
}