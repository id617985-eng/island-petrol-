const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit for image uploads
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://aifoodies:mahalkitaivy@aifoodies.ylsnhql.mongodb.net/nachos?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Error:', err));

// Admin Schema
const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    fullName: { type: String },
    role: { 
        type: String, 
        enum: ['superadmin', 'admin', 'manager', 'staff', 'viewer'],
        default: 'admin'
    },
    permissions: [String],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

adminSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

// Menu Items Schema
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    category: { type: String, enum: ['nachos', 'desserts'], required: true },
    description: { type: String },
    ingredients: { type: String },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String },
    displayOrder: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Initialize default admins
async function initializeDefaultAdmins() {
    try {
        const defaultAdmins = [
            {
                username: 'superadmin',
                password: 'superadmin123',
                fullName: 'Super Administrator',
                email: 'superadmin@aimaizeingnachos.com',
                role: 'superadmin',
                permissions: ['all'],
                isActive: true
            },
            {
                username: 'admin',
                password: 'admin123',
                fullName: 'Administrator',
                email: 'admin@aimaizeingnachos.com',
                role: 'admin',
                permissions: ['view_dashboard', 'manage_orders', 'manage_menu', 'manage_customers'],
                isActive: true
            },
            {
                username: 'manager',
                password: 'manager123',
                fullName: 'Store Manager',
                email: 'manager@aimaizeingnachos.com',
                role: 'manager',
                permissions: ['view_dashboard', 'manage_orders'],
                isActive: true
            },
            {
                username: 'staff',
                password: 'staff123',
                fullName: 'Store Staff',
                email: 'staff@aimaizeingnachos.com',
                role: 'staff',
                permissions: ['view_dashboard', 'manage_orders'],
                isActive: true
            },
            {
                username: 'viewer',
                password: 'viewer123',
                fullName: 'Report Viewer',
                email: 'viewer@aimaizeingnachos.com',
                role: 'viewer',
                permissions: ['view_dashboard'],
                isActive: true
            }
        ];

        for (const adminData of defaultAdmins) {
            const existingAdmin = await Admin.findOne({ username: adminData.username });
            
            if (!existingAdmin) {
                await Admin.create(adminData);
                console.log(`✅ Created default admin: ${adminData.username} (${adminData.role})`);
            } else {
                const hashedPassword = await bcrypt.hash(adminData.password, 10);
                existingAdmin.password = hashedPassword;
                existingAdmin.role = adminData.role;
                existingAdmin.permissions = adminData.permissions;
                existingAdmin.isActive = true;
                await existingAdmin.save();
                console.log(`✅ Updated default admin: ${adminData.username} (${adminData.role})`);
            }
        }
        
        console.log('✅ All default admin accounts initialized/updated');
    } catch (error) {
        console.error('❌ Error initializing default admins:', error);
    }
}

