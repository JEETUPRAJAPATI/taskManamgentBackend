import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateToken } from "./auth";
import { Request } from "express";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Validation middleware
  const validateBody = (schema: z.ZodSchema) => {
    return (req: any, res: any, next: any) => {
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

  // Auth routes
  app.post("/api/auth/register", validateBody(registerSchema), async (req, res) => {
    try {
      const { email, password, firstName, lastName, organizationName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await storage.hashPassword(password);
      let organizationId;

      // Create organization if provided
      if (organizationName) {
        const slug = organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const organization = await storage.createOrganization({
          name: organizationName,
          slug,
        });
        organizationId = organization.id;
      }

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        organizationId,
        role: organizationId ? "admin" : "member",
        emailVerificationToken: storage.generateEmailVerificationToken(),
      });

      // Create default task statuses for new organization
      if (organizationId) {
        const defaultStatuses = [
          { name: "To Do", color: "#6B7280", order: 0, isDefault: true, organizationId },
          { name: "In Progress", color: "#3B82F6", order: 1, organizationId },
          { name: "Review", color: "#F59E0B", order: 2, organizationId },
          { name: "Done", color: "#10B981", order: 3, isCompleted: true, organizationId },
        ];

        for (const status of defaultStatuses) {
          await storage.createTaskStatus(status);
        }
      }

      const token = generateToken({
        id: user.id,
        email: user.email,
        organizationId: user.organizationId || undefined,
        role: user.role,
      });

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
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
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await storage.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is inactive" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      const token = generateToken({
        id: user.id,
        email: user.email,
        organizationId: user.organizationId || undefined,
        role: user.role,
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/forgot-password", validateBody(forgotPasswordSchema), async (req, res) => {
    try {
      const { email } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({ message: "If an account exists, a reset link has been sent" });
      }

      const resetToken = storage.generatePasswordResetToken();
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      // Here you would send an email with the reset link
      // For now, we'll just return the token (in production, never do this)
      
      res.json({ 
        message: "If an account exists, a reset link has been sent",
        // Remove this in production
        resetToken: resetToken
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", validateBody(resetPasswordSchema), async (req, res) => {
    try {
      const { token, password } = req.body;
      
      const users = await storage.getTasks({ organizationId: undefined });
      const user = users.find(u => u.metadata?.passwordResetToken === token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await storage.hashPassword(password);
      
      await storage.updateUser(user.id, {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Protected routes
  app.get("/api/auth/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        profileImageUrl: user.profileImageUrl,
        preferences: user.preferences,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user!.id, req.user!.organizationId);
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

  app.post("/api/tasks", validateBody(createTaskSchema), async (req, res) => {
    try {
      const taskData = {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };

      const task = await storage.createTask(taskData);
      
      // Create notification for assignee if different from creator
      if (task.assignedToId && task.assignedToId !== task.createdById) {
        await storage.createNotification({
          userId: task.assignedToId,
          type: "task_assigned",
          title: "New task assigned",
          message: `You have been assigned the task: ${task.title}`,
          data: { taskId: task.id },
        });
      }

      res.status(201).json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.post("/api/tasks/smart-create", authenticateToken, validateBody(smartTaskInputSchema), async (req: AuthenticatedRequest, res) => {
    try {
      const { input, projectId } = req.body;
      
      // Smart parsing logic
      const parsed = parseSmartTaskInput(input);
      
      const taskData = {
        title: parsed.title,
        description: parsed.description,
        projectId: projectId || parsed.projectId,
        priority: parsed.priority || "medium",
        dueDate: parsed.dueDate,
        tags: parsed.tags,
        organizationId: req.user!.organizationId,
        createdById: req.user!.id,
        metadata: { originalInput: input, parsedData: parsed },
      };

      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Smart create task error:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/tasks/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if user has access to this task
      if (task.organizationId !== req.user!.organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(task);
    } catch (error) {
      console.error("Get task error:", error);
      res.status(500).json({ message: "Failed to get task" });
    }
  });

  app.put("/api/tasks/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.organizationId !== req.user!.organizationId) {
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

  app.delete("/api/tasks/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.organizationId !== req.user!.organizationId) {
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
  app.get("/api/tasks/:id/comments", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.organizationId !== req.user!.organizationId) {
        return res.status(404).json({ message: "Task not found" });
      }

      const comments = await storage.getTaskComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Get task comments error:", error);
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  app.post("/api/tasks/:id/comments", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.organizationId !== req.user!.organizationId) {
        return res.status(404).json({ message: "Task not found" });
      }

      const commentData = {
        taskId: req.params.id,
        userId: req.user!.id,
        content: req.body.content,
        mentions: req.body.mentions || [],
      };

      const comment = await storage.createTaskComment(commentData);
      
      // Create notifications for mentions
      if (commentData.mentions?.length > 0) {
        for (const userId of commentData.mentions) {
          await storage.createNotification({
            userId,
            type: "mention",
            title: "You were mentioned",
            message: `You were mentioned in a comment on task: ${task.title}`,
            data: { taskId: task.id, commentId: comment.id },
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
  app.get("/api/notifications", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
      const notifications = await storage.getNotifications(req.user!.id, isRead);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/read-all", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // Organization/Admin routes
  app.get("/api/organization/users", authenticateToken, requireOrganization, requireRole(["admin", "super_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getOrganizationUsers(req.user!.organizationId!);
      res.json(users);
    } catch (error) {
      console.error("Get organization users error:", error);
      res.status(500).json({ message: "Failed to get organization users" });
    }
  });

  app.get("/api/organization/usage", authenticateToken, requireOrganization, requireRole(["admin", "super_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const usage = await storage.getUsageStats(req.user!.organizationId!, months);
      res.json(usage);
    } catch (error) {
      console.error("Get usage stats error:", error);
      res.status(500).json({ message: "Failed to get usage statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Smart task input parsing function
function parseSmartTaskInput(input: string) {
  const result: any = { tags: [] };
  
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

function parseDateString(dateStr: string): Date | undefined {
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