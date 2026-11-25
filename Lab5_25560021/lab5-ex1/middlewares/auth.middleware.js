const jwt = require('jsonwebtoken');

// Verify JWT from "Authorization: Bearer <token>"
function protect(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Please log in first.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // { id, type, iat, exp }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token.'
    });
  }
}

// Enforce server-side role check after protect()
function adminOnly(req, res, next) {
  if (!req.user || req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Only admin users can perform this action.'
    });
  }
  next();
}

module.exports = { protect, adminOnly };