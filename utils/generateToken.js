const jwt = require("jsonwebtoken");

/**
 * Generates a short-lived access token for the session.
 * Includes user identifying mapping and administrative role.
 */
exports.generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || "15m" 
    }
  );
};

/**
 * Generates a long-lived refresh token for session persistence.
 */
exports.generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" 
    }
  );
};
