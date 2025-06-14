import { createServer } from "http";
import cors from "cors";
import express from "express";
import { storage } from "./mongodb-storage.js";
import { authenticateToken, requireRole } from "./middleware/roleAuth.js";

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
      const result = await storage.loginUser(email, password);
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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}