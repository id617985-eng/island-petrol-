const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config();

// Environment variable validation
if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET is not defined in environment variables");
    process.exit(1);
}

if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is not defined in environment variables");
    process.exit(1);
}

const app = express();

// CORS Configuration
const corsOptions = {
    origin: '*', // Allow all origins for development
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ======== DB CONNECTION ========
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log("🍃 MongoDB Connected"))
.catch(err => console.log("❌ DB Error:", err));

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// ======== MODELS ========
const Admin = require("./models/Admin");
const Product = require("./models/Product");
const Order = require("./models/Order");
const Customer = require("./models/Customer");

// ======== AUTH MIDDLEWARE ========
const auth = require("./auth");

// ======== ROOT ENDPOINT ========
app.get("/", (req, res) => {
    res.json({
        message: "🍕 AI Foodies API",
        version: "1.0.0",
        endpoints: {
            admin: "/api/admin/login",
            products: "/api/menu-items",
            orders: "/api/orders",
            customers: "/api/customers/register",
            health: "/api/health"
        },
        status: "Server is running 🚀"
    });
});

// ======== FAVICON FIX ========
app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});

// ======== ADMIN LOGIN ========
app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(401).json({ success: false, msg: "Username and password required" });
    }
    
    // Demo users
    const demoUsers = {
        "admin": "admin123",
        "superadmin": "superadmin123"
    };
    
    if (demoUsers[username] && demoUsers[username] === password) {
        const token = jwt.sign({
            id: username,
            role: username === "superadmin" ? "superadmin" : "admin",
            username: username
        }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        return res.json({
            success: true,
            token,
            user: {
                username,
                role: username === "superadmin" ? "superadmin" : "admin"
            }
        });
    }
    
    // Check database for real users
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) return res.status(401).json({ success: false, msg: "User not found" });
        if (admin.password !== password) return res.status(401).json({ success: false, msg: "Wrong password" });

        const token = jwt.sign({
            id: admin._id,
            role: admin.role,
            username: admin.username
        }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.json({
            success: true,
            token,
            user: {
                username: admin.username,
                role: admin.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, msg: "Server error" });
    }
});

// ======== ADMIN REGISTRATION ========
app.post("/api/admin/register", async (req, res) => {
    try {
        const { username, password, role = "admin" } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, msg: "Username and password required" });
        }
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ success: false, msg: "Username already exists" });
        }
        
        // Create new admin
        const admin = await Admin.create({
            username,
            password,
            role
        });
        
        const token = jwt.sign({
            id: admin._id,
            role: admin.role,
            username: admin.username
        }, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.status(201).json({
            success: true,
            token,
            user: {
                username: admin.username,
                role: admin.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ success: false, msg: "Server error" });
    }
});

// ======== GET VERIFY ADMIN ========
app.get("/api/admin/verify-role", auth, (req, res) => {
    res.json({ 
        success: true, 
        role: req.admin?.role || req.user?.role, 
        username: req.admin?.username || req.user?.username 
    });
});

// ======== PRODUCTS ENDPOINTS ========

// GET ALL PRODUCTS or FILTER BY CATEGORY
app.get("/api/menu-items", async (req, res) => {
    try {
        const { category, featured } = req.query;
        let query = {};
        
        if (category && category !== "all") {
            query.category = category;
        }
        
        if (featured === "true") {
            query.featured = true;
        }
        
        query.available = true;
        
        const items = await Product.find(query).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error("Error fetching menu items:", error);
        res.status(500).json([]);
    }
});

// GET SINGLE PRODUCT
app.get("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, msg: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(400).json({ error: error.message });
    }
});

// CREATE PRODUCT
app.post("/api/products", auth, async (req, res) => {
    try {
        const item = await Product.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(400).json({ error: error.message });
    }
});

// UPDATE PRODUCT
app.put("/api/products/:id", auth, async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, msg: "Product not found" });
        }
        res.json(updated);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(400).json({ error: error.message });
    }
});

// DELETE PRODUCT
app.delete("/api/products/:id", auth, async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, msg: "Product not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(400).json({ error: error.message });
    }
});

// ======== AVAILABILITY TOGGLE ========
app.put("/api/products/:id/availability", auth, async (req, res) => {
    try {
        const { available } = req.body;
        const change = await Product.findByIdAndUpdate(
            req.params.id,
            { available },
            { new: true }
        );
        if (!change) {
            return res.status(404).json({ success: false, msg: "Product not found" });
        }
        res.json(change);
    } catch (error) {
        console.error("Error updating availability:", error);
        res.status(400).json({ error: error.message });
    }
});

// ======== FEATURED PRODUCTS ========
app.put("/api/products/:id/featured", auth, async (req, res) => {
    try {
        const { featured } = req.body;
        const change = await Product.findByIdAndUpdate(
            req.params.id,
            { featured },
            { new: true }
        );
        if (!change) {
            return res.status(404).json({ success: false, msg: "Product not found" });
        }
        res.json(change);
    } catch (error) {
        console.error("Error updating featured status:", error);
        res.status(400).json({ error: error.message });
    }
});