// Initialize menu items
async function initializeMenuItems() {
    try {
        const menuItems = [
            // Nachos
            {
                name: 'Regular Nachos',
                price: 35,
                category: 'nachos',
                description: 'Classic nachos with delicious toppings',
                ingredients: 'Chips, beef, cucumber, white onions, tomatoes, carrots, cheesy sauce, garlic sauce, sesame seeds.',
                isAvailable: true,
                imageUrl: '/image/classic nachos.jpg'
            },
            {
                name: 'Veggie Nachos',
                price: 65,
                category: 'nachos',
                description: 'Vegetarian delight',
                ingredients: 'Corn chips, bell peppers, onions, olives, melted cheese, guacamole.',
                isAvailable: true,
                imageUrl: '/image/veggie nachos.jpg'
            },
            {
                name: 'Overload Cheesy Nachos',
                price: 95,
                category: 'nachos',
                description: 'Extra cheesy goodness',
                ingredients: 'Chips, beef, cucumber, white onions, tomatoes, carrots, black olives, cheesy sauce, garlic sauce, sesame seeds, Cheese.',
                isAvailable: true,
                imageUrl: '/image/overload chees nachos.jpg'
            },
            {
                name: 'Nacho Combo',
                price: 75,
                category: 'nachos',
                description: 'Nachos with drink',
                ingredients: 'Chips, beef, cucumber, white onions, tomatoes, carrots, cheesy sauce, garlic sauce, sesame seeds, Drinks.',
                isAvailable: true,
                imageUrl: '/image/combo.png'
            },
            {
                name: 'Nacho Fries',
                price: 85,
                category: 'nachos',
                description: 'Nachos with fries',
                ingredients: 'Fries, Chips, beef, cucumber, white onions, tomatoes, carrots, black olives, cheesy sauce, garlic sauce, sesame seeds.',
                isAvailable: true,
                imageUrl: '/image/nacho fries.jpg'
            },
            {
                name: 'Supreme Nachos',
                price: 180,
                category: 'nachos',
                description: 'Premium nachos experience',
                ingredients: 'Corn chips, beef, tomatoes, onions, triple cheese, guacamole.',
                isAvailable: true,
                imageUrl: '/image/Supreme Nachos.png'
            },
            {
                name: 'Shawarma fries',
                price: 120,
                category: 'nachos',
                description: 'Shawarma style fries',
                ingredients: 'Fries, beef, cucumber, white onions, tomatoes, carrots, black olives, cheesy sauce, garlic sauce, sesame seeds, cheese, guacamole.',
                isAvailable: true,
                imageUrl: '/image/shawarma fries.jpeg'
            },
            // Desserts
            {
                name: 'Mango Graham',
                price: 40,
                category: 'desserts',
                description: 'Sweet mango graham dessert',
                ingredients: 'Mango slices, graham crackers, cream, condensed milk.',
                isAvailable: true,
                imageUrl: '/image/mango.gif'
            },
            {
                name: 'Mango tiramisu on tube',
                price: 100,
                category: 'desserts',
                description: 'Mango tiramisu in a tube',
                ingredients: 'Mango puree, mascarpone, ladyfingers, cream, cocoa dust.',
                isAvailable: true,
                imageUrl: '/image/mango tiramisu on tub-price 100.jpeg'
            },
            {
                name: 'Biscoff',
                price: 159,
                category: 'desserts',
                description: 'Biscoff cookie dessert',
                ingredients: 'Biscoff spread, crushed cookies, cream, condensed milk.',
                isAvailable: true,
                imageUrl: '/image/biscoff.jpeg'
            },
            {
                name: 'Oreo',
                price: 149,
                category: 'desserts',
                description: 'Oreo cookie delight',
                ingredients: 'Oreo cookies, whipped cream, chocolate syrup, condensed milk.',
                isAvailable: true,
                imageUrl: '/image/oreo and bisscoff.png'
            },
            {
                name: 'Mango Graham Float',
                price: 40,
                category: 'desserts',
                description: 'Mango graham float dessert',
                ingredients: 'Mango, graham crackers, cream, condensed milk, and other delicious ingredients.',
                isAvailable: true,
                imageUrl: '/image/Mango Graham Floa.jpg'
            }
        ];

        for (const itemData of menuItems) {
            const existingItem = await MenuItem.findOne({ name: itemData.name });
            
            if (!existingItem) {
                await MenuItem.create(itemData);
                console.log(`✅ Created menu item: ${itemData.name}`);
            } else {
                existingItem.price = itemData.price;
                existingItem.isAvailable = itemData.isAvailable;
                existingItem.imageUrl = itemData.imageUrl;
                await existingItem.save();
                console.log(`✅ Updated menu item: ${itemData.name}`);
            }
        }
        
        console.log('✅ All menu items initialized/updated');
    } catch (error) {
        console.error('❌ Error initializing menu items:', error);
    }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            message: 'Access token required',
            code: 'TOKEN_REQUIRED'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ 
                message: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }
        req.user = user;
        next();
    });
};

// =========== NEW API ENDPOINTS ===========

