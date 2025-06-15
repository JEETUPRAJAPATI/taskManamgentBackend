import { createServer } from "http";
import cors from "cors";
import express from "express";
import path from "path";
import fs from "fs";
import { storage } from "./mongodb-storage.js";
import { authenticateToken, requireRole } from "./middleware/roleAuth.js";
import { authService } from "./services/authService.js";
import { uploadProfileImage, processProfileImage, deleteOldProfileImage } from "./middleware/upload.js";
import { emailService } from "./services/emailService.js";

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

  // Email verification endpoint
  app.post("/api/auth/verify-token", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      console.log("Email verification attempt with token:", token);

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      // Debug: Check if any user has this token
      const { User } = await import('./models.js');
      const userWithToken = await User.findOne({ emailVerificationToken: token });
      console.log("User with token found:", userWithToken ? {
        id: userWithToken._id,
        email: userWithToken.email,
        status: userWithToken.status,
        hasExpiration: !!userWithToken.emailVerificationExpires,
        expiration: userWithToken.emailVerificationExpires,
        isExpired: userWithToken.emailVerificationExpires ? new Date() > userWithToken.emailVerificationExpires : 'No expiration set'
      } : 'No user found with this token');

      // Find user by verification token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        return res.status(400).json({ message: "Verification token has expired" });
      }

      // Hash the password and update user
      const hashedPassword = await storage.hashPassword(password);
      
      await storage.updateUser(user._id, {
        passwordHash: hashedPassword,
        status: 'active',
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      });

      console.log("User verification successful:", user.email);

      // Get updated user object with new password
      const updatedUser = await storage.getUser(user._id);
      
      // Generate auth token for login
      const authToken = storage.generateToken(updatedUser);

      res.json({
        message: "Email verified and password set successfully",
        token: authToken,
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          organizationId: updatedUser.organizationId
        }
      });

    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Verification failed. Please try again." });
    }
  });

  // Individual registration
  app.post("/api/auth/register-individual", async (req, res) => {
    try {
      const { firstName, lastName, email } = req.body;
      
      console.log("Individual registration attempt:", { firstName, lastName, email });

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create pending user
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        role: 'member',
        status: 'pending',
        accountType: 'individual'
      };

      const user = await storage.createUser(userData);
      
      console.log("Individual user created:", user._id);

      // Generate verification token and send email
      const verificationToken = storage.generateEmailVerificationToken();
      
      // Update user with verification token
      await storage.updateUser(user._id, { 
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(
        email, 
        verificationToken, 
        firstName
      );

      if (emailSent) {
        console.log("Verification email sent successfully to:", email);
      } else {
        console.log("Failed to send verification email to:", email);
      }

      res.status(201).json({
        message: "Registration successful. Please check your email for verification.",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });

    } catch (error) {
      console.error("Individual registration error:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // Organization registration
  app.post("/api/auth/register-organization", async (req, res) => {
    try {
      const { firstName, lastName, email, organizationName, organizationSlug } = req.body;
      
      console.log("Organization registration attempt:", { firstName, lastName, email, organizationName, organizationSlug });

      // Validate required fields
      if (!firstName || !lastName || !email || !organizationName || !organizationSlug) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Check if organization slug is available
      const existingOrg = await storage.getOrganizationBySlug(organizationSlug);
      if (existingOrg) {
        return res.status(400).json({ message: "Organization name is already taken" });
      }

      // Create organization first
      const orgData = {
        name: organizationName.trim(),
        slug: organizationSlug.toLowerCase().trim(),
        licenseCount: 10,
        isActive: true
      };

      const organization = await storage.createOrganization(orgData);
      
      // Create admin user for the organization
      const userData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        role: 'admin',
        status: 'pending',
        organizationId: organization._id,
        accountType: 'organization'
      };

      const user = await storage.createUser(userData);
      
      console.log("Organization and admin user created:", { orgId: organization._id, userId: user._id });

      // Generate verification token and send email
      const verificationToken = storage.generateEmailVerificationToken();
      
      // Update user with verification token
      await storage.updateUser(user._id, { 
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      // Send verification email with organization name
      const emailSent = await emailService.sendVerificationEmail(
        email, 
        verificationToken, 
        firstName,
        organizationName
      );

      if (emailSent) {
        console.log("Verification email sent successfully to:", email);
      } else {
        console.log("Failed to send verification email to:", email);
      }

      res.status(201).json({
        message: "Organization registration successful. Please check your email for verification.",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          organizationId: organization._id,
          organizationName: organization.name
        }
      });

    } catch (error) {
      console.error("Organization registration error:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // Get team members for current user's organization
  app.get("/api/team-members", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      
      if (!user.organizationId) {
        return res.status(400).json({ message: "User not associated with any organization" });
      }

      // Get all users in the same organization
      const teamMembers = await storage.getOrganizationUsersDetailed(user.organizationId);
      
      // Format the response to include only necessary fields
      const formattedMembers = teamMembers.map(member => ({
        id: member._id,
        firstName: member.firstName,
        lastName: member.lastName,
        fullName: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
        email: member.email,
        role: member.role,
        status: member.status,
        profileImageUrl: member.profileImageUrl,
        isActive: member.isActive,
        emailVerified: member.emailVerified,
        lastLoginAt: member.lastLoginAt,
        createdAt: member.createdAt,
        invitedBy: member.invitedBy ? {
          id: member.invitedBy._id,
          name: `${member.invitedBy.firstName || ''} ${member.invitedBy.lastName || ''}`.trim()
        } : null,
        invitedAt: member.invitedAt
      }));

      res.json(formattedMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
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

  // Get individual user by ID (no auth required for internal use)
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return clean user data without sensitive fields
      const userProfile = {
        _id: user._id,
        id: user._id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profileImageUrl: user.profileImageUrl || null,
        role: user.role,
        organizationId: user.organizationId,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      res.json(userProfile);
    } catch (error) {
      console.error("Get user by ID error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile by ID
  app.put("/api/users/:id/profile", uploadProfileImage, processProfileImage, async (req, res) => {
    try {
      const userId = req.params.id;
      const { firstName, lastName } = req.body;
      
      console.log("Profile Update - User ID:", userId);
      console.log("Profile Update - Request data:", {
        firstName,
        lastName,
        hasFile: !!req.file
      });

      // Validate required fields
      if (!firstName || !firstName.trim()) {
        return res.status(400).json({ message: "First name is required" });
      }
      if (!lastName || !lastName.trim()) {
        return res.status(400).json({ message: "Last name is required" });
      }
      
      // Build update object
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      };

      // Handle profile image upload
      if (req.file) {
        const currentUser = await storage.getUser(userId);
        
        // Delete old profile image if exists
        if (currentUser?.profileImageUrl) {
          deleteOldProfileImage(currentUser.profileImageUrl);
        }
        
        // Set new profile image path
        updateData.profileImageUrl = `/uploads/profile-pics/${req.file.filename}`;
      }

      console.log("Profile Update - Update data:", updateData);

      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return clean user profile data
      const userProfile = {
        _id: updatedUser._id,
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        role: updatedUser.role,
        organizationId: updatedUser.organizationId,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt
      };

      console.log("Profile Update - Success:", userProfile);
      res.json({
        message: "Profile updated successfully",
        user: userProfile
      });
    } catch (error) {
      console.error("Update user profile error:", error);
      
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

  // Get current user profile
  app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
      console.log("Profile API called - User ID:", req.user.id);
      const user = await storage.getUser(req.user.id);
      if (!user) {
        console.log("Profile API - User not found for ID:", req.user.id);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("Profile API - Raw user data:", user);
      
      // Remove sensitive data and return clean profile
      const userProfile = {
        _id: user._id,
        id: user._id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profileImageUrl: user.profileImageUrl || null,
        role: user.role,
        organizationId: user.organizationId || user.organization,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      console.log("Profile API - Sending response:", userProfile);
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
      const { firstName, lastName } = req.body;
      
      console.log("Profile Update - Request data:", {
        userId,
        firstName,
        lastName,
        hasFile: !!req.file
      });

      // Validate required fields
      if (!firstName || !firstName.trim()) {
        return res.status(400).json({ message: "First name is required" });
      }
      if (!lastName || !lastName.trim()) {
        return res.status(400).json({ message: "Last name is required" });
      }
      
      // Build update object with only allowed fields
      const updateData = {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      };

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

      // Return clean user profile data
      const userProfile = {
        _id: updatedUser._id,
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        role: updatedUser.role,
        organizationId: updatedUser.organizationId || updatedUser.organization,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };

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