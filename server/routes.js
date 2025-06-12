import express from "express";
import { createServer } from "http";
import { MongoStorage } from "./mongodb-storage.js";
import { authenticateToken, requireRole, requireOrganization } from "./auth.js";
import { requireSuperAdmin, requireSuperAdminOrCompanyAdmin } from "./middleware/superAdminAuth.js";
import { authenticateToken as roleAuthToken, requireSuperAdmin as roleRequireSuperAdmin, requireAdminOrAbove, requireEmployee } from "./middleware/roleAuth.js";
import { authService } from "./services/authService.js";
// import { setupTestRoutes } from "./test-auth.js";
import { z } from "zod";

const storage = new MongoStorage();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  organizationName: z.string().optional()
});

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().optional(),
  assignedToId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).default([])
});

const smartTaskInputSchema = z.object({
  input: z.string().min(1),
  projectId: z.string().optional()
});

export async function registerRoutes(app) {
  // Validation middleware
  const validateBody = (schema) => {
    return (req, res, next) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: error.errors 
          });
        }
        next(error);
      }
    };
  };

  // New Authentication Routes for User Management Module

  // Individual user registration
  app.post("/api/auth/register-individual", async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const result = await authService.registerIndividual({ email, firstName, lastName });
      res.json(result);
    } catch (error) {
      console.error("Individual registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Legacy endpoint for compatibility
  app.post("/api/auth/register/individual", async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const result = await authService.registerIndividual({ email, firstName, lastName });
      res.json(result);
    } catch (error) {
      console.error("Individual registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Organization registration
  app.post("/api/auth/register-organization", async (req, res) => {
    try {
      const { organizationName, organizationSlug, email, firstName, lastName } = req.body;
      
      if (!organizationName || !email || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const result = await authService.registerOrganization({ 
        organizationName, 
        organizationSlug,
        email, 
        firstName, 
        lastName 
      });
      res.json(result);
    } catch (error) {
      console.error("Organization registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Legacy endpoint for compatibility
  app.post("/api/auth/register/organization", async (req, res) => {
    try {
      const { organizationName, email, firstName, lastName } = req.body;
      
      if (!organizationName || !email || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const result = await authService.registerOrganization({ 
        organizationName, email, firstName, lastName 
      });
      res.json(result);
    } catch (error) {
      console.error("Organization registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });



  // Resend verification code
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await authService.resendVerificationCode(email);
      res.json(result);
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Complete individual registration
  app.post("/api/auth/complete-registration", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const result = await authService.completeIndividualRegistration(email, password);
      res.json(result);
    } catch (error) {
      console.error("Complete registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Complete organization registration
  app.post("/api/auth/complete-organization-registration", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const result = await authService.completeOrganizationRegistration(email, password);
      res.json(result);
    } catch (error) {
      console.error("Complete organization registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Forgot password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await authService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Validate reset token
  app.post("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Reset token is required" });
      }

      const result = await authService.validateResetToken(token);
      res.json(result);
    } catch (error) {
      console.error("Validate reset token error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      const result = await authService.resetPassword(token, password);
      res.json(result);
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Validate reset token
  app.post("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const result = await authService.validateResetToken(token);
      res.json(result);
    } catch (error) {
      console.error("Validate reset token error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Verify token and get user info for password setup
  app.post("/api/auth/verify-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const result = await authService.validateVerificationToken(token);
      res.json(result);
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Set password for verified user
  app.post("/api/auth/set-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      const result = await authService.setPasswordWithToken(token, password);
      res.json(result);
    } catch (error) {
      console.error("Set password error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      const result = await authService.resetPassword(token, password);
      res.json(result);
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Auth verification endpoint
  app.get('/api/auth/verify', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Return consistent user data structure
      const userData = {
        id: user._id,
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organization || user.organizationId,
        isActive: user.isActive,
        emailVerified: user.emailVerified
      };
      
      res.json(userData);
    } catch (error) {
      console.error('Auth verification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Resend verification code
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const result = await authService.resendVerificationCode(email);
      res.json(result);
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Update login route to use auth service
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: error.message });
    }
  });

  // Legacy auth routes
  app.post("/api/auth/register", validateBody(registerSchema), async (req, res) => {
    try {
      const { email, password, firstName, lastName, organizationName } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      let organizationId;
      if (organizationName) {
        const slug = organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const organization = await storage.createOrganization({
          name: organizationName,
          slug,
        });
        organizationId = organization._id;

        // Create default task statuses
        const defaultStatuses = [
          { name: "To Do", color: "#6B7280", order: 0, isDefault: true, organization: organizationId },
          { name: "In Progress", color: "#3B82F6", order: 1, organization: organizationId },
          { name: "Review", color: "#F59E0B", order: 2, organization: organizationId },
          { name: "Done", color: "#10B981", order: 3, isCompleted: true, organization: organizationId },
        ];

        for (const status of defaultStatuses) {
          await storage.createTaskStatus(status);
        }
      }

      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        password,
        organization: organizationId,
        role: organizationId ? "admin" : "member",
      });

      const token = storage.generateToken(user);

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organization,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", validateBody(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await storage.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }

      await storage.updateUser(user._id, { lastLoginAt: new Date() });

      const token = storage.generateToken(user);

      res.json({
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organization,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Protected routes
  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organization,
        profileImageUrl: user.profileImageUrl,
        preferences: user.preferences,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // User invitation routes
  app.post("/api/users/invite", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { users } = req.body;
      
      if (!users || !Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ message: "Users array is required" });
      }

      const results = [];
      const errors = [];

      for (const userData of users) {
        try {
          // Check if user already exists
          const existingUser = await storage.getUserByEmail(userData.email);
          if (existingUser && existingUser.organization?.toString() === req.user.organizationId) {
            errors.push(`${userData.email} already exists. That user will not be reinvited.`);
            continue;
          }

          // Generate invite token
          const inviteToken = storage.generateEmailVerificationToken();
          const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

          // Create invited user record
          const invitedUser = await storage.createUser({
            email: userData.email,
            roles: userData.roles || ['member'],
            status: 'invited',
            inviteToken,
            inviteTokenExpiry,
            invitedBy: req.user.id,
            invitedAt: new Date(),
            organization: req.user.organizationId,
            isActive: false,
            emailVerified: false
          });

          // Send invitation email
          const adminUser = await storage.getUser(req.user.id);
          const organization = await storage.getOrganization(req.user.organizationId);
          
          await storage.sendInvitationEmail(
            userData.email,
            inviteToken,
            organization.name,
            userData.roles,
            `${adminUser.firstName} ${adminUser.lastName}`
          );

          results.push({
            email: userData.email,
            status: 'invited',
            roles: userData.roles
          });

        } catch (error) {
          errors.push(`Failed to invite ${userData.email}: ${error.message}`);
        }
      }

      res.json({
        message: `Successfully invited ${results.length} users`,
        invited: results,
        errors
      });
    } catch (error) {
      console.error("Invite users error:", error);
      res.status(500).json({ message: "Failed to invite users" });
    }
  });

  // Accept invitation route
  app.post("/api/auth/accept-invite", async (req, res) => {
    try {
      const { token, firstName, lastName, password } = req.body;
      
      if (!token || !firstName || !lastName || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Find user by invite token
      const user = await storage.getUserByInviteToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired invitation" });
      }

      if (user.inviteTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }

      // Update user with account details
      const hashedPassword = await storage.hashPassword(password);
      await storage.updateUser(user._id, {
        firstName,
        lastName,
        passwordHash: hashedPassword,
        status: 'active',
        isActive: true,
        emailVerified: true,
        inviteToken: null,
        inviteTokenExpiry: null
      });

      const updatedUser = await storage.getUser(user._id);
      const authToken = storage.generateToken(updatedUser);

      res.json({
        message: "Account activated successfully",
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          organizationId: updatedUser.organization
        },
        token: authToken
      });
    } catch (error) {
      console.error("Accept invite error:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Get invitation details
  app.get("/api/auth/invite/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await storage.getUserByInviteToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid invitation" });
      }

      if (user.inviteTokenExpiry < new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }

      const organization = await storage.getOrganization(user.organization);
      
      res.json({
        email: user.email,
        roles: user.roles || ['member'],
        organizationName: organization?.name || 'Unknown Organization',
        valid: true
      });
    } catch (error) {
      console.error("Get invite details error:", error);
      res.status(500).json({ message: "Failed to get invitation details" });
    }
  });

  // Get organization users with license info
  app.get("/api/users/organization", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getOrganizationUsersDetailed(req.user.organizationId);
      const organization = await storage.getOrganization(req.user.organizationId);
      
      const licenseInfo = {
        totalLicenses: organization?.maxUsers || 10,
        licenseType: 'Standard',
        usedLicenses: users.filter(u => u.status === 'active').length,
        availableLicenses: (organization?.maxUsers || 10) - users.filter(u => u.status === 'active').length
      };

      res.json({
        users,
        licenseInfo
      });
    } catch (error) {
      console.error("Get organization users error:", error);
      res.status(500).json({ message: "Failed to get organization users" });
    }
  });

  // Deactivate user
  app.patch("/api/users/:id/deactivate", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.organization?.toString() !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.updateUser(id, {
        status: 'inactive',
        isActive: false
      });

      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Deactivate user error:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Resend invitation
  app.post("/api/users/:id/resend-invite", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.organization?.toString() !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (user.status === 'active') {
        return res.status(400).json({ message: "User is already active" });
      }

      // Generate new invite token
      const inviteToken = storage.generateEmailVerificationToken();
      const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await storage.updateUser(id, {
        inviteToken,
        inviteTokenExpiry,
        status: 'invited'
      });

      // Resend invitation email
      const adminUser = await storage.getUser(req.user.id);
      const organization = await storage.getOrganization(req.user.organizationId);
      
      await storage.sendInvitationEmail(
        user.email,
        inviteToken,
        organization.name,
        user.roles || ['member'],
        `${adminUser.firstName} ${adminUser.lastName}`
      );

      res.json({ message: "Invitation resent successfully" });
    } catch (error) {
      console.error("Resend invite error:", error);
      res.status(500).json({ message: "Failed to resend invitation" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id, req.user.organizationId);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const filters = {
        projectId: req.query.projectId,
        assignedToId: req.query.assignedToId,
        createdById: req.query.createdById,
        statusId: req.query.statusId,
        priority: req.query.priority,
        search: req.query.search,
      };

      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Failed to get tasks" });
    }
  });

  app.post("/api/tasks", authenticateToken, validateBody(createTaskSchema), async (req, res) => {
    try {
      const taskData = {
        ...req.body,
        organization: req.user.organizationId,
        createdBy: req.user.id,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };

      const task = await storage.createTask(taskData);
      
      // Create notification for assignee if different from creator
      if (task.assignedTo && task.assignedTo.toString() !== task.createdBy.toString()) {
        await storage.createNotification({
          user: task.assignedTo,
          type: "task_assigned",
          title: "New task assigned",
          message: `You have been assigned the task: ${task.title}`,
          data: { taskId: task._id },
        });
      }

      res.status(201).json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.post("/api/tasks/smart-create", authenticateToken, validateBody(smartTaskInputSchema), async (req, res) => {
    try {
      const { input, projectId } = req.body;
      
      const parsed = parseSmartTaskInput(input);
      
      const taskData = {
        title: parsed.title,
        description: parsed.description,
        project: projectId || parsed.projectId,
        priority: parsed.priority || "medium",
        dueDate: parsed.dueDate,
        tags: parsed.tags,
        organization: req.user.organizationId,
        createdBy: req.user.id,
        metadata: { originalInput: input, parsedData: parsed },
      };

      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Smart create task error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.organization?.toString() !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(task);
    } catch (error) {
      console.error("Get task error:", error);
      res.status(500).json({ message: "Failed to get task" });
    }
  });

  app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.organization?.toString() !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        completedAt: req.body.completed ? new Date() : null,
      };

      const updatedTask = await storage.updateTask(req.params.id, updateData);
      res.json(updatedTask);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.organization?.toString() !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteTask(req.params.id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Task comments routes
  app.get("/api/tasks/:id/comments", authenticateToken, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.organization?.toString() !== req.user.organizationId) {
        return res.status(404).json({ message: "Task not found" });
      }

      const comments = await storage.getTaskComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Get task comments error:", error);
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  app.post("/api/tasks/:id/comments", authenticateToken, async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.organization?.toString() !== req.user.organizationId) {
        return res.status(404).json({ message: "Task not found" });
      }

      const commentData = {
        task: req.params.id,
        user: req.user.id,
        content: req.body.content,
        mentions: req.body.mentions || [],
      };

      const comment = await storage.createTaskComment(commentData);
      
      // Create notifications for mentions
      if (commentData.mentions?.length > 0) {
        for (const userId of commentData.mentions) {
          await storage.createNotification({
            user: userId,
            type: "mention",
            title: "You were mentioned",
            message: `You were mentioned in a comment on task: ${task.title}`,
            data: { taskId: task._id, commentId: comment._id },
          });
        }
      }

      res.status(201).json(comment);
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
      const notifications = await storage.getNotifications(req.user.id, isRead);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/read-all", authenticateToken, async (req, res) => {
    try {
      await storage.markAllNotificationsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // Organization/Admin routes
  app.get("/api/organization/users", authenticateToken, requireOrganization, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const users = await storage.getOrganizationUsers(req.user.organizationId);
      res.json(users);
    } catch (error) {
      console.error("Get organization users error:", error);
      res.status(500).json({ message: "Failed to get organization users" });
    }
  });

  app.get("/api/organization/usage", authenticateToken, requireOrganization, requireRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const months = parseInt(req.query.months) || 12;
      const usage = await storage.getUsageStats(req.user.organizationId, months);
      res.json(usage);
    } catch (error) {
      console.error("Get usage stats error:", error);
      res.status(500).json({ message: "Failed to get usage statistics" });
    }
  });

  // Projects routes
  app.get("/api/projects", authenticateToken, async (req, res) => {
    try {
      const projects = await storage.getProjects({ organizationId: req.user.organizationId });
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  app.post("/api/projects", authenticateToken, async (req, res) => {
    try {
      const projectData = {
        ...req.body,
        organization: req.user.organizationId,
        owner: req.user.id,
      };

      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Task statuses routes
  app.get("/api/task-statuses", authenticateToken, async (req, res) => {
    try {
      const statuses = await storage.getTaskStatuses(req.user.organizationId);
      res.json(statuses);
    } catch (error) {
      console.error("Get task statuses error:", error);
      res.status(500).json({ message: "Failed to get task statuses" });
    }
  });

  // Setup email and calendar integration routes
  await setupEmailCalendarRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}

// Smart task input parsing function
function parseSmartTaskInput(input) {
  const result = { tags: [] };
  
  // Extract due date patterns
  const dueDatePatterns = [
    /(?:due|by|until)\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(?:due|by|until)\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /(?:due|by|until)\s+(\d{1,2}\/\d{1,2})/i,
  ];
  
  for (const pattern of dueDatePatterns) {
    const match = input.match(pattern);
    if (match) {
      result.dueDate = parseDateString(match[1]);
      input = input.replace(match[0], '').trim();
      break;
    }
  }
  
  // Extract priority
  const priorityMatch = input.match(/(?:priority|pri)\s+(low|medium|high|urgent)/i);
  if (priorityMatch) {
    result.priority = priorityMatch[1].toLowerCase();
    input = input.replace(priorityMatch[0], '').trim();
  }
  
  // Extract tags
  const tagMatches = input.match(/#[\w-]+/g);
  if (tagMatches) {
    result.tags = tagMatches.map(tag => tag.substring(1));
    input = input.replace(/#[\w-]+/g, '').trim();
  }
  
  // Extract mentions
  const mentionMatches = input.match(/@[\w-]+/g);
  if (mentionMatches) {
    result.mentions = mentionMatches.map(mention => mention.substring(1));
    input = input.replace(/@[\w-]+/g, '').trim();
  }
  
  // The remaining text is the title
  result.title = input.trim();
  
  return result;
}

function parseDateString(dateStr) {
  const today = new Date();
  
  switch (dateStr.toLowerCase()) {
    case 'today':
      return today;
    case 'tomorrow':
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    case 'monday':
    case 'tuesday':
    case 'wednesday':
    case 'thursday':
    case 'friday':
    case 'saturday':
    case 'sunday':
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = daysOfWeek.indexOf(dateStr.toLowerCase());
      const currentDay = today.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilTarget);
      return targetDate;
    default:
      // Try to parse as a regular date
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? undefined : parsed;
  }
}

// Email & Calendar Integration
async function setupEmailCalendarRoutes(app) {
  // Create simple mock services for now - integrations will be available once properly configured
  const emailService = {
    initializeGmail: () => false,
    initializeIMAP: () => false,
    syncEmails: () => ({ emailsProcessed: 0, tasksCreated: 0 }),
    gmail: null,
    imapConfig: null
  };
  
  const calendarService = {
    initializeGoogleCalendar: () => false,
    initializeOutlook: () => false,
    syncCalendars: () => ({ eventsProcessed: 0, tasksCreated: 0 }),
    getUpcomingEvents: () => [],
    getIntegrationStatus: () => ({ googleCalendar: false, outlook: false, isRunning: false })
  };

  // Email integration setup
  app.post("/api/integrations/email/setup", authenticateToken, async (req, res) => {
    try {
      const { type, credentials } = req.body;
      
      if (type === 'gmail') {
        const success = await emailService.initializeGmail(credentials);
        if (success) {
          res.json({ message: "Gmail integration configured successfully" });
        } else {
          res.status(400).json({ message: "Failed to configure Gmail integration" });
        }
      } else if (type === 'imap') {
        emailService.initializeIMAP(credentials);
        res.json({ message: "IMAP integration configured successfully" });
      } else {
        res.status(400).json({ message: "Invalid email integration type" });
      }
    } catch (error) {
      console.error("Email setup error:", error);
      res.status(500).json({ message: "Failed to setup email integration" });
    }
  });

  // Manual email sync
  app.post("/api/integrations/email/sync", authenticateToken, async (req, res) => {
    try {
      const { method = 'gmail' } = req.body;
      const result = await emailService.syncEmails(
        req.user.organizationId,
        req.user.id,
        method
      );
      res.json(result);
    } catch (error) {
      console.error("Email sync error:", error);
      res.status(500).json({ message: "Failed to sync emails" });
    }
  });

  // Calendar integration setup
  app.post("/api/integrations/calendar/setup", authenticateToken, async (req, res) => {
    try {
      const { type, credentials } = req.body;
      
      if (type === 'google') {
        const success = await calendarService.initializeGoogleCalendar(credentials);
        if (success) {
          res.json({ message: "Google Calendar integration configured successfully" });
        } else {
          res.status(400).json({ message: "Failed to configure Google Calendar integration" });
        }
      } else if (type === 'outlook') {
        const success = await calendarService.initializeOutlook(credentials);
        if (success) {
          res.json({ message: "Outlook Calendar integration configured successfully" });
        } else {
          res.status(400).json({ message: "Failed to configure Outlook integration" });
        }
      } else {
        res.status(400).json({ message: "Invalid calendar integration type" });
      }
    } catch (error) {
      console.error("Calendar setup error:", error);
      res.status(500).json({ message: "Failed to setup calendar integration" });
    }
  });

  // Manual calendar sync
  app.post("/api/integrations/calendar/sync", authenticateToken, async (req, res) => {
    try {
      const { sources = ['google'], outlookAccessToken } = req.body;
      const result = await calendarService.syncCalendars(
        req.user.organizationId,
        req.user.id,
        sources,
        outlookAccessToken
      );
      res.json(result);
    } catch (error) {
      console.error("Calendar sync error:", error);
      res.status(500).json({ message: "Failed to sync calendar events" });
    }
  });

  // Get upcoming events
  app.get("/api/integrations/calendar/events", authenticateToken, async (req, res) => {
    try {
      const { sources = ['google'], outlookAccessToken } = req.query;
      const sourcesArray = typeof sources === 'string' ? [sources] : sources;
      
      const events = await calendarService.getUpcomingEvents(
        req.user.organizationId,
        req.user.id,
        sourcesArray,
        outlookAccessToken
      );
      res.json(events);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  // Get integration status
  app.get("/api/integrations/status", authenticateToken, async (req, res) => {
    try {
      const calendarStatus = calendarService.getIntegrationStatus();
      res.json({
        email: {
          gmail: !!emailService.gmail,
          imap: !!emailService.imapConfig
        },
        calendar: calendarStatus
      });
    } catch (error) {
      console.error("Integration status error:", error);
      res.status(500).json({ message: "Failed to get integration status" });
    }
  });

  // Role Management API Routes
  
  // Get all roles
  app.get("/api/roles", authenticateToken, requireOrganization, async (req, res) => {
    try {
      const roles = await storage.getRoles(req.user.organizationId);
      res.json(roles);
    } catch (error) {
      console.error("Get roles error:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Create a new role
  app.post("/api/roles", authenticateToken, requireOrganization, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
      const { name, description, permissions = [] } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Role name is required" });
      }

      // Check if role name already exists in the organization
      const existingRole = await storage.getRoleByName(name.trim(), req.user.organizationId);
      if (existingRole) {
        return res.status(400).json({ message: "Role name already exists in your organization" });
      }

      const role = await storage.createRole({
        name: name.trim(),
        description: description?.trim() || '',
        permissions: Array.isArray(permissions) ? permissions : [],
        organizationId: req.user.organizationId,
        createdBy: req.user.id
      });

      res.status(201).json(role);
    } catch (error) {
      console.error("Create role error:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  // Update a role
  app.put("/api/roles/:id", authenticateToken, requireOrganization, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      
      if (!name || name.trim() === '') {
        return res.status(400).json({ message: "Role name is required" });
      }

      // Check if the role exists and belongs to the organization
      const existingRole = await storage.getRole(id);
      if (!existingRole) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (existingRole.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if the new name conflicts with another role
      if (name.trim() !== existingRole.name) {
        const conflictingRole = await storage.getRoleByName(name.trim(), req.user.organizationId);
        if (conflictingRole && conflictingRole._id.toString() !== id) {
          return res.status(400).json({ message: "Role name already exists in your organization" });
        }
      }

      const updatedRole = await storage.updateRole(id, {
        name: name.trim(),
        description: description?.trim() || '',
        permissions: Array.isArray(permissions) ? permissions : existingRole.permissions,
        updatedBy: req.user.id
      });

      res.json(updatedRole);
    } catch (error) {
      console.error("Update role error:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Delete a role
  app.delete("/api/roles/:id", authenticateToken, requireOrganization, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the role exists and belongs to the organization
      const existingRole = await storage.getRole(id);
      if (!existingRole) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (existingRole.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if any users are assigned to this role
      const usersWithRole = await storage.getUsersByRole(id);
      if (usersWithRole.length > 0) {
        return res.status(400).json({ 
          message: `Cannot delete role. ${usersWithRole.length} user(s) are assigned to this role. Please reassign or remove these users first.` 
        });
      }

      await storage.deleteRole(id);
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Delete role error:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // Get role by ID
  app.get("/api/roles/:id", authenticateToken, requireOrganization, async (req, res) => {
    try {
      const { id } = req.params;
      
      const role = await storage.getRole(id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      if (role.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(role);
    } catch (error) {
      console.error("Get role error:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  // Assign role to user
  app.post("/api/roles/assign", authenticateToken, requireOrganization, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
      const { userId, roleId } = req.body;

      if (!userId || !roleId) {
        return res.status(400).json({ message: "User ID and Role ID are required" });
      }

      // Verify role exists and belongs to organization
      const role = await storage.getRole(roleId);
      if (!role || role.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Verify user exists and belongs to organization
      const user = await storage.getUser(userId);
      if (!user || user.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user's role
      const updatedUser = await storage.updateUser(userId, { roleId });
      res.json({ message: "Role assigned successfully", user: updatedUser });
    } catch (error) {
      console.error("Assign role error:", error);
      res.status(500).json({ message: "Failed to assign role" });
    }
  });

  // Get users by role
  app.get("/api/roles/:id/users", authenticateToken, requireOrganization, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify role exists and belongs to organization
      const role = await storage.getRole(id);
      if (!role || role.organizationId !== req.user.organizationId) {
        return res.status(404).json({ message: "Role not found" });
      }

      const users = await storage.getUsersByRole(id);
      res.json(users);
    } catch (error) {
      console.error("Get users by role error:", error);
      res.status(500).json({ message: "Failed to fetch users for role" });
    }
  });

  // Reports API Routes
  
  // Get report data
  app.get("/api/reports", async (req, res) => {
    try {
      // Return mock report data for now to ensure UI works
      const mockReportData = {
        summary: {
          totalUsers: 12,
          totalTasks: 48,
          avgCompletion: 75,
          overdueTasks: 6
        },
        userPerformance: [
          {
            userId: "1",
            userName: "John Doe",
            userEmail: "john@example.com",
            department: "Engineering",
            totalTasks: 15,
            completedTasks: 12,
            inProgressTasks: 2,
            overdueTasks: 1,
            progressPercentage: 80,
            hoursLogged: 45
          },
          {
            userId: "2",
            userName: "Jane Smith",
            userEmail: "jane@example.com",
            department: "Design",
            totalTasks: 12,
            completedTasks: 9,
            inProgressTasks: 2,
            overdueTasks: 1,
            progressPercentage: 75,
            hoursLogged: 38
          },
          {
            userId: "3",
            userName: "Mike Johnson",
            userEmail: "mike@example.com",
            department: "Marketing",
            totalTasks: 10,
            completedTasks: 7,
            inProgressTasks: 2,
            overdueTasks: 1,
            progressPercentage: 70,
            hoursLogged: 32
          }
        ],
        userTaskData: [
          { userName: "John Doe", totalTasks: 15, completedTasks: 12 },
          { userName: "Jane Smith", totalTasks: 12, completedTasks: 9 },
          { userName: "Mike Johnson", totalTasks: 10, completedTasks: 7 }
        ],
        statusDistribution: [
          { name: "Completed", value: 28 },
          { name: "In Progress", value: 12 },
          { name: "Todo", value: 6 },
          { name: "Review", value: 2 }
        ],
        trendData: [
          { date: "2024-05-01", completed: 5, created: 8, overdue: 2 },
          { date: "2024-05-02", completed: 3, created: 6, overdue: 1 },
          { date: "2024-05-03", completed: 7, created: 9, overdue: 3 },
          { date: "2024-05-04", completed: 4, created: 5, overdue: 2 },
          { date: "2024-05-05", completed: 6, created: 7, overdue: 1 }
        ],
        taskDetails: [
          {
            _id: "1",
            title: "Design user interface mockups",
            assignedTo: { firstName: "Jane", lastName: "Smith" },
            project: { name: "Web App Redesign" },
            status: "completed",
            priority: "high",
            dueDate: "2024-05-10",
            progress: 100
          },
          {
            _id: "2",
            title: "Implement authentication system",
            assignedTo: { firstName: "John", lastName: "Doe" },
            project: { name: "Backend API" },
            status: "in-progress",
            priority: "medium",
            dueDate: "2024-05-15",
            progress: 75
          },
          {
            _id: "3",
            title: "Create marketing campaign",
            assignedTo: { firstName: "Mike", lastName: "Johnson" },
            project: { name: "Product Launch" },
            status: "todo",
            priority: "low",
            dueDate: "2024-05-20",
            progress: 0
          }
        ]
      };

      res.json(mockReportData);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Failed to fetch report data" });
    }
  });

  // Get filter options for reports
  app.get("/api/reports/filters", async (req, res) => {
    try {
      const filterOptions = {
        users: [
          { _id: "1", firstName: "John", lastName: "Doe", email: "john@example.com" },
          { _id: "2", firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
          { _id: "3", firstName: "Mike", lastName: "Johnson", email: "mike@example.com" }
        ],
        projects: [
          { _id: "1", name: "Web App Redesign" },
          { _id: "2", name: "Backend API" },
          { _id: "3", name: "Product Launch" }
        ],
        departments: ["Engineering", "Design", "Marketing"]
      };

      res.json(filterOptions);
    } catch (error) {
      console.error("Get report filters error:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });

  // Export reports
  app.get("/api/reports/export", async (req, res) => {
    try {
      const { format } = req.query;

      if (format === 'csv') {
        const csvData = `User Name,Email,Department,Total Tasks,Completed Tasks,In Progress Tasks,Overdue Tasks,Progress Percentage,Hours Logged
"John Doe","john@example.com","Engineering",15,12,2,1,"80%","45h"
"Jane Smith","jane@example.com","Design",12,9,2,1,"75%","38h"
"Mike Johnson","mike@example.com","Marketing",10,7,2,1,"70%","32h"`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="user-reports.csv"');
        res.send(csvData);
      } else if (format === 'pdf') {
        res.status(501).json({ message: "PDF export functionality is not yet implemented" });
      } else {
        res.status(400).json({ message: "Invalid format specified" });
      }
    } catch (error) {
      console.error("Export reports error:", error);
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  // Super Admin API Routes
  
  // Get platform analytics
  app.get("/api/super-admin/analytics", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const analytics = await storage.getPlatformAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Get platform analytics error:", error);
      res.status(500).json({ message: "Failed to fetch platform analytics" });
    }
  });

  // Get all companies
  app.get("/api/super-admin/companies", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Get companies error:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Get company details
  app.get("/api/super-admin/companies/:id", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const company = await storage.getCompanyDetails(id);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Get company details error:", error);
      res.status(500).json({ message: "Failed to fetch company details" });
    }
  });

  // Update company status
  app.patch("/api/super-admin/companies/:id/status", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const company = await storage.updateCompanyStatus(id, isActive);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      console.error("Update company status error:", error);
      res.status(500).json({ message: "Failed to update company status" });
    }
  });

  // Get all users across companies
  app.get("/api/super-admin/users", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsersAcrossCompanies();
      res.json(users);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Assign company admin
  app.post("/api/super-admin/assign-admin", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { companyId, userId } = req.body;
      
      if (!companyId || !userId) {
        return res.status(400).json({ message: "Company ID and User ID are required" });
      }
      
      const user = await storage.assignCompanyAdmin(companyId, userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Admin assigned successfully", user });
    } catch (error) {
      console.error("Assign admin error:", error);
      res.status(500).json({ message: "Failed to assign admin" });
    }
  });

  // Get system logs
  app.get("/api/super-admin/logs", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { limit = 100 } = req.query;
      const logs = await storage.getSystemLogs(parseInt(limit));
      res.json(logs);
    } catch (error) {
      console.error("Get system logs error:", error);
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });

  // Create super admin user
  app.post("/api/super-admin/create-super-admin", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { email, firstName, lastName, password } = req.body;
      
      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const superAdmin = await storage.createSuperAdmin({
        email,
        firstName,
        lastName,
        password
      });
      
      res.status(201).json({ 
        message: "Super admin created successfully", 
        user: { 
          id: superAdmin._id, 
          email: superAdmin.email, 
          firstName: superAdmin.firstName, 
          lastName: superAdmin.lastName 
        } 
      });
    } catch (error) {
      console.error("Create super admin error:", error);
      res.status(500).json({ message: "Failed to create super admin" });
    }
  });

  // Company Admin User Management API Routes

  // Get organization license information
  app.get("/api/organization/license", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const licenseInfo = await storage.getOrganizationLicenseInfo(req.user.organizationId);
      res.json(licenseInfo);
    } catch (error) {
      console.error("Get license info error:", error);
      res.status(500).json({ message: "Failed to fetch license information" });
    }
  });

  // Get organization users with detailed information
  app.get("/api/organization/users-detailed", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getOrganizationUsersDetailed(req.user.organizationId);
      res.json(users);
    } catch (error) {
      console.error("Get organization users error:", error);
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  // Invite user to organization
  app.post("/api/organization/invite-user", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { email, roles } = req.body;
      
      if (!email || !roles || !Array.isArray(roles)) {
        return res.status(400).json({ message: "Email and roles are required" });
      }

      // Check license limit
      const licenseInfo = await storage.getOrganizationLicenseInfo(req.user.organizationId);
      if (licenseInfo.available <= 0) {
        return res.status(400).json({ message: "License limit reached. Cannot invite more users." });
      }

      // Create invitation
      const invitedUser = await storage.inviteUserToOrganization({
        email,
        organizationId: req.user.organizationId,
        roles,
        invitedBy: req.user.id
      });

      // Get organization and inviter details
      const organization = await storage.getOrganization(req.user.organizationId);
      const inviter = await storage.getUser(req.user.id);
      const inviterName = `${inviter.firstName} ${inviter.lastName}`;

      // Send invitation email
      await storage.sendInvitationEmail(
        email,
        invitedUser.inviteToken,
        organization.name,
        roles,
        inviterName
      );

      res.status(201).json({ 
        message: "User invitation sent successfully",
        user: {
          id: invitedUser._id,
          email: invitedUser.email,
          role: invitedUser.role,
          status: "invited"
        }
      });
    } catch (error) {
      console.error("Invite user error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Accept user invitation
  app.get("/api/auth/invitation/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const invitedUser = await storage.getInvitedUser(token);
      if (!invitedUser) {
        return res.status(404).json({ message: "Invalid or expired invitation" });
      }

      const organization = await storage.getOrganization(invitedUser.organizationId);
      
      res.json({
        message: "Invitation found",
        invitation: {
          email: invitedUser.email,
          role: invitedUser.role,
          organizationName: organization.name,
          valid: true
        }
      });
    } catch (error) {
      console.error("Get invitation error:", error);
      res.status(500).json({ message: "Failed to retrieve invitation" });
    }
  });

  // Complete user invitation
  app.post("/api/auth/complete-invitation", async (req, res) => {
    try {
      const { token, firstName, lastName, password } = req.body;
      
      if (!token || !firstName || !lastName || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const user = await storage.completeUserInvitation(token, { firstName, lastName, password });
      
      // Generate auth token
      const authToken = storage.generateToken(user);

      res.json({
        message: "Account setup completed successfully",
        token: authToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId
        }
      });
    } catch (error) {
      console.error("Complete invitation error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Deactivate user (admin only)
  app.patch("/api/organization/users/:userId/deactivate", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent self-deactivation
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot deactivate your own account" });
      }

      const user = await storage.updateUser(userId, { isActive: false });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Deactivate user error:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Reactivate user (admin only)
  app.patch("/api/organization/users/:userId/activate", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.updateUser(userId, { isActive: true });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User activated successfully" });
    } catch (error) {
      console.error("Activate user error:", error);
      res.status(500).json({ message: "Failed to activate user" });
    }
  });

  // Update user role (admin only)
  app.patch("/api/organization/users/:userId/role", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role || !['admin', 'member'].includes(role)) {
        return res.status(400).json({ message: "Valid role is required (admin or member)" });
      }

      // Prevent changing own role
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      const user = await storage.updateUser(userId, { role });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "User role updated successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Role-based Dashboard API Routes
  
  // Super Admin Dashboard Routes
  app.get("/api/superadmin/platform-stats", roleAuthToken, roleRequireSuperAdmin, async (req, res) => {
    try {
      const stats = await storage.getPlatformAnalytics();
      res.json(stats);
    } catch (error) {
      console.error("Get platform stats error:", error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
    }
  });

  app.get("/api/superadmin/organizations", roleAuthToken, roleRequireSuperAdmin, async (req, res) => {
    try {
      const organizations = await storage.getAllCompanies();
      res.json(organizations);
    } catch (error) {
      console.error("Get organizations error:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get("/api/superadmin/system-logs", roleAuthToken, roleRequireSuperAdmin, async (req, res) => {
    try {
      const logs = await storage.getSystemLogs(100);
      res.json(logs);
    } catch (error) {
      console.error("Get system logs error:", error);
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });

  // Admin Dashboard Routes
  app.get("/api/admin/organization-stats", roleAuthToken, requireAdminOrAbove, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.organizationId);
      res.json(stats);
    } catch (error) {
      console.error("Get organization stats error:", error);
      res.status(500).json({ message: "Failed to fetch organization statistics" });
    }
  });

  app.get("/api/admin/users", roleAuthToken, requireAdminOrAbove, async (req, res) => {
    try {
      const users = await storage.getOrganizationUsersDetailed(req.user.organizationId);
      res.json(users);
    } catch (error) {
      console.error("Get organization users error:", error);
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  app.get("/api/admin/projects", roleAuthToken, requireAdminOrAbove, async (req, res) => {
    try {
      const projects = await storage.getProjects({ organizationId: req.user.organizationId });
      res.json(projects);
    } catch (error) {
      console.error("Get organization projects error:", error);
      res.status(500).json({ message: "Failed to fetch organization projects" });
    }
  });

  app.get("/api/admin/tasks", roleAuthToken, requireAdminOrAbove, async (req, res) => {
    try {
      const tasks = await storage.getTasks({ organizationId: req.user.organizationId });
      res.json(tasks);
    } catch (error) {
      console.error("Get organization tasks error:", error);
      res.status(500).json({ message: "Failed to fetch organization tasks" });
    }
  });

  // Admin user invitation
  app.post("/api/admin/invite-user", roleAuthToken, requireAdminOrAbove, async (req, res) => {
    try {
      const { email, role = 'employee' } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const organization = await storage.getOrganization(req.user.organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const inviteData = {
        email,
        role,
        organizationId: req.user.organizationId,
        organizationName: organization.name,
        invitedBy: req.user.id
      };

      const result = await storage.inviteUserToOrganization(inviteData);
      res.json(result);
    } catch (error) {
      console.error("Invite user error:", error);
      res.status(500).json({ message: error.message || "Failed to send invitation" });
    }
  });

  // Employee Dashboard Routes
  app.get("/api/employee/my-tasks", roleAuthToken, requireEmployee, async (req, res) => {
    try {
      const tasks = await storage.getTasks({ 
        assignedTo: req.user.id,
        organizationId: req.user.organizationId 
      });
      res.json(tasks);
    } catch (error) {
      console.error("Get my tasks error:", error);
      res.status(500).json({ message: "Failed to fetch your tasks" });
    }
  });

  app.get("/api/employee/my-stats", roleAuthToken, requireEmployee, async (req, res) => {
    try {
      const tasks = await storage.getTasks({ 
        assignedTo: req.user.id,
        organizationId: req.user.organizationId 
      });
      
      const stats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
        newTasksThisWeek: tasks.filter(t => {
          const taskDate = new Date(t.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return taskDate > weekAgo;
        }).length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
        overdueTasks: tasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== 'completed';
        }).length
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Get my stats error:", error);
      res.status(500).json({ message: "Failed to fetch your statistics" });
    }
  });

  app.get("/api/employee/my-projects", roleAuthToken, requireEmployee, async (req, res) => {
    try {
      const tasks = await storage.getTasks({ 
        assignedTo: req.user.id,
        organizationId: req.user.organizationId 
      });
      
      const projectIds = [...new Set(tasks.map(t => t.project).filter(Boolean))];
      const projects = [];
      
      for (const projectId of projectIds) {
        const project = await storage.getProject(projectId);
        if (project) {
          const myTasksInProject = tasks.filter(t => t.project?.toString() === projectId.toString());
          projects.push({
            ...project,
            myTasksCount: myTasksInProject.length,
            progress: myTasksInProject.length > 0 ? 
              Math.round((myTasksInProject.filter(t => t.status === 'completed').length / myTasksInProject.length) * 100) : 0
          });
        }
      }
      
      res.json(projects);
    } catch (error) {
      console.error("Get my projects error:", error);
      res.status(500).json({ message: "Failed to fetch your projects" });
    }
  });

  app.get("/api/employee/notifications", roleAuthToken, requireEmployee, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Setup test routes (development only)
  if (process.env.NODE_ENV === 'development') {
    // await setupTestRoutes(app);
  }

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}