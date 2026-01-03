// File: auth.js
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            return res.status(401).json({ success: false, msg: "No token, authorization denied" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token is for admin or customer
        if (decoded.role === 'customer') {
            req.customer = decoded;
        } else {
            req.admin = decoded;
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, msg: "Token is not valid" });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, msg: "Token has expired" });
        }
        
        res.status(401).json({ success: false, msg: "Authorization failed" });
    }
};

module.exports = auth;