// GET FEATURED PRODUCTS
app.get("/api/featured-products", async (req, res) => {
    try {
        const featuredItems = await Product.find({ featured: true, available: true });
        res.json(featuredItems);
    } catch (error) {
        console.error("Error fetching featured products:", error);
        res.status(500).json([]);
    }
});

// ======== ORDERS ENDPOINTS ========

// CREATE ORDER (CUSTOMER)
app.post("/api/orders", async (req, res) => {
    try {
        const orderData = { ...req.body };
        
        // Calculate total if not provided
        if (!orderData.total && orderData.items && Array.isArray(orderData.items)) {
            orderData.total = orderData.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
        }
        
        // Set default status
        if (!orderData.status) {
            orderData.status = 'pending';
        }
        
        const order = await Order.create(orderData);
        res.status(201).json({ 
            success: true, 
            message: "Order placed successfully!",
            orderId: order._id, 
            order 
        });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// GET ALL ORDERS (ADMIN)
app.get("/api/orders", auth, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json([]);
    }
});

// GET SINGLE ORDER
app.get("/api/orders/:id", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, msg: "Order not found" });
        }
        res.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(400).json({ error: error.message });
    }
});

// UPDATE ORDER STATUS
app.put("/api/orders/:id/status", auth, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, msg: 'Invalid status' });
        }
        
        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!updated) {
            return res.status(404).json({ success: false, msg: "Order not found" });
        }
        
        res.json({ 
            success: true, 
            message: "Order status updated",
            order: updated 
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(400).json({ success: false, error: error.message });
    }
});

// GET TODAY'S ORDERS
app.get("/api/orders/today", auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = await Order.find({
            createdAt: { $gte: today }
        }).sort({ createdAt: -1 });
        
        res.json(todayOrders);
    } catch (error) {
        console.error("Error fetching today's orders:", error);
        res.status(500).json([]);
    }
});

// ======== DASHBOARD STATS ========
app.get("/api/dashboard/stats", auth, async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const availableProducts = await Product.countDocuments({ available: true });
        const totalOrders = await Order.countDocuments();
        
        // Today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today }
        });
        
        const todaySalesData = await Order.aggregate([
            { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        
        const todaySales = todaySalesData.length > 0 ? todaySalesData[0].total : 0;
        
        // Monthly sales
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlySalesData = await Order.aggregate([
            { $match: { createdAt: { $gte: firstDayOfMonth }, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        
        const monthlySales = monthlySalesData.length > 0 ? monthlySalesData[0].total : 0;
        
        res.json({
            totalProducts,
            availableProducts,
            totalOrders,
            todayOrders,
            todaySales,
            monthlySales
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// ======== CUSTOMER ENDPOINTS ========

// CUSTOMER REGISTRATION
app.post("/api/customers/register", async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, msg: "Email and password required" });
        }
        
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return res.status(400).json({ success: false, msg: "Email already registered" });
        }
        
        // Create new customer
        const customer = await Customer.create({
            name,
            email,
            phone,
            password
        });
        
        // Generate token for customer
        const token = jwt.sign({
            id: customer._id,
            email: customer.email,
            role: 'customer'
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
            success: true,
            token,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            }
        });
    } catch (error) {
        console.error("Customer registration error:", error);
        res.status(500).json({ success: false, msg: "Server error" });
    }
});

// CUSTOMER LOGIN
app.post("/api/customers/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, msg: "Email and password required" });
        }
        
        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(401).json({ success: false, msg: "Customer not found" });
        }
        
        if (customer.password !== password) {
            return res.status(401).json({ success: false, msg: "Wrong password" });
        }
        
        // Generate token for customer
        const token = jwt.sign({
            id: customer._id,
            email: customer.email,
            role: 'customer'
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            token,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            }
        });
    } catch (error) {
        console.error("Customer login error:", error);
        res.status(500).json({ success: false, msg: "Server error" });
    }
});

// ======== HEALTH CHECK ========
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

// ======== SERVE FRONTEND (Optional) ========
app.get("/admin", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AI Foodies Admin Panel</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                    text-align: center;
                }
                h1 { color: #333; }
                .endpoint {
                    background: #f5f5f5;
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 5px;
                    text-align: left;
                }
                .method { 
                    display: inline-block; 
                    padding: 3px 8px; 
                    border-radius: 3px; 
                    font-weight: bold; 
                    margin-right: 10px;
                }
                .get { background: #61affe; color: white; }
                .post { background: #49cc90; color: white; }
                .put { background: #fca130; color: white; }
                .delete { background: #f93e3e; color: white; }
            </style>
        </head>
        <body>
            <h1>🍕 AI Foodies Backend API</h1>
            <p>Server is running successfully! 🚀</p>
            <div>
                <h3>Available Endpoints:</h3>
                <div class="endpoint">
                    <span class="method get">GET</span> /api/menu-items
                    <p>Get all menu items or filter by category</p>
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span> /api/admin/login
                    <p>Admin login (demo: admin/admin123)</p>
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span> /api/orders
                    <p>Place a new order</p>
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span> /api/orders
                    <p>Get all orders (admin only)</p>
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span> /api/health
                    <p>Check server health</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// ======== 404 HANDLER ========
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`
    });
});

// ======== ERROR HANDLER ========
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

// ======== START SERVER ========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
