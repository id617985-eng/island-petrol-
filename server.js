const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enhanced CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import models
const Order = require('./models/Order');
const Admin = require('./models/Admin');
const Customer = require('./models/Customer');
const Availability = require('./models/Availability');

// Store recent notifications
let recentNotifications = [];
const MAX_NOTIFICATIONS = 50;
const currencySymbol = '₱';

// VAPID Keys for Push Notifications
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};

// Validate that VAPID keys are provided
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    console.log('⚠️  VAPID keys not found in environment variables');
    console.log('ℹ️  Push notifications will be disabled');
} else {
    try {
        webpush.setVapidDetails(
            'mailto:admin@aifoodies.com',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
        console.log('✅ VAPID keys configured successfully');
    } catch (error) {
        console.log('❌ VAPID key configuration failed:', error.message);
        vapidKeys.publicKey = null;
        vapidKeys.privateKey = null;
    }
}

// Store push subscriptions
let pushSubscriptions = [];

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, user) => {
        if (err) {
            console.log('❌ Token verification failed:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Customer authentication middleware
const authenticateCustomer = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, decoded) => {
        if (err) {
            console.log('❌ Customer token verification failed:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        if (decoded.type !== 'customer') return res.status(403).json({ message: 'Invalid token type' });
        
        req.customer = decoded;
        next();
    });
};

// MongoDB Connect
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://aifoodies:mahalkitaivy@aifoodies.ylsnhql.mongodb.net/nachos?retryWrites=true&w=majority';

// Create Default Admin Function
const createDefaultAdmin = async () => {
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await Admin.create({
                username: 'admin',
                password: hashedPassword,
                email: 'admin@aifoodies.com',
                role: 'admin',
                createdAt: new Date()
            });
            console.log('✅ Default admin created: username=admin, password=admin123');
        } else {
            console.log('✅ Admin already exists in database');
        }
    } catch (error) {
        console.error('❌ Error creating default admin:', error);
    }
};

// Initialize Default Availability
async function initializeDefaultAvailability() {
    try {
        const defaultItems = [
            'Classic Nachos', 'Supreme Nachos', 'Spicy Chicken Nachos',
            'BBQ Pulled Pork Nachos', 'Veggie Delight Nachos', 'Loaded Beef Nachos',
            'Buffalo Chicken Nachos', 'Seafood Nachos', 'Breakfast Nachos',
            'Dessert Nachos', 'Taco Nachos', 'Pizza Nachos',
            'Guacamole', 'Sour Cream', 'Jalapeños', 'Extra Cheese'
        ];

        for (const itemName of defaultItems) {
            const existing = await Availability.findOne({ name: itemName });
            if (!existing) {
                await Availability.create({
                    name: itemName,
                    available: true,
                    category: itemName.toLowerCase().includes('nachos') ? 'nachos' : 'toppings'
                });
            }
        }
        console.log('✅ Default availability initialized');
    } catch (error) {
        console.log('❌ Default availability initialization failed:', error.message);
    }
}

// Connect to MongoDB and initialize
mongoose.connect(MONGO_URI)
.then(async () => {
    console.log('✅ MongoDB Connected');
    await createDefaultAdmin();
    await initializeDefaultAvailability();
})
.catch(err => {
    console.log('❌ MongoDB Error:', err.message);
    process.exit(1);
});

// Add notification to recent notifications
function addNotification(notification) {
    recentNotifications.unshift(notification);
    if (recentNotifications.length > MAX_NOTIFICATIONS) {
        recentNotifications = recentNotifications.slice(0, MAX_NOTIFICATIONS);
    }
    console.log('📢 Notification added:', notification.message);
    
    // Send push notifications to all subscribers if keys are valid
    if (vapidKeys.publicKey && vapidKeys.privateKey) {
        sendPushNotification(notification);
    }
}

// Function to send push notifications
async function sendPushNotification(notification) {
    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
        console.log('📱 Push notifications disabled - no valid VAPID keys');
        return;
    }

    const payload = JSON.stringify({
        title: '🍿 New Order! - Ai-Maize-ing Nachos',
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'new-order',
        timestamp: notification.timestamp,
        data: {
            url: '/admin',
            orderId: notification.order?.id
        }
    });

    const promises = pushSubscriptions.map(async (subscription) => {
        try {
            await webpush.sendNotification(subscription, payload);
            console.log('📱 Push notification sent successfully');
        } catch (error) {
            console.log('❌ Push notification failed:', error);
            if (error.statusCode === 410) {
                pushSubscriptions = pushSubscriptions.filter(
                    sub => sub.endpoint !== subscription.endpoint
                );
            }
        }
    });

    await Promise.allSettled(promises);
}

