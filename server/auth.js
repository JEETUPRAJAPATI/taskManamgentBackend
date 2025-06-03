import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
const JWT_EXPIRES_IN = "7d";

export function generateToken(user) {
  return jwt.sign({
    id: user.id || user._id,
    email: user.email,
    organizationId: user.organization ? user.organization.toString() : undefined,
    role: user.role
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function generateEmailVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function authenticateToken(req, res, next) {
  // Development mode bypass for testing
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: '507f1f77bcf86cd799439011',
      email: 'admin@example.com',
      organizationId: '507f1f77bcf86cd799439012',
      role: 'admin'
    };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

export function requireOrganization(req, res, next) {
  if (!req.user?.organizationId) {
    return res.status(403).json({ message: 'Organization membership required' });
  }
  next();
}