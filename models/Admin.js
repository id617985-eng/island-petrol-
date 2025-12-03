const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    fullName: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'manager', 'staff', 'viewer'],
        default: 'admin'
    },
    permissions: [{
        type: String,
        enum: [
            'view_dashboard',
            'manage_orders',
            'manage_menu',
            'manage_customers',
            'manage_admins',
            'manage_availability',
            'manage_slideshow',
            'view_reports',
            'edit_settings',
            'delete_data'
        ]
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    loginHistory: [{
        timestamp: Date,
        ipAddress: String,
        userAgent: String
    }],
    settings: {
        adminButtonHidden: {
            type: Boolean,
            default: false
        },
        otherSettings: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {}
        }
    }
}, {
    timestamps: true
});

// Hash password before saving
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

// Method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get effective permissions based on role and custom permissions
adminSchema.methods.getEffectivePermissions = function() {
    const rolePermissions = {
        superadmin: [
            'view_dashboard',
            'manage_orders',
            'manage_menu',
            'manage_customers',
            'manage_admins',
            'manage_availability',
            'manage_slideshow',
            'view_reports',
            'edit_settings',
            'delete_data'
        ],
        admin: [
            'view_dashboard',
            'manage_orders',
            'manage_menu',
            'manage_customers',
            'manage_availability',
            'manage_slideshow',
            'view_reports',
            'edit_settings'
        ],
        manager: [
            'view_dashboard',
            'manage_orders',
            'manage_menu',
            'manage_customers',
            'manage_availability',
            'view_reports'
        ],
        staff: [
            'view_dashboard',
            'manage_orders',
            'manage_availability'
        ],
        viewer: [
            'view_dashboard',
            'view_reports'
        ]
    };

    const basePermissions = rolePermissions[this.role] || [];
    const customPermissions = this.permissions || [];
    
    return [...new Set([...basePermissions, ...customPermissions])];
};

// Static method to create default admin if none exists
adminSchema.statics.createDefaultAdmin = async function() {
    const superadminExists = await this.findOne({ role: 'superadmin' });
    
    if (!superadminExists) {
        const defaultAdmin = new this({
            username: 'superadmin',
            password: 'superadmin123',
            fullName: 'System Super Admin',
            email: 'superadmin@aimaizeingnachos.com',
            role: 'superadmin',
            isActive: true
        });
        
        await defaultAdmin.save();
        console.log('✅ Default superadmin created');
    }
};

module.exports = mongoose.model('Admin', adminSchema);