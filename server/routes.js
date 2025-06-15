import { createServer } from "http";
import cors from "cors";
import express from "express";
import path from "path";
import fs from "fs";
import { storage } from "./mongodb-storage.js";
import { authenticateToken, requireRole } from "./middleware/roleAuth.js";
import { authService } from "./services/authService.js";
import { uploadProfileImage, processProfileImage, deleteOldProfileImage } from "./middleware/upload.js";

export async function registerRoutes(app) {
  // Configure CORS
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Serve static files for uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: error.message });
    }
  });

  app.get("/api/auth/verify", authenticateToken, async (req, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Auth verify error:", error);
      res.status(401).json({ message: "Invalid token" });
    }
  });

  // User routes
  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get current user profile
  app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove sensitive data
      const { passwordHash, passwordResetToken, emailVerificationToken, ...userProfile } = user.toObject();
      res.json(userProfile);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update user profile
  app.put("/api/profile", authenticateToken, uploadProfileImage, processProfileImage, async (req, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, phone, bio, address } = req.body;
      
      // Build update object with only allowed fields
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;
      if (address !== undefined) updateData.address = address;

      // Handle profile image upload
      if (req.file) {
        const currentUser = await storage.getUser(userId);
        
        // Delete old profile image if exists
        if (currentUser.profileImageUrl) {
          deleteOldProfileImage(currentUser.profileImageUrl);
        }
        
        // Set new profile image path
        updateData.profileImageUrl = `/uploads/profile-pics/${req.file.filename}`;
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive data
      const { passwordHash, passwordResetToken, emailVerificationToken, ...userProfile } = updatedUser.toObject();
      res.json({
        message: "Profile updated successfully",
        user: userProfile
      });
    } catch (error) {
      console.error("Update profile error:", error);
      
      // Delete uploaded file on error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting uploaded file:", unlinkError);
        }
      }
      
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Organization routes
  app.get("/api/organization/users", authenticateToken, async (req, res) => {
    try {
      const users = await storage.getOrganizationUsers(req.user.organizationId);
      res.json(users);
    } catch (error) {
      console.error("Get organization users error:", error);
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  app.get("/api/organization/users-detailed", authenticateToken, async (req, res) => {
    try {
      const users = await storage.getOrganizationUsersDetailed(req.user.organizationId);
      res.json(users);
    } catch (error) {
      console.error("Get organization users detailed error:", error);
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  app.get("/api/organization/license", authenticateToken, async (req, res) => {
    try {
      const licenseInfo = await storage.getOrganizationLicenseInfo(req.user.organizationId);
      res.json(licenseInfo);
    } catch (error) {
      console.error("Get organization license error:", error);
      res.status(500).json({ message: "Failed to fetch license information" });
    }
  });

  app.post("/api/organization/invite-users-test", async (req, res) => {
    try {
      const { invites } = req.body;

      if (!invites || !Array.isArray(invites) || invites.length === 0) {
        return res.status(400).json({ message: "Invalid invitation data" });
      }

      const results = {
        successCount: 0,
        errors: [],
        details: []
      };

      // Get the first organization for testing (temporary fix)
      const organizations = await storage.getAllCompanies();
      const defaultOrgId = organizations.length > 0 ? organizations[0]._id : null;
      
      if (!defaultOrgId) {
        return res.status(400).json({ message: "No organization found for invitations" });
      }

      for (const invite of invites) {
        try {
          const inviteData = {
            email: invite.email,
            organizationId: defaultOrgId,
            roles: invite.roles,
            invitedBy: defaultOrgId, // Use org ID as placeholder
            invitedByName: "TaskSetu Admin",
            organizationName: "TaskSetu Organization"
          };

          await storage.inviteUserToOrganization(inviteData);
          results.successCount++;
          results.details.push({ email: invite.email, status: "success" });
        } catch (error) {
          console.error("Invitation error for", invite.email, ":", error.message);
          results.errors.push({ email: invite.email, error: error.message });
          results.details.push({ email: invite.email, status: "error", error: error.message });
        }
      }

      const statusCode = results.successCount > 0 ? 200 : 400;
      const message = results.successCount === invites.length
        ? "All invitations sent successfully"
        : results.successCount > 0
        ? "Some invitations sent successfully"
        : "Failed to send invitations";

      res.status(statusCode).json({
        message,
        ...results
      });
    } catch (error) {
      console.error("Invite users error:", error);
      res.status(500).json({ message: "Failed to process invitations" });
    }
  });

  // Check if email has already been invited (temporarily without auth for testing)
  app.post("/api/organization/check-invitation", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      console.log("Checking invitation for email:", email);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      console.log("Existing user found:", existingUser ? "Yes" : "No");
      
      if (existingUser) {
        console.log("User is already a member of an organization");
        return res.json({ 
          exists: true, 
          type: "existing_user",
          message: "This email is already a member of an organization"
        });
      }

      // Check if invitation already sent
      const existingInvite = await storage.getPendingUserByEmail(email);
      console.log("Existing invite found:", existingInvite ? "Yes" : "No");
      
      if (existingInvite) {
        console.log("Invitation already sent to this email");
        return res.json({ 
          exists: true, 
          type: "pending_invitation",
          message: "This email has already received an invitation. Try another email."
        });
      }

      console.log("Email is available for invitation");
      res.json({ exists: false });
    } catch (error) {
      console.error("Check invitation error:", error);
      res.status(500).json({ message: "Failed to check invitation status", error: error.message });
    }
  });

  // Validate invitation token
  app.get("/api/auth/validate-invite", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ message: "Invitation token is required" });
      }

      // Get invitation details by token
      const pendingUser = await storage.getUserByInviteToken(token);
      
      if (!pendingUser) {
        return res.status(404).json({ message: "Invalid or expired invitation token" });
      }

      // Check if token is expired
      if (pendingUser.inviteExpires && new Date() > new Date(pendingUser.inviteExpires)) {
        return res.status(400).json({ message: "Invitation token has expired" });
      }

      // Get organization details
      const organization = await storage.getOrganization(pendingUser.organizationId);
      
      res.json({
        email: pendingUser.email,
        roles: pendingUser.roles,
        organization: {
          name: organization?.name || "Unknown Organization",
          id: organization?._id || pendingUser.organizationId
        },
        invitedBy: pendingUser.invitedBy
      });
    } catch (error) {
      console.error("Validate invite error:", error);
      res.status(500).json({ message: "Failed to validate invitation" });
    }
  });

  // Accept invitation and complete registration
  app.post("/api/auth/accept-invite", async (req, res) => {
    try {
      const { token, firstName, lastName, password } = req.body;
      
      if (!token || !firstName || !lastName || !password) {
        return res.status(400).json({ 
          message: "Token, first name, last name, and password are required" 
        });
      }

      // Complete the invitation
      const result = await storage.completeUserInvitation(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password
      });

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      // Generate auth token for the new user
      const authToken = storage.generateToken(result.user);
      
      res.json({
        message: "Account created successfully",
        token: authToken,
        user: {
          id: result.user._id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          organizationId: result.user.organizationId
        }
      });
    } catch (error) {
      console.error("Accept invite error:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Alternative endpoint for validate-invite-token (used by auth/AcceptInvite.jsx)
  app.post("/api/auth/validate-invite-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Invitation token is required" });
      }

      const pendingUser = await storage.getUserByInviteToken(token);
      
      if (!pendingUser) {
        return res.status(404).json({ message: "Invalid or expired invitation token" });
      }

      if (pendingUser.inviteExpires && new Date() > new Date(pendingUser.inviteExpires)) {
        return res.status(400).json({ message: "Invitation token has expired" });
      }

      const organization = await storage.getOrganization(pendingUser.organizationId);
      
      res.json({
        email: pendingUser.email,
        roles: pendingUser.roles,
        organization: {
          name: organization?.name || "Unknown Organization",
          id: organization?._id || pendingUser.organizationId
        },
        invitedBy: pendingUser.invitedBy
      });
    } catch (error) {
      console.error("Validate invite token error:", error);
      res.status(500).json({ message: "Failed to validate invitation token" });
    }
  });

  // Alternative endpoint for complete-invitation (used by auth/AcceptInvitation.jsx)
  app.post("/api/auth/complete-invitation", async (req, res) => {
    try {
      const { token, firstName, lastName, password } = req.body;
      
      if (!token || !firstName || !lastName || !password) {
        return res.status(400).json({ 
          message: "Token, first name, last name, and password are required" 
        });
      }

      const result = await storage.completeUserInvitation(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password
      });

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      const authToken = storage.generateToken(result.user);
      
      res.json({
        message: "Account created successfully",
        token: authToken,
        user: {
          id: result.user._id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          organizationId: result.user.organizationId
        }
      });
    } catch (error) {
      console.error("Complete invitation error:", error);
      res.status(500).json({ message: "Failed to complete invitation" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}