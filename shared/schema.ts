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

// Organizations table
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  logo: varchar("logo", { length: 500 }),
  maxUsers: integer("max_users").default(10),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").default({}),
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
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  role: varchar("role", { length: 50 }).default("member"), // member, admin, super_admin
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  ownerId: uuid("owner_id").references(() => users.id),
  status: varchar("status", { length: 50 }).default("active"), // active, archived, completed
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  isPrivate: boolean("is_private").default(false),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task statuses table (configurable per organization)
export const taskStatuses = pgTable("task_statuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 7 }).default("#6B7280"),
  order: integer("order").default(0),
  isDefault: boolean("is_default").default(false),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  organizationId: uuid("organization_id").references(() => organizations.id),
  projectId: uuid("project_id").references(() => projects.id),
  createdById: uuid("created_by_id").references(() => users.id).notNull(),
  assignedToId: uuid("assigned_to_id").references(() => users.id),
  statusId: uuid("status_id").references(() => taskStatuses.id),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  tags: jsonb("tags").default([]),
  metadata: jsonb("metadata").default({}), // For parsed data from smart input
  isRecurring: boolean("is_recurring").default(false),
  recurringConfig: jsonb("recurring_config"),
  parentTaskId: uuid("parent_task_id").references(() => tasks.id),
  order: integer("order").default(0),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task comments/threads table
export const taskComments = pgTable("task_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  mentions: jsonb("mentions").default([]), // Array of user IDs mentioned
  attachments: jsonb("attachments").default([]),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task assignments table (for multiple assignees)
export const taskAssignments = pgTable("task_assignments", {
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  assignedById: uuid("assigned_by_id").references(() => users.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.taskId, table.userId] }),
}));

// Task audit trail
export const taskAuditLogs = pgTable("task_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // created, updated, assigned, completed, etc.
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // task_assigned, task_completed, mention, etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  data: jsonb("data").default({}), // Additional data for the notification
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  sentViaEmail: boolean("sent_via_email").default(false),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User activities/dashboard views
export const userDashboardViews = pgTable("user_dashboard_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // due_today, overdue, upcoming, created_by_me, etc.
  filters: jsonb("filters").default({}),
  isDefault: boolean("is_default").default(false),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization usage tracking
export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  activeUsers: integer("active_users").default(0),
  tasksCreated: integer("tasks_created").default(0),
  tasksCompleted: integer("tasks_completed").default(0),
  commentsPosted: integer("comments_posted").default(0),
  storageUsed: integer("storage_used").default(0), // in bytes
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_usage_org_month").on(table.organizationId, table.month),
]);

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type UpsertOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type UpsertProject = typeof projects.$inferInsert;
export type TaskStatus = typeof taskStatuses.$inferSelect;
export type UpsertTaskStatus = typeof taskStatuses.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type UpsertTask = typeof tasks.$inferInsert;
export type TaskComment = typeof taskComments.$inferSelect;
export type UpsertTaskComment = typeof taskComments.$inferInsert;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type UpsertTaskAssignment = typeof taskAssignments.$inferInsert;
export type TaskAuditLog = typeof taskAuditLogs.$inferSelect;
export type UpsertTaskAuditLog = typeof taskAuditLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type UpsertNotification = typeof notifications.$inferInsert;
export type UserDashboardView = typeof userDashboardViews.$inferSelect;
export type UpsertUserDashboardView = typeof userDashboardViews.$inferInsert;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type UpsertUsageTracking = typeof usageTracking.$inferInsert;

// Insert schemas for validation
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

// Additional validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  organizationName: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
});

export const smartTaskInputSchema = z.object({
  input: z.string().min(1),
  projectId: z.string().uuid().optional(),
});