const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Core Authentication Middleware
 * Validates the Bearer token provided in the Authorization header.
 * Attaches the verified user mapping to the request object.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Standard Header Extraction
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. No authentication token provided in sequence." 
      });
    }

    // [TEMP DEBUG BYPASS] - For isolated architecture testing
    if (process.env.NODE_ENV === 'development') {
        if (token === 'DEVELOPER_ADMIN_TOKEN' || token === 'DEVELOPER_DEBUG_TOKEN') {
            req.user = {
                id: 'debug-root-id',
                email: 'admin@123.in',
                role: 'admin',
                firstName: 'Admin',
                lastName: 'Debug'
            };
            return next();
        }
        if (token === 'DEVELOPER_USER_TOKEN') {
            req.user = {
                id: 'debug-user-id',
                email: 'dev@cvtech.io',
                role: 'user',
                firstName: 'Dev',
                lastName: 'Tester'
            };
            return next();
        }
    }

    // Verify Identity Node
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded data
    req.user = decoded;
    
    // Verification against Database (Defensive layer)
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return res.status(401).json({ 
            success: false, 
            message: "The identity associated with this token no longer exists in the central vault." 
        });
    }
    
    // Supplement req.user with database profile (role, email etc)
    req.user = currentUser;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Session expired. Identity rotation required." 
      });
    }
    return res.status(403).json({ 
        success: false, 
        message: "Invalid or tampered token detected. Connection severed." 
    });
  }
};

/**
 * Administrative Role Guard
 */
const isAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superuser' && req.user.role !== 'superadmin')) {
        return res.status(403).json({ 
            success: false, 
            message: "Administrative privileges are required to access this architecture." 
        });
    }
    next();
};

/**
 * Root Tier Role Guard
 */
const isSuperuser = (req, res, next) => {
    if (!req.user || req.user.role !== 'superuser') {
        return res.status(403).json({ 
            success: false, 
            message: "Root-level authority (SuperUser) required for this operation." 
        });
    }
    next();
};

/**
 * Super Admin Role Guard
 */
const isSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'superadmin') {
        return res.status(403).json({ 
            success: false, 
            message: "Super Admin privileges only allowed for this structural modification." 
        });
    }
    next();
};

/**
 * Optional Authentication Middleware
 * Decodes the token if present, but allows the request to continue if not.
 */
const optionalProtect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);
        if (currentUser) {
            req.user = currentUser;
        }
        next();
    } catch (error) {
        next(); // Proceed as guest even on error
    }
};

module.exports = { protect, optionalProtect, isAdmin, isSuperuser, isSuperAdmin };
