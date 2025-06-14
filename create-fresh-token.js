import jwt from 'jsonwebtoken';

// Generate fresh token for admin user
const payload = {
  id: '684cf177711c79e1b9c0dd00', // Admin user ID from database
  email: 'admin@demo.com',
  role: 'admin',
  organizationId: '684cf176711c79e1b9c0dcfd', // Demo Company organization ID
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key');
console.log('Fresh Token:', token);