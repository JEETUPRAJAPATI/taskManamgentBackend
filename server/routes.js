import express from "express";
import { createServer } from "http";
import { MongoStorage } from "./mongodb-storage.js";
import { authenticateToken, requireRole, requireOrganization } from "./auth.js";
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

  // Auth routes
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
  app.get("/api/tasks", authenticateToken, async (req, res) => {
    try {
      const filters = {
        organizationId: req.user.organizationId,
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
}