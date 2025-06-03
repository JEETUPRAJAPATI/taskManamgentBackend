import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Task routes (no authentication for development)
  app.get("/api/tasks", async (req, res) => {
    try {
      const filters = {
        projectId: req.query.projectId as string,
        assignedToId: req.query.assignedToId as string,
        createdById: req.query.createdById as string,
        statusId: req.query.statusId as string,
        priority: req.query.priority as string,
        search: req.query.search as string,
        dueDateFrom: req.query.dueDateFrom ? new Date(req.query.dueDateFrom as string) : undefined,
        dueDateTo: req.query.dueDateTo ? new Date(req.query.dueDateTo as string) : undefined,
      };

      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Get tasks error:", error);
      res.status(500).json({ message: "Failed to get tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };

      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Get task error:", error);
      res.status(500).json({ message: "Failed to get task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };

      const task = await storage.updateTask(req.params.id, updateData);
      res.json(task);
    } catch (error) {
      console.error("Update task error:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Delete task error:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  // Task status routes
  app.get("/api/task-statuses", async (req, res) => {
    try {
      const statuses = await storage.getTaskStatuses("default-org");
      res.json(statuses);
    } catch (error) {
      console.error("Get task statuses error:", error);
      res.status(500).json({ message: "Failed to get task statuses" });
    }
  });

  // Comments routes for collaboration features
  app.get("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const comments = await storage.getTaskComments(req.params.taskId);
      res.json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const commentData = {
        ...req.body,
        taskId: req.params.taskId,
      };

      const comment = await storage.createTaskComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Activity feed for collaboration
  app.get("/api/activities", async (req, res) => {
    try {
      // Return mock activities for now since this is a new feature
      const activities = [
        {
          _id: "1",
          type: "task_created",
          user: { firstName: "Demo", lastName: "User" },
          task: { title: "Sample Task" },
          createdAt: new Date().toISOString(),
          details: {}
        }
      ];
      res.json(activities);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // Team members for collaboration
  app.get("/api/team-members", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const teamMembers = users.map(user => ({
        _id: user.id || user._id,
        user: user,
        role: "member",
        status: "online",
        lastActive: new Date().toISOString()
      }));
      res.json(teamMembers);
    } catch (error) {
      console.error("Get team members error:", error);
      res.status(500).json({ message: "Failed to get team members" });
    }
  });

  // Collaboration stats
  app.get("/api/collaboration-stats", async (req, res) => {
    try {
      const stats = {
        totalMembers: 5,
        totalComments: 12,
        recentActivities: 8,
        avgResponseTime: "2h"
      };
      res.json(stats);
    } catch (error) {
      console.error("Get collaboration stats error:", error);
      res.status(500).json({ message: "Failed to get collaboration stats" });
    }
  });

  // Mentions for collaboration
  app.get("/api/mentions", async (req, res) => {
    try {
      // Return empty array for now
      res.json([]);
    } catch (error) {
      console.error("Get mentions error:", error);
      res.status(500).json({ message: "Failed to get mentions" });
    }
  });

  app.post("/api/mentions", async (req, res) => {
    try {
      // Create mention notification
      const mention = {
        _id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      res.json(mention);
    } catch (error) {
      console.error("Create mention error:", error);
      res.status(500).json({ message: "Failed to create mention" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats("demo-user");
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}