import { createServer } from "http";
import cors from "cors";
import express from "express";
import { storage } from "./mongodb-storage.js";
import { authenticateToken, requireRole } from "./middleware/roleAuth.js";
import { authService } from "./services/authService.js";

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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}