// ================================
// EXPRESS SERVER FOR AI-MAIZE-ING NACHOS
// ================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Octokit } = require('@octokit/rest');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public')); // Serve static files

// Environment variables
const PORT = process.env.PORT || 8080;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'id617985-eng';
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'new-items';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize GitHub Octokit
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Middleware to check GitHub token
const checkGitHubToken = (req, res, next) => {
    if (!GITHUB_TOKEN) {
        return res.status(500).json({
            success: false,
            error: 'GitHub token not configured on server'
        });
    }
    next();
};

// ================================
// GITHUB API ENDPOINTS
// ================================

// Test GitHub connection
app.get('/api/github/test', checkGitHubToken, async (req, res) => {
    try {
        const { data: repo } = await octokit.repos.get({
            owner: GITHUB_USERNAME,
            repo: GITHUB_REPO
        });

        res.json({
            success: true,
            message: 'GitHub connection successful',
            repo: repo.full_name,
            owner: repo.owner.login
        });
    } catch (error) {
        console.error('GitHub test error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Upload image to GitHub
app.post('/api/github/upload-image', checkGitHubToken, async (req, res) => {
    try {
        const { imageBase64, filename, path: filePath = 'images' } = req.body;
        
        if (!imageBase64 || !filename) {
            return res.status(400).json({
                success: false,
                error: 'Missing image data or filename'
            });
        }

        const fullPath = `${filePath}/${filename}`;
        const commitMessage = `Upload ${filename} via Ai-Maize-ing Admin`;

        // Check if file exists
        let existingSha = null;
        try {
            const { data } = await octokit.repos.getContent({
                owner: GITHUB_USERNAME,
                repo: GITHUB_REPO,
                path: fullPath,
                ref: 'main'
            });
            existingSha = data.sha;
        } catch (error) {
            // File doesn't exist, that's OK
        }

        // Upload file
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_USERNAME,
            repo: GITHUB_REPO,
            path: fullPath,
            message: commitMessage,
            content: imageBase64,
            sha: existingSha,
            branch: 'main'
        });

        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${fullPath}`;

        res.json({
            success: true,
            url: rawUrl,
            filename: filename,
            githubUrl: data.content.html_url,
            sha: data.content.sha,
            message: 'Image uploaded successfully'
        });

    } catch (error) {
        console.error('GitHub upload error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Upload JSON data to GitHub
app.post('/api/github/upload-data', checkGitHubToken, async (req, res) => {
    try {
        const { data, filename, path: filePath = 'data' } = req.body;
        
        if (!data || !filename) {
            return res.status(400).json({
                success: false,
                error: 'Missing data or filename'
            });
        }

        const fullPath = `${filePath}/${filename}.json`;
        const commitMessage = `Update ${filename} via Ai-Maize-ing Admin`;
        const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

        // Check if file exists
        let existingSha = null;
        try {
            const { data: fileData } = await octokit.repos.getContent({
                owner: GITHUB_USERNAME,
                repo: GITHUB_REPO,
                path: fullPath,
                ref: 'main'
            });
            existingSha = fileData.sha;
        } catch (error) {
            // File doesn't exist, that's OK
        }

        // Upload file
        const { data: result } = await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_USERNAME,
            repo: GITHUB_REPO,
            path: fullPath,
            message: commitMessage,
            content: content,
            sha: existingSha,
            branch: 'main'
        });

        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${fullPath}`;

        res.json({
            success: true,
            url: rawUrl,
            sha: result.content.sha,
            message: 'Data uploaded successfully'
        });

    } catch (error) {
        console.error('GitHub data upload error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// List images from GitHub
app.get('/api/github/images', checkGitHubToken, async (req, res) => {
    try {
        const { data } = await octokit.repos.getContent({
            owner: GITHUB_USERNAME,
            repo: GITHUB_REPO,
            path: 'images',
            ref: 'main'
        });

        const images = data
            .filter(item => item.type === 'file')
            .map(file => ({
                name: file.name,
                url: `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/images/${file.name}`,
                size: file.size,
                sha: file.sha,
                downloadUrl: file.download_url
            }));

        res.json({
            success: true,
            images: images
        });

    } catch (error) {
        if (error.status === 404) {
            // Images folder doesn't exist
            res.json({
                success: true,
                images: []
            });
        } else {
            console.error('GitHub list images error:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
});

// Delete file from GitHub
app.delete('/api/github/delete', checkGitHubToken, async (req, res) => {
    try {
        const { path } = req.query;
        
        if (!path) {
            return res.status(400).json({
                success: false,
                error: 'Missing file path'
            });
        }

        // Get file SHA first
        const { data: fileData } = await octokit.repos.getContent({
            owner: GITHUB_USERNAME,
            repo: GITHUB_REPO,
            path: path,
            ref: 'main'
        });

        // Delete file
        await octokit.repos.deleteFile({
            owner: GITHUB_USERNAME,
            repo: GITHUB_REPO,
            path: path,
            message: `Delete ${path.split('/').pop()} via Admin`,
            sha: fileData.sha,
            branch: 'main'
        });

        res.json({
            success: true,
            message: 'File deleted successfully'
        });

    } catch (error) {
        console.error('GitHub delete error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ================================
// STORE API ENDPOINTS (for orders, products, etc.)
// ================================

// Simple in-memory storage (replace with MongoDB in production)
let orders = [];
let products = [];

// Get all products
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        products: products
    });
});

// Create new product
app.post('/api/products', (req, res) => {
    const product = req.body;
    product._id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    product.createdAt = new Date().toISOString();
    
    products.push(product);
    
    res.json({
        success: true,
        productId: product._id,
        product: product
    });
});

// Update product
app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const updatedProduct = req.body;
    
    const index = products.findIndex(p => p._id === id);
    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Product not found'
        });
    }
    
    products[index] = { ...products[index], ...updatedProduct };
    
    res.json({
        success: true,
        product: products[index]
    });
});

// Get all orders
app.get('/api/orders', (req, res) => {
    res.json({
        success: true,
        orders: orders
    });
});

// Create new order
app.post('/api/orders', (req, res) => {
    const order = req.body;
    order._id = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    order.createdAt = new Date().toISOString();
    order.status = 'pending';
    
    orders.push(order);
    
    res.json({
        success: true,
        orderId: order._id,
        order: order
    });
});

// Update order status
app.put('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const index = orders.findIndex(o => o._id === id);
    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Order not found'
        });
    }
    
    orders[index].status = status;
    orders[index].updatedAt = new Date().toISOString();
    
    res.json({
        success: true,
        order: orders[index]
    });
});

// ================================
// ADMIN AUTH ENDPOINTS
// ================================

const adminUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'superadmin', password: 'super123', role: 'superadmin' }
];

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = adminUsers.find(u => 
        u.username === username && u.password === password
    );
    
    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }
    
    // In production, use JWT tokens
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    res.json({
        success: true,
        token: token,
        role: user.role,
        username: user.username
    });
});

// ================================
// SERVE STATIC FILES
// ================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/aifoodies', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'aifoodies.html'));
});

app.get('/nachos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'nachos.html'));
});

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 GitHub: ${GITHUB_USERNAME}/${GITHUB_REPO}`);
    console.log(`🔐 GitHub Token: ${GITHUB_TOKEN ? 'Configured' : 'NOT CONFIGURED!'}`);
});