import { storage } from './server/mongodb-storage.js';

async function createTestAdmin() {
  try {
    // Create test organization
    const orgData = {
      name: "Test Organization",
      slug: "test-org",
      email: "admin@test-org.com",
      maxUsers: 10,
      isActive: true
    };
    
    const organization = await storage.createOrganization(orgData);
    console.log('Created organization:', organization._id);
    
    // Create admin user
    const adminData = {
      email: "admin@test-org.com",
      firstName: "Test",
      lastName: "Admin", 
      password: "admin123",
      role: "org_admin",
      organizationId: organization._id,
      status: "active",
      isActive: true,
      emailVerified: true
    };
    
    const admin = await storage.createUser(adminData);
    console.log('Created admin user:', admin._id);
    
    // Generate token for testing
    const token = storage.generateToken(admin);
    console.log('Admin token:', token);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestAdmin();