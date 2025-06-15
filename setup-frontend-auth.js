// Script to generate a valid token for frontend testing
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate token for the admin user we found
const token = jwt.sign({
  id: '684cf177711c79e1b9c0dd00',
  email: 'admin@demo.com',
  role: 'admin',
  organizationId: '684cf176711c79e1b9c0dcfd'
}, JWT_SECRET, { expiresIn: '7d' });

console.log('Copy this token to localStorage in browser:');
console.log(`localStorage.setItem('token', '${token}');`);
console.log('\nAlso set user data:');
console.log(`localStorage.setItem('user', '${JSON.stringify({
  id: '684cf177711c79e1b9c0dd00',
  email: 'admin@demo.com',
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  organizationId: '684cf176711c79e1b9c0dcfd'
})}');`);