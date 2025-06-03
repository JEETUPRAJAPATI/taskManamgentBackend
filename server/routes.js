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
}