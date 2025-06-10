import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  monthlyPrice: integer("monthly_price").notNull(), // in cents
  yearlyPrice: integer("yearly_price").notNull(), // in cents
  features: jsonb("features").default([]),
  maxUsers: integer("max_users").default(10),
  maxProjects: integer("max_projects").default(5),
  maxStorage: integer("max_storage").default(1024), // in MB
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies table (Multi-tenant)
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  logo: varchar("logo", { length: 500 }),
  adminEmail: varchar("admin_email", { length: 255 }).notNull(),
  subscriptionPlanId: uuid("subscription_plan_id").references(() => subscriptionPlans.id),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active"), // active, suspended, cancelled
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  billingCycle: varchar("billing_cycle", { length: 20 }).default("monthly"), // monthly, yearly
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations table (kept for backward compatibility)
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  logo: varchar("logo", { length: 500 }),
  maxUsers: integer("max_users").default(10),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").default({}),
  companyId: uuid("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  subscriptionPlanId: uuid("subscription_plan_id").references(() => subscriptionPlans.id),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  paymentMethod: varchar("payment_method", { length: 50 }), // credit_card, bank_transfer, paypal
  transactionId: varchar("transaction_id", { length: 255 }), // external payment processor ID
  status: varchar("status", { length: 50 }).default("pending"), // pending, success, failed, refunded
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  roles: jsonb("roles").default(["member"]), // array of roles: member, manager, admin, super_admin
  status: varchar("status", { length: 50 }).default("pending"), // pending, invited, active, inactive, suspended
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  inviteToken: varchar("invite_token", { length: 255 }),
  inviteTokenExpiry: timestamp("invite_token_expiry"),
  invitedBy: uuid("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  lastLoginAt: timestamp("last_login_at"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  companyId: uuid("company_id").references(() => companies.id),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("active"), // active, completed, paused, cancelled
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  companyId: uuid("company_id").references(() => companies.id),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Statuses table
export const taskStatuses = pgTable("task_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#gray"), // hex color
  position: integer("position").default(0),
  isDefault: boolean("is_default").default(false),
  organizationId: uuid("organization_id").references(() => organizations.id),
  companyId: uuid("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  statusId: uuid("status_id").references(() => taskStatuses.id),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  projectId: uuid("project_id").references(() => projects.id),
  assigneeId: uuid("assignee_id").references(() => users.id),
  createdById: uuid("created_by_id").references(() => users.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  companyId: uuid("company_id").references(() => companies.id),
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Comments table
export const taskComments = pgTable("task_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  parentId: uuid("parent_id").references(() => taskComments.id), // for nested comments
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Assignments table
export const taskAssignments = pgTable("task_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  assignedById: uuid("assigned_by_id").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  removedAt: timestamp("removed_at"),
});

// Task Audit Logs table
export const taskAuditLogs = pgTable("task_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // created, updated, assigned, completed, etc.
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  changes: jsonb("changes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // task_assigned, task_updated, project_created, etc.
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // task, project, user
  relatedEntityId: uuid("related_entity_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Dashboard Views table
export const userDashboardViews = pgTable("user_dashboard_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  viewName: varchar("view_name", { length: 100 }).notNull(),
  viewConfig: jsonb("view_config").notNull(), // stores dashboard layout, filters, etc.
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage Tracking table
export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  activeUsers: integer("active_users").default(0),
  tasksCreated: integer("tasks_created").default(0),
  projectsCreated: integer("projects_created").default(0),
  storageUsed: integer("storage_used").default(0), // in MB
  apiCalls: integer("api_calls").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.companyId, table.month] })
]);

// Zod validation schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);
export const insertCompanySchema = createInsertSchema(companies);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertOrganizationSchema = createInsertSchema(organizations);
export const insertUserSchema = createInsertSchema(users);
export const insertProjectSchema = createInsertSchema(projects);
export const insertTaskStatusSchema = createInsertSchema(taskStatuses);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertTaskCommentSchema = createInsertSchema(taskComments);
export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments);
export const insertTaskAuditLogSchema = createInsertSchema(taskAuditLogs);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertUserDashboardViewSchema = createInsertSchema(userDashboardViews);
export const insertUsageTrackingSchema = createInsertSchema(usageTracking);

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  organizationName: z.string().min(1, "Organization name is required"),
});

export const companyRegistrationSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  adminFirstName: z.string().min(1, "First name is required"),
  adminLastName: z.string().min(1, "Last name is required"),
  subscriptionPlanId: z.string().uuid("Invalid subscription plan"),
});

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  monthlyPrice: z.number().min(0, "Price must be positive"),
  yearlyPrice: z.number().min(0, "Price must be positive"),
  features: z.array(z.string()),
  maxUsers: z.number().min(1, "Must allow at least 1 user"),
  maxProjects: z.number().min(1, "Must allow at least 1 project"),
  maxStorage: z.number().min(100, "Must provide at least 100MB storage"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
});

export const smartTaskInputSchema = z.object({
  input: z.string().min(1, "Task input is required"),
  context: z.object({
    projectId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
  }).optional(),
});

export const inviteUsersSchema = z.object({
  users: z.array(z.object({
    email: z.string().email("Invalid email address"),
    roles: z.array(z.string()).min(1, "At least one role is required").default(["member"]),
  })).min(1, "At least one user is required"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});