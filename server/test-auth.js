
import { authService } from './services/authService.js';
import { MongoStorage } from './mongodb-storage.js';

const storage = new MongoStorage();

export async function setupTestRoutes(app) {
  // Test endpoint to validate auth flow
  app.get('/api/test/auth-flow', async (req, res) => {
    try {
      const testResults = {
        timestamp: new Date().toISOString(),
        tests: []
      };

      // Test 1: Database Connection
      try {
        await storage.connect();
        testResults.tests.push({
          test: 'Database Connection',
          status: 'PASS',
          message: 'Connected to MongoDB successfully'
        });
      } catch (error) {
        testResults.tests.push({
          test: 'Database Connection',
          status: 'FAIL',
          message: error.message
        });
      }

      // Test 2: Individual Registration
      try {
        const testEmail = `test-individual-${Date.now()}@test.com`;
        const result = await authService.registerIndividual({
          email: testEmail,
          firstName: 'Test',
          lastName: 'User'
        });
        
        testResults.tests.push({
          test: 'Individual Registration',
          status: result.autoAuthenticated ? 'PASS' : 'PASS (Email Verification Required)',
          message: result.message
        });
      } catch (error) {
        testResults.tests.push({
          test: 'Individual Registration',
          status: 'FAIL',
          message: error.message
        });
      }

      // Test 3: Organization Registration
      try {
        const testEmail = `test-org-${Date.now()}@test.com`;
        const result = await authService.registerOrganization({
          organizationName: `Test Org ${Date.now()}`,
          email: testEmail,
          firstName: 'Test',
          lastName: 'Admin'
        });
        
        testResults.tests.push({
          test: 'Organization Registration',
          status: result.autoAuthenticated ? 'PASS' : 'PASS (Email Verification Required)',
          message: result.message
        });
      } catch (error) {
        testResults.tests.push({
          test: 'Organization Registration',
          status: 'FAIL',
          message: error.message
        });
      }

      // Test 4: Login Flow
      try {
        // Try to login with a known test user
        const testUser = await storage.getUserByEmail('admin@test.com');
        if (testUser) {
          const loginResult = await authService.login('admin@test.com', 'password123');
          testResults.tests.push({
            test: 'Login Flow',
            status: 'PASS',
            message: 'Login successful',
            userRole: loginResult.user.role
          });
        } else {
          testResults.tests.push({
            test: 'Login Flow',
            status: 'SKIP',
            message: 'No test user found (admin@test.com)'
          });
        }
      } catch (error) {
        testResults.tests.push({
          test: 'Login Flow',
          status: 'FAIL',
          message: error.message
        });
      }

      // Test 5: Token Verification
      try {
        const testUser = await storage.getUserByEmail('admin@test.com');
        if (testUser) {
          const token = authService.generateToken(testUser);
          const decoded = authService.verifyToken(token);
          testResults.tests.push({
            test: 'Token Verification',
            status: 'PASS',
            message: 'Token generation and verification successful',
            tokenData: {
              id: decoded.id,
              role: decoded.role,
              organizationId: decoded.organizationId
            }
          });
        } else {
          testResults.tests.push({
            test: 'Token Verification',
            status: 'SKIP',
            message: 'No test user found'
          });
        }
      } catch (error) {
        testResults.tests.push({
          test: 'Token Verification',
          status: 'FAIL',
          message: error.message
        });
      }

      const passedTests = testResults.tests.filter(t => t.status === 'PASS').length;
      const totalTests = testResults.tests.filter(t => t.status !== 'SKIP').length;
      
      testResults.summary = {
        passed: passedTests,
        total: totalTests,
        success: passedTests === totalTests
      };

      res.json(testResults);
    } catch (error) {
      res.status(500).json({
        error: 'Test execution failed',
        message: error.message
      });
    }
  });

  // Create test users endpoint
  app.post('/api/test/create-test-users', async (req, res) => {
    try {
      const results = [];

      // Create super admin
      try {
        const superAdminData = {
          email: 'superadmin@test.com',
          firstName: 'Super',
          lastName: 'Admin',
          passwordHash: await authService.hashPassword('password123'),
          role: 'super_admin',
          isActive: true,
          emailVerified: true
        };
        
        const existingSuperAdmin = await storage.getUserByEmail('superadmin@test.com');
        if (!existingSuperAdmin) {
          await storage.createUser(superAdminData);
          results.push({ type: 'super_admin', email: 'superadmin@test.com', status: 'created' });
        } else {
          results.push({ type: 'super_admin', email: 'superadmin@test.com', status: 'exists' });
        }
      } catch (error) {
        results.push({ type: 'super_admin', status: 'failed', error: error.message });
      }

      // Create company admin
      try {
        const existingAdmin = await storage.getUserByEmail('admin@test.com');
        if (!existingAdmin) {
          // Create organization first
          const org = await storage.createOrganization({
            name: 'Test Company',
            slug: 'test-company',
            isActive: true
          });

          const adminData = {
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'User',
            passwordHash: await authService.hashPassword('password123'),
            role: 'admin',
            organization: org._id,
            organizationId: org._id,
            isActive: true,
            emailVerified: true
          };
          
          await storage.createUser(adminData);
          results.push({ type: 'admin', email: 'admin@test.com', status: 'created', organization: org.name });
        } else {
          results.push({ type: 'admin', email: 'admin@test.com', status: 'exists' });
        }
      } catch (error) {
        results.push({ type: 'admin', status: 'failed', error: error.message });
      }

      // Create regular member
      try {
        const existingMember = await storage.getUserByEmail('member@test.com');
        if (!existingMember) {
          const memberData = {
            email: 'member@test.com',
            firstName: 'Member',
            lastName: 'User',
            passwordHash: await authService.hashPassword('password123'),
            role: 'member',
            isActive: true,
            emailVerified: true
          };
          
          await storage.createUser(memberData);
          results.push({ type: 'member', email: 'member@test.com', status: 'created' });
        } else {
          results.push({ type: 'member', email: 'member@test.com', status: 'exists' });
        }
      } catch (error) {
        results.push({ type: 'member', status: 'failed', error: error.message });
      }

      res.json({
        message: 'Test users creation completed',
        results
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create test users',
        message: error.message
      });
    }
  });
}
