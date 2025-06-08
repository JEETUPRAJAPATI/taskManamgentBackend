import { storage } from "./mongodb-storage.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";

export function generateToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Verify user still exists and is active
  const user = await storage.getUser(decoded.id);
  if (!user || !user.isActive) {
    return res.status(403).json({ message: 'User not found or inactive' });
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
    organizationId: decoded.organizationId || user.organization || user.organizationId,
    role: decoded.role,
  };

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