// Upload image to GitHub (admin only)
app.post('/api/admin/upload-image', authenticateToken, async (req, res) => {
    try {
        const { imageBase64, fileName, productName } = req.body;
        
        if (!imageBase64 || !fileName) {
            return res.status(400).json({ 
                message: 'Image data and file name are required',
                code: 'IMAGE_DATA_REQUIRED'
            });
        }
        
        // Remove data:image/...;base64, prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        
        // Get GitHub credentials from environment variables
        const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'id617985-eng';
        const REPO_NAME = process.env.GITHUB_REPO_NAME || 'new-items';
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        
        if (!GITHUB_TOKEN) {
            console.warn('⚠️ GitHub token not found in environment variables');
            return res.status(500).json({
                message: 'GitHub upload not configured',
                code: 'GITHUB_NOT_CONFIGURED'
            });
        }
        
        const PATH = `images/${fileName}`;
        
        // GitHub API URL
        const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${PATH}`;
        
        // Prepare GitHub API request
        const response = await fetch(githubApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Add product image for: ${productName || fileName}`,
                content: base64Data,
                committer: {
                    name: 'Ai-Maize-ing Nachos Admin',
                    email: 'admin@aimaizeingnachos.com'
                }
            })
        });
        
        const githubResult = await response.json();
        
        if (!response.ok) {
            console.error('GitHub API error:', githubResult);
            return res.status(response.status).json({
                message: 'Failed to upload image to GitHub',
                details: githubResult.message || 'Unknown GitHub error',
                code: 'GITHUB_UPLOAD_FAILED'
            });
        }
        
        // Construct the public URL for the image
        const imageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${PATH}`;
        
        console.log(`✅ Image uploaded to GitHub: ${imageUrl} by ${req.user.username}`);
        
        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: imageUrl,
            githubUrl: githubResult.content.html_url
        });
        
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Add new menu item (admin only)
app.post('/api/admin/menu-items', authenticateToken, async (req, res) => {
    try {
        const { 
            name, 
            price, 
            category, 
            description, 
            ingredients, 
            isAvailable = true,
            imageUrl = '',
            displayOrder = 0
        } = req.body;
        
        // Validation
        if (!name || !price || !category) {
            return res.status(400).json({ 
                message: 'Name, price, and category are required',
                code: 'REQUIRED_FIELDS'
            });
        }
        
        if (!['nachos', 'desserts'].includes(category)) {
            return res.status(400).json({ 
                message: 'Category must be either "nachos" or "desserts"',
                code: 'INVALID_CATEGORY'
            });
        }
        
        // Check if item already exists
        const existingItem = await MenuItem.findOne({ name });
        if (existingItem) {
            return res.status(409).json({ 
                message: 'Menu item with this name already exists',
                code: 'ITEM_EXISTS'
            });
        }
        
        // Create new menu item
        const menuItem = new MenuItem({
            name,
            price: parseFloat(price),
            category,
            description: description || '',
            ingredients: ingredients || '',
            isAvailable,
            imageUrl,
            displayOrder
        });
        
        await menuItem.save();
        
        console.log(`✅ New menu item created: ${name} by ${req.user.username}`);
        
        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            item: menuItem
        });
        
    } catch (error) {
        console.error('Create menu item error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Update menu item (admin only)
app.put('/api/admin/menu-items/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (updateData.price) {
            updateData.price = parseFloat(updateData.price);
        }
        
        const menuItem = await MenuItem.findByIdAndUpdate(
            id,
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        
        if (!menuItem) {
            return res.status(404).json({ 
                message: 'Menu item not found',
                code: 'ITEM_NOT_FOUND'
            });
        }
        
        console.log(`✅ Menu item updated: ${menuItem.name} by ${req.user.username}`);
        
        res.json({
            success: true,
            message: 'Menu item updated successfully',
            item: menuItem
        });
        
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Delete menu item (admin only)
app.delete('/api/admin/menu-items/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        const menuItem = await MenuItem.findByIdAndDelete(id);
        
        if (!menuItem) {
            return res.status(404).json({ 
                message: 'Menu item not found',
                code: 'ITEM_NOT_FOUND'
            });
        }
        
        console.log(`🗑️ Menu item deleted: ${menuItem.name} by ${req.user.username}`);
        
        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });
        
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

// =========== EXISTING API ENDPOINTS ===========

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        message: 'Ai-Maize-ing Nachos API is running',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log(`🔐 Login attempt for username: ${username}`);
        
        if (!username || !password) {
            return res.status(400).json({ 
                message: 'Username and password are required',
                code: 'CREDENTIALS_REQUIRED'
            });
        }

        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            console.log(`❌ Admin not found: ${username}`);
            return res.status(401).json({ 
                message: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        if (!admin.isActive) {
            return res.status(403).json({ 
                message: 'Account is deactivated',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        const isValidPassword = await admin.comparePassword(password);
        
        if (!isValidPassword) {
            console.log(`❌ Invalid password for: ${username}`);
            return res.status(401).json({ 
                message: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Create JWT token
        const token = jwt.sign(
            { 
                id: admin._id, 
                username: admin.username,
                role: admin.role,
                permissions: admin.permissions
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '24h' }
        );

        console.log(`✅ Login successful: ${username} (${admin.role})`);

        res.json({
            token,
            user: {
                id: admin._id,
                username: admin.username,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions,
                isActive: admin.isActive,
                lastLogin: admin.lastLogin
            },
            message: 'Login successful'
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
        });
    }
});

// Verify admin token and role
app.get('/api/admin/verify-role', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select('-password');
        
        if (!admin) {
            return res.status(404).json({ 
                valid: false,
                message: 'Admin not found'
            });
        }
        
        if (!admin.isActive) {
            return res.status(403).json({ 
                valid: false,
                message: 'Account deactivated'
            });
        }
        
        res.json({
            valid: true,
            admin: {
                id: admin._id,
                username: admin.username,
                role: admin.role,
                permissions: admin.permissions,
                isActive: admin.isActive
            }
        });
    } catch (error) {
        console.error('Verify role error:', error);
        res.status(500).json({ 
            valid: false,
            message: 'Internal server error'
        });
    }
});

// Get admin profile
app.get('/api/admin/me', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select('-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        
        res.json({
            user: admin,
            permissions: admin.permissions,
            role: admin.role
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Dashboard stats
app.get('/api/admin/dashboard-stats', authenticateToken, async (req, res) => {
    try {
        const stats = {
            totalOrders: 24,
            totalSales: 5240,
            todayOrders: 3,
            todaySales: 650,
            pendingOrders: 2,
            totalCustomers: 15,
            popularItems: [
                { name: 'Overload Cheesy Nachos', count: 12 },
                { name: 'Mango Graham', count: 10 },
                { name: 'Regular Nachos', count: 8 }
            ]
        };
        
        res.json({
            ...stats,
            userRole: req.user.role,
            userPermissions: req.user.permissions
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all admins (superadmin only)
app.get('/api/admin/admins', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only superadmin can view all admins' });
        }
        
        const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
        res.json(admins);
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all menu items (public)
app.get('/api/menu-items', async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        
        if (category) {
            query.category = category;
        }
        
        const menuItems = await MenuItem.find(query).sort({ displayOrder: 1 });
        res.json(menuItems);
    } catch (error) {
        console.error('Get menu items error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get menu item availability (public)
app.get('/api/availability', async (req, res) => {
    try {
        const menuItems = await MenuItem.find({}, 'name isAvailable category');
        const availability = {};
        
        menuItems.forEach(item => {
            availability[item.name] = item.isAvailable;
        });
        
        res.json(availability);
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update item availability (admin only)
app.put('/api/admin/menu-items/:name/availability', authenticateToken, async (req, res) => {
    try {
        const { name } = req.params;
        const { isAvailable } = req.body;
        
        if (typeof isAvailable !== 'boolean') {
            return res.status(400).json({ message: 'isAvailable must be boolean' });
        }
        
        const menuItem = await MenuItem.findOne({ name });
        
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        
        menuItem.isAvailable = isAvailable;
        menuItem.updatedAt = new Date();
        await menuItem.save();
        
        console.log(`✅ Updated availability: ${name} = ${isAvailable} by ${req.user.username}`);
        
        res.json({
            success: true,
            message: `${name} availability updated to ${isAvailable ? 'available' : 'out of stock'}`,
            item: {
                name: menuItem.name,
                isAvailable: menuItem.isAvailable,
                category: menuItem.category
            }
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Batch update availability (admin only)
app.put('/api/admin/menu-items/availability/batch', authenticateToken, async (req, res) => {
    try {
        const { updates } = req.body; // Array of { name, isAvailable }
        
        if (!Array.isArray(updates)) {
            return res.status(400).json({ message: 'updates must be an array' });
        }
        
        const results = [];
        
        for (const update of updates) {
            const menuItem = await MenuItem.findOne({ name: update.name });
            
            if (menuItem) {
                menuItem.isAvailable = update.isAvailable;
                menuItem.updatedAt = new Date();
                await menuItem.save();
                results.push({
                    name: menuItem.name,
                    success: true,
                    isAvailable: menuItem.isAvailable
                });
            } else {
                results.push({
                    name: update.name,
                    success: false,
                    error: 'Item not found'
                });
            }
        }
        
        console.log(`✅ Batch updated ${results.length} items by ${req.user.username}`);
        
        res.json({
            success: true,
            message: `Batch updated ${results.length} items`,
            results
        });
    } catch (error) {
        console.error('Batch update availability error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get all menu items for admin (with details)
app.get('/api/admin/menu-items', authenticateToken, async (req, res) => {
    try {
        const menuItems = await MenuItem.find().sort({ category: 1, displayOrder: 1 });
        res.json(menuItems);
    } catch (error) {
        console.error('Get admin menu items error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Public endpoints for frontend
app.get('/api/slideshow', (req, res) => {
    const slides = [
        {
            _id: '1',
            title: 'Welcome to Ai-Maize-ing Nachos!',
            description: 'Delicious food made with love',
            imageUrl: '/image/LOGO.jpg',
            order: 1,
            active: true
        },
        {
            _id: '2',
            title: 'Overload Cheesy Nachos',
            description: 'Loaded with premium cheese and toppings',
            imageUrl: '/image/overload chees nachos.jpg',
            order: 2,
            active: true
        },
        {
            _id: '3',
            title: 'Mango Graham Special',
            description: 'Sweet mango dessert delight',
            imageUrl: '/image/mango.gif',
            order: 3,
            active: true
        }
    ];
    
    res.json(slides);
});

// Orders endpoints
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
    try {
        const demoOrders = [
            {
                _id: 'order_001',
                customerName: 'John Doe',
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
                items: [
                    { name: 'Overload Cheesy Nachos', quantity: 1, price: 95 },
                    { name: 'Biscoff', quantity: 1, price: 159 }
                ],
                total: 254,
                status: 'processing',
                paymentMethod: 'Gcash',
                pickupTime: '7:00 PM',
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
            }
        ];
        
        res.json({
            orders: demoOrders,
            userRole: req.user.role,
            permissions: req.user.permissions
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Customer orders endpoint
app.post('/api/orders', async (req, res) => {
    try {
        const { customerName, items, total, pickupTime, paymentMethod } = req.body;
        
        // Create a demo order
        const order = {
            _id: 'order_' + Date.now(),
            customerName: customerName || 'Guest',
            items: items || [],
            total: total || 0,
            status: 'pending',
            paymentMethod: paymentMethod || 'Cash on Pick-up',
            pickupTime: pickupTime || 'ASAP',
            timestamp: new Date()
        };
        
        console.log('✅ New order received:', order);
        
        res.status(201).json(order);
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Serve static files
app.use(express.static('public'));

// Default route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Admin Login: http://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (!process.env.GITHUB_TOKEN) {
        console.warn('⚠️ GITHUB_TOKEN not set - image uploads will be disabled');
    }
    
    // Initialize default admins AND menu items
    await initializeDefaultAdmins();
    await initializeMenuItems();
});