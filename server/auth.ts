import { storage } from "./mongodb-storage.js";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
const JWT_EXPIRES_IN = "7d";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId?: string;
    role: string;
  };
}

export function generateToken(user: { id: string; email: string; organizationId?: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; organizationId?: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
    id: user.id,
    email: user.email,
    organizationId: user.organizationId || undefined,
    role: user.role,
  };

  next();
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

export function requireOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.organizationId) {
    return res.status(403).json({ message: 'Organization membership required' });
  }
  next();
}