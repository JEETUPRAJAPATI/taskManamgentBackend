import { createServer } from "http";
import cors from "cors";
import express from "express";
import path from "path";
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

  // Update user profile with optional image upload
  app.put("/api/profile", authenticateToken, uploadProfileImage, processProfileImage, async (req, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, phone, bio } = req.body;
      
      // Get current user to check for existing image
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prepare update data
      const updateData = {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        email: email?.trim().toLowerCase(),
        phone: phone?.trim(),
        bio: bio?.trim()
      };

      // Remove empty/undefined fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      // Handle profile image update
      if (req.processedFile) {
        // Delete old image if it exists
        if (currentUser.profileImageUrl) {
          await deleteOldProfileImage(currentUser.profileImageUrl);
        }
        updateData.profileImageUrl = req.processedFile.url;
      }

      // Check for email uniqueness if email is being changed
      if (updateData.email && updateData.email !== currentUser.email) {
        const existingUser = await storage.getUserByEmail(updateData.email);
        if (existingUser && existingUser._id.toString() !== userId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Update user profile
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Remove sensitive data from response
      const { passwordHash, passwordResetToken, emailVerificationToken, ...userProfile } = updatedUser.toObject();
      
      res.json({
        message: "Profile updated successfully",
        user: userProfile
      });
    } catch (error) {
      console.error("Update profile error:", error);
      
      // Delete uploaded file if update failed
      if (req.processedFile) {
        try {
          await deleteOldProfileImage(req.processedFile.url);
        } catch (deleteError) {
          console.error("Error deleting uploaded file after failed update:", deleteError);
        }
      }
      
      if (error.code === 11000) {
        return res.status(400).json({ message: "Email already exists" });
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

  app.post("/api/organization/invite-users", authenticateToken, requireRole(['admin', 'org_admin']), async (req, res) => {
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

      for (const invite of invites) {
        try {
          const inviteData = {
            email: invite.email,
            organizationId: req.user.organizationId,
            roles: invite.roles,
            invitedBy: req.user.id,
            invitedByName: `${req.user.firstName} ${req.user.lastName}`,
            organizationName: req.user.organizationName || "Your Organization"
          };

          await storage.inviteUserToOrganization(inviteData);
          results.successCount++;
          results.details.push({ email: invite.email, status: "success" });
        } catch (error) {
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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}