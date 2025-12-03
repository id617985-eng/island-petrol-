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
app.use(bodyParser.json());
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
                // Create new admin - password will be hashed by pre-save hook
                await Admin.create(adminData);
                console.log(`✅ Created default admin: ${adminData.username} (${adminData.role})`);
            } else {
                // Update existing admin with current password
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

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        message: 'Ai-Maize-ing Nachos API is running'
    });
});

// Admin Login - FIXED ENDPOINT
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
        // For demo purposes - you should implement actual database queries here
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

app.get('/api/availability', (req, res) => {
    const availability = {
        'Regular Nachos': true,
        'Veggie Nachos': true,
        'Overload Cheesy Nachos': true,
        'Nacho Combo': true,
        'Nacho Fries': true,
        'Supreme Nachos': true,
        'Shawarma Fries': true,
        'Mango Graham': true,
        'Mango tiramisu on tube': true,
        'Biscoff': true,
        'Oreo': true,
        'Mango Graham Float': true
    };
    
    res.json(availability);
});

// Orders endpoints
app.get('/api/admin/orders', authenticateToken, async (req, res) => {
    try {
        // For demo - in real app, fetch from database
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
    
    // Initialize default admins
    await initializeDefaultAdmins();
});