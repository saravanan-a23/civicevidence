const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - verify token
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwttokenkeyfordigital evidenciassystem');

      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found in system.' });
      }

      if (req.user.status !== 'active') {
        return res.status(403).json({ message: 'Account is pending activation or is deactivated. Please contact Administrator.' });
      }

      next();
    } catch (error) {
      console.error('JWT Auth Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token validation failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing.' });
  }
};

/**
 * Role authorization guard
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden: User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to perform this action.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