// ======================
// API ENDPOINTS
// ======================

// ✅ HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        pushNotifications: vapidKeys.publicKey && vapidKeys.privateKey ? 'Enabled' : 'Disabled',
        adminExists: true,
        time: new Date().toISOString()
    });
});

// ✅ CHECK ADMIN EXISTS (Public)
app.get('/api/admin/check', async (req, res) => {
    try {
        const admin = await Admin.findOne({ username: 'admin' });
        
        if (admin) {
            res.json({
                exists: true,
                username: admin.username,
                email: admin.email,
                created: admin.createdAt,
                message: 'Admin user is ready'
            });
        } else {
            res.json({
                exists: false,
                message: 'Admin not found. Please create one.'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ CREATE DEFAULT ADMIN (Public - for testing)
app.post('/api/admin/create-default', async (req, res) => {
    try {
        const adminExists = await Admin.findOne({ username: 'admin' });
        
        if (adminExists) {
            return res.json({
                message: 'Admin already exists',
                username: adminExists.username,
                email: adminExists.email
            });
        }
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await Admin.create({
            username: 'admin',
            password: hashedPassword,
            email: 'admin@aifoodies.com',
            role: 'admin',
            createdAt: new Date()
        });
        
        res.status(201).json({
            message: 'Default admin created successfully',
            credentials: {
                username: 'admin',
                password: 'admin123',
                note: 'Use these credentials to login'
            },
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ ADMIN LOGIN (Enhanced with detailed logging)
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('🔐 Login attempt:', { username, password: password ? '***' : 'empty' });
        
        if (!username || !password) {
            console.log('❌ Missing credentials');
            return res.status(400).json({ 
                message: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            console.log('❌ Admin not found in database:', username);
            return res.status(401).json({ 
                message: 'Invalid username or password',
                code: 'USER_NOT_FOUND'
            });
        }

        console.log('✅ Admin found:', admin.username);
        console.log('🔍 Comparing password...');
        
        // Use bcrypt.compare for password verification
        const validPassword = await bcrypt.compare(password, admin.password);
        
        if (!validPassword) {
            console.log('❌ Password incorrect for:', username);
            return res.status(401).json({ 
                message: 'Invalid username or password',
                code: 'INVALID_PASSWORD'
            });
        }

        console.log('✅ Password verified successfully');
        
        const token = jwt.sign(
            { 
                id: admin._id, 
                username: admin.username,
                role: admin.role || 'admin'
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful for:', username);
        
        res.json({ 
            token, 
            message: 'Login successful',
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            message: 'Internal server error during login',
            error: error.message 
        });
    }
});

// ✅ VERIFY ADMIN TOKEN
app.get('/api/admin/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        admin: req.user,
        message: 'Token is valid'
    });
});

// ✅ VERIFY ADMIN ROLE (For admin panel)
app.get('/api/admin/verify-role', authenticateToken, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id);
        if (!admin) {
            return res.status(404).json({ valid: false, message: 'Admin not found' });
        }
        
        res.json({ 
            valid: true, 
            admin: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role || 'admin'
            }
        });
    } catch (error) {
        res.status(500).json({ valid: false, message: error.message });
    }
});

// ======================
// OTHER ENDPOINTS (Keep existing)
// ======================

// ✅ ITEM AVAILABILITY ENDPOINTS
app.get('/api/availability', async (req, res) => {
    try {
        const availability = await Availability.find();
        const availabilityObj = {};
        availability.forEach(item => {
            availabilityObj[item.name] = item.available;
        });
        res.json(availabilityObj);
    } catch (error) {
        console.error('❌ Availability fetch error:', error);
        res.status(500).json({ 
            message: 'Error fetching availability',
            error: error.message 
        });
    }
});

app.put('/api/availability/:itemName', authenticateToken, async (req, res) => {
    try {
        const itemName = decodeURIComponent(req.params.itemName);
        const { available } = req.body;

        if (typeof available !== 'boolean') {
            return res.status(400).json({ message: 'Available field must be boolean' });
        }

        const availability = await Availability.findOneAndUpdate(
            { name: itemName },
            { 
                name: itemName,
                available: available,
                category: 'nachos'
            },
            { 
                upsert: true,
                new: true 
            }
        );

        console.log(`📦 Availability updated: ${itemName} = ${available}`);

        res.json({
            message: 'Availability updated successfully',
            item: {
                name: availability.name,
                available: availability.available,
                category: availability.category
            }
        });
    } catch (error) {
        console.error('❌ Availability update error:', error);
        res.status(500).json({ 
            message: 'Error updating availability',
            error: error.message 
        });
    }
});

// ✅ PUSH NOTIFICATION ENDPOINTS
app.get('/api/push/vapid-public-key', (req, res) => {
    if (!vapidKeys.publicKey) {
        return res.status(503).json({ error: 'Push notifications not configured' });
    }
    res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/push/subscribe', authenticateToken, (req, res) => {
    if (!vapidKeys.publicKey) {
        return res.status(503).json({ error: 'Push notifications not configured' });
    }

    const subscription = req.body;
    
    const exists = pushSubscriptions.some(sub => 
        sub.endpoint === subscription.endpoint
    );
    
    if (!exists) {
        pushSubscriptions.push(subscription);
        console.log('📱 New push subscription registered');
    }
    
    res.status(201).json({ message: 'Subscription registered' });
});

// ✅ CUSTOMER ENDPOINTS (Keep existing)
app.post('/api/customers/register', async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({ message: 'Name, phone, and password are required' });
        }

        const existingCustomer = await Customer.findOne({ phone });
        if (existingCustomer) {
            return res.status(400).json({ message: 'Customer with this phone number already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const customer = await Customer.create({
            name,
            phone,
            email: email || '',
            password: hashedPassword,
            loyaltyPoints: 0,
            totalOrders: 0,
            totalSpent: 0,
            favoriteItems: [],
            orderHistory: []
        });

        console.log(`✅ New customer registered: ${name} (${phone})`);

        res.status(201).json({
            message: 'Customer registered successfully',
            customer: {
                id: customer._id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email
            }
        });
    } catch (error) {
        console.error('Customer registration error:', error);
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/customers/phone/:phone', async (req, res) => {
    try {
        const customer = await Customer.findOne({ phone: req.params.phone });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({
            id: customer._id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            loyaltyPoints: customer.loyaltyPoints
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/customers/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ message: 'Phone and password required' });
        }

        const customer = await Customer.findOne({ phone });
        if (!customer) {
            return res.status(401).json({ message: 'Invalid phone number or password' });
        }

        if (!customer.password) {
            return res.status(401).json({ message: 'Account not set up with password. Please register first.' });
        }

        const validPassword = await bcrypt.compare(password, customer.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid phone number or password' });
        }

        const token = jwt.sign(
            { 
                id: customer._id, 
                phone: customer.phone,
                type: 'customer'
            },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            customer: {
                id: customer._id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                loyaltyPoints: customer.loyaltyPoints,
                totalOrders: customer.totalOrders,
                totalSpent: customer.totalSpent
            },
            message: 'Login successful'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ✅ VERIFY CUSTOMER TOKEN
app.get('/api/customers/verify', authenticateCustomer, (req, res) => {
    res.json({ valid: true, customer: req.customer });
});

// ✅ GET NOTIFICATIONS (Protected)
app.get('/api/admin/notifications', authenticateToken, (req, res) => {
    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    
    const newNotifications = recentNotifications.filter(notification => 
        new Date(notification.timestamp) > since
    );
    
    res.json({
        notifications: newNotifications,
        timestamp: new Date().toISOString()
    });
});

// ✅ CLEAR NOTIFICATIONS (Protected)
app.delete('/api/admin/notifications', authenticateToken, (req, res) => {
    recentNotifications = [];
    res.json({ message: 'Notifications cleared' });
});

// ✅ GET ORDERS (Protected)
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find().sort({ timestamp: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ✅ CREATE ORDER (Public)
app.post('/api/orders', async (req, res) => {
    try {
        const { customerId, customerPhone, customerName, items, total, pickupTime, paymentMethod, specialInstructions } = req.body;

        if (!items || !total || !pickupTime) {
            return res.status(400).json({ 
                message: 'Items, total, and pickup time are required' 
            });
        }

        for (const item of items) {
            const availability = await Availability.findOne({ name: item.name });
            if (availability && !availability.available) {
                return res.status(400).json({ 
                    message: `Sorry, ${item.name} is currently out of stock!` 
                });
            }
        }

        let customer = null;
        let finalCustomerId = customerId;

        if (!customerId && customerPhone) {
            customer = await Customer.findOne({ phone: customerPhone });
            if (customer) {
                finalCustomerId = customer._id;
                console.log(`📞 Found customer by phone: ${customer.name} (${customer.phone})`);
            }
        }

        if (finalCustomerId && !customer) {
            customer = await Customer.findById(finalCustomerId);
        }

        const orderData = {
            items,
            total: parseFloat(total),
            pickupTime,
            paymentMethod: paymentMethod || 'cash',
            specialInstructions: specialInstructions || '',
            status: 'pending',
            timestamp: new Date()
        };

        if (finalCustomerId) {
            orderData.customerId = finalCustomerId;
            orderData.customerName = customer ? customer.name : customerName;
        } else if (customerName) {
            orderData.customerName = customerName;
        }

        const order = await Order.create(orderData);
        
        if (customer) {
            try {
                const pointsEarned = Math.floor(order.total / 100);
                
                await Customer.findByIdAndUpdate(customer._id, {
                    $push: {
                        orderHistory: {
                            orderId: order._id,
                            items: order.items,
                            total: order.total,
                            status: order.status,
                            pickupTime: order.pickupTime,
                            timestamp: order.timestamp
                        }
                    },
                    $inc: {
                        totalOrders: 1,
                        totalSpent: order.total,
                        loyaltyPoints: pointsEarned
                    },
                    $set: {
                        lastOrder: order.timestamp
                    }
                });

                const updatedCustomer = await Customer.findById(customer._id);
                order.items.forEach(item => {
                    const existingFavorite = updatedCustomer.favoriteItems.find(fav => 
                        fav.name === item.name
                    );
                    if (existingFavorite) {
                        existingFavorite.count += item.quantity;
                        existingFavorite.lastOrdered = new Date();
                    } else {
                        updatedCustomer.favoriteItems.push({
                            name: item.name,
                            count: item.quantity,
                            lastOrdered: new Date()
                        });
                    }
                });

                updatedCustomer.favoriteItems.sort((a, b) => b.count - a.count);
                
                if (updatedCustomer.favoriteItems.length > 10) {
                    updatedCustomer.favoriteItems = updatedCustomer.favoriteItems.slice(0, 10);
                }

                await updatedCustomer.save();

                console.log(`📊 Customer history updated for ${customer.name}: +${pointsEarned} loyalty points`);

            } catch (customerError) {
                console.error('❌ Error updating customer history:', customerError);
            }
        }

        const notification = {
            id: Date.now().toString(),
            type: 'new_order',
            message: `New order from ${order.customerName || 'Guest'} - ${currencySymbol}${order.total}`,
            order: {
                id: order._id,
                customerName: order.customerName,
                total: order.total,
                items: order.items.length,
                pickupTime: order.pickupTime,
                customerId: order.customerId
            },
            timestamp: new Date().toISOString(),
            read: false
        };

        addNotification(notification);
        
        console.log(`✅ Order created: ${order._id} for ${order.customerName || 'Guest'}`);
        
        res.status(201).json({
            ...order.toObject(),
            pointsEarned: customer ? Math.floor(order.total / 100) : 0,
            customerUpdated: !!customer
        });

    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(400).json({ 
            message: 'Error creating order',
            error: error.message 
        });
    }
});

// ✅ UPDATE ORDER (Protected)
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status || 'completed' },
            { new: true }
        );

        if (updated) {
            const notification = {
                id: Date.now().toString(),
                type: 'order_updated',
                message: `Order from ${updated.customerName} marked as ${updated.status}`,
                orderId: updated._id,
                status: updated.status,
                timestamp: new Date().toISOString(),
                read: false
            };

            addNotification(notification);

            if (updated.status === 'completed' && updated.customerId) {
                try {
                    const customer = await Customer.findById(updated.customerId);
                    if (customer && customer.pushSubscription) {
                        const payload = JSON.stringify({
                            title: '🍿 Order Ready! - Ai-Maize-ing Nachos',
                            body: `Your order is ready for pickup, ${customer.name}!`,
                            icon: '/icon-192x192.png',
                            badge: '/badge-72x72.png',
                            tag: 'order-ready',
                            data: {
                                url: '/customer-profile.html',
                                orderId: updated._id
                            }
                        });

                        await webpush.sendNotification(customer.pushSubscription, payload);
                        console.log(`📱 Order ready notification sent to ${customer.name}`);
                    }
                } catch (pushError) {
                    console.log('❌ Order ready push notification failed:', pushError);
                }
            }
        }

        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ✅ DELETE ORDER (Protected)
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ✅ DASHBOARD STATS (Protected)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        
        const totalSalesResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const totalSales = totalSalesResult[0]?.total || 0;
        
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayOrders = await Order.countDocuments({
            timestamp: { $gte: today, $lt: tomorrow }
        });
        
        const todaySalesResult = await Order.aggregate([
            { $match: { timestamp: { $gte: today, $lt: tomorrow } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const todaySales = todaySalesResult[0]?.total || 0;

        const totalCustomers = await Customer.countDocuments();
        const loyalCustomers = await Customer.countDocuments({ loyaltyPoints: { $gte: 10 } });

        const popularItemsResult = await Order.aggregate([
            { $unwind: '$items' },
            { $group: { 
                _id: '$items.name',
                totalQuantity: { $sum: '$items.quantity' },
                totalOrders: { $sum: 1 }
            }},
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);

        const totalItems = await Availability.countDocuments();
        const availableItems = await Availability.countDocuments({ available: true });
        const unavailableItems = await Availability.countDocuments({ available: false });

        res.json({
            totalOrders,
            totalSales,
            pendingOrders,
            todayOrders,
            todaySales,
            totalCustomers,
            loyalCustomers,
            popularItems: popularItemsResult,
            availabilityStats: {
                totalItems,
                availableItems,
                unavailableItems,
                availabilityRate: totalItems > 0 ? (availableItems / totalItems * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({ 
            message: 'Error fetching dashboard statistics',
            error: error.message 
        });
    }
});

// ✅ VAPID KEY ENDPOINTS
app.get('/api/admin/push/vapid-public-key', (req, res) => {
    if (!vapidKeys.publicKey) {
        return res.status(503).json({ error: 'Push notifications not configured' });
    }
    res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/admin/push/subscribe', authenticateToken, (req, res) => {
    if (!vapidKeys.publicKey) {
        return res.status(503).json({ error: 'Push notifications not configured' });
    }

    const subscription = req.body;
    
    const exists = pushSubscriptions.some(sub => 
        sub.endpoint === subscription.endpoint
    );
    
    if (!exists) {
        pushSubscriptions.push(subscription);
        console.log('📱 New push subscription registered');
    }
    
    res.status(201).json({ message: 'Subscription registered' });
});

app.post('/api/admin/push/unsubscribe', authenticateToken, (req, res) => {
    const subscription = req.body;
    pushSubscriptions = pushSubscriptions.filter(sub => 
        sub.endpoint !== subscription.endpoint
    );
    console.log('📱 Push subscription removed');
    res.json({ message: 'Unsubscribed successfully' });
});

// ✅ TEST ENDPOINT FOR ADMIN (Public)
app.get('/api/admin/test', async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();
        const admin = await Admin.findOne({ username: 'admin' });
        
        res.json({
            message: 'Admin API Test Endpoint',
            adminCount,
            defaultAdminExists: !!admin,
            defaultAdmin: admin ? {
                username: admin.username,
                email: admin.email,
                role: admin.role,
                createdAt: admin.createdAt
            } : null,
            testCredentials: {
                username: 'admin',
                password: 'admin123'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ SERVE FRONTEND
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📢 Notification system ready`);
    console.log(`👥 Customer account system ready`);
    console.log(`📊 Enhanced customer history tracking enabled`);
    console.log(`📦 Item availability management enabled`);
    if (vapidKeys.publicKey && vapidKeys.privateKey) {
        console.log(`📱 Push notifications enabled`);
    } else {
        console.log(`⚠️  Push notifications disabled - no valid VAPID keys`);
    }
    console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
    console.log(`👤 Admin Test: http://localhost:${PORT}/api/admin/test`);
    console.log(`🔐 Admin Login: http://localhost:${PORT}/api/admin/login`);
    console.log(`ℹ️  Default Credentials: admin / admin123`);
});