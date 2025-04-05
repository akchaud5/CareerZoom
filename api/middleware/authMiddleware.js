const jwt = require('jsonwebtoken');
const User = require('../../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Log request headers for debugging
    console.log('Auth check for URL:', req.originalUrl);
    console.log('Request headers:', req.headers);
    
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      console.log('No Authorization header found');
      return res.status(401).json({ message: 'No Authorization header found, access denied' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
    console.log(`Token received: ${token.substring(0, 20)}...`);
    
    if (!token) {
      console.log('Empty token');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Log the JWT secret for debugging (mask most of it)
    if (process.env.JWT_SECRET) {
      console.log(`JWT_SECRET available, length: ${process.env.JWT_SECRET.length}`);
      console.log(`JWT_SECRET preview: ${process.env.JWT_SECRET.substring(0, 10)}...`);
    } else {
      console.error('JWT_SECRET is not defined');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      // Verify token
      console.log('Verifying token with JWT_SECRET');
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified, decoded user id:', decoded.id);
      } catch (e) {
        console.error('JWT verification immediate error:', e);
        throw e;
      }
      
      // Check if user exists
      console.log('Looking up user in database');
      
      // TEMPORARY: Skip database check and use token info directly
      console.log('TEMPORARY: Using token info directly instead of DB lookup');
      req.user = { _id: decoded.id };
      return next();
      
      /*
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('User not found in database:', decoded.id);
        return res.status(401).json({ message: 'Token is not valid, user not found' });
      }
      
      console.log('User authenticated:', user.email);
      
      // Set user in request object
      req.user = user;
      next();
      */
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired, please log in again' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token format or signature' });
      } else {
        return res.status(401).json({ message: 'Token verification failed: ' + jwtError.message });
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

module.exports = authMiddleware;
