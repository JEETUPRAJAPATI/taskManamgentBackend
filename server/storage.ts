import {
  users,
  organizations,
  projects,
  tasks,
  taskStatuses,
  taskComments,
  taskAssignments,
  taskAuditLogs,
  notifications,
  userDashboardViews,
  usageTracking,
  type User,
  type UpsertUser,
  type Organization,
  type UpsertOrganization,
  type Project,
  type UpsertProject,
  type Task,
  type UpsertTask,
  type TaskStatus,
  type UpsertTaskStatus,
  type TaskComment,
  type UpsertTaskComment,
  type TaskAssignment,
  type UpsertTaskAssignment,
  type TaskAuditLog,
  type UpsertTaskAuditLog,
  type Notification,
  type UpsertNotification,
  type UserDashboardView,
  type UpsertUserDashboardView,
  type UsageTracking,
  type UpsertUsageTracking,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, gte, lte, like, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Authentication operations
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  
  // Organization operations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: UpsertOrganization): Promise<Organization>;
  updateOrganization(id: string, org: Partial<UpsertOrganization>): Promise<Organization>;
  getOrganizationUsers(orgId: string): Promise<User[]>;
  
  // Project operations
  getProjects(filters?: { organizationId?: string; ownerId?: string }): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: UpsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<UpsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Task status operations
  getTaskStatuses(organizationId: string): Promise<TaskStatus[]>;
  createTaskStatus(status: UpsertTaskStatus): Promise<TaskStatus>;
  updateTaskStatus(id: string, status: Partial<UpsertTaskStatus>): Promise<TaskStatus>;
  deleteTaskStatus(id: string): Promise<void>;
  
  // Task operations
  getTasks(filters?: {
    organizationId?: string;
    projectId?: string;
    assignedToId?: string;
    createdById?: string;
    statusId?: string;
    priority?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    isCompleted?: boolean;
    search?: string;
  }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: UpsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<UpsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // Task comments operations
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  createTaskComment(comment: UpsertTaskComment): Promise<TaskComment>;
  updateTaskComment(id: string, comment: Partial<UpsertTaskComment>): Promise<TaskComment>;
  deleteTaskComment(id: string): Promise<void>;
  
  // Task assignments operations
  getTaskAssignments(taskId: string): Promise<TaskAssignment[]>;
  assignTask(assignment: UpsertTaskAssignment): Promise<TaskAssignment>;
  unassignTask(taskId: string, userId: string): Promise<void>;
  
  // Audit log operations
  createAuditLog(log: UpsertTaskAuditLog): Promise<TaskAuditLog>;
  getTaskAuditLogs(taskId: string): Promise<TaskAuditLog[]>;
  
  // Notification operations
  getNotifications(userId: string, isRead?: boolean): Promise<Notification[]>;
  createNotification(notification: UpsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  // Dashboard operations
  getDashboardStats(userId: string, organizationId?: string): Promise<{
    dueToday: number;
    overdue: number;
    upcoming: number;
    createdByMe: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  
  // Usage tracking operations
  trackUsage(tracking: UpsertUsageTracking): Promise<UsageTracking>;
  getUsageStats(organizationId: string, months?: number): Promise<UsageTracking[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Authentication operations
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Organization operations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org || undefined;
  }

  async createOrganization(orgData: UpsertOrganization): Promise<Organization> {
    const [org] = await db
      .insert(organizations)
      .values(orgData)
      .returning();
    return org;
  }

  async updateOrganization(id: string, orgData: Partial<UpsertOrganization>): Promise<Organization> {
    const [org] = await db
      .update(organizations)
      .set({ ...orgData, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }

  async getOrganizationUsers(orgId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.organizationId, orgId))
      .orderBy(asc(users.firstName), asc(users.lastName));
  }

  // Project operations
  async getProjects(filters: { organizationId?: string; ownerId?: string } = {}): Promise<Project[]> {
    let query = db.select().from(projects);
    
    const conditions = [];
    if (filters.organizationId) {
      conditions.push(eq(projects.organizationId, filters.organizationId));
    }
    if (filters.ownerId) {
      conditions.push(eq(projects.ownerId, filters.ownerId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(projectData: UpsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return project;
  }

  async updateProject(id: string, projectData: Partial<UpsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Task status operations
  async getTaskStatuses(organizationId: string): Promise<TaskStatus[]> {
    return await db
      .select()
      .from(taskStatuses)
      .where(eq(taskStatuses.organizationId, organizationId))
      .orderBy(asc(taskStatuses.order));
  }

  async createTaskStatus(statusData: UpsertTaskStatus): Promise<TaskStatus> {
    const [status] = await db
      .insert(taskStatuses)
      .values(statusData)
      .returning();
    return status;
  }

  async updateTaskStatus(id: string, statusData: Partial<UpsertTaskStatus>): Promise<TaskStatus> {
    const [status] = await db
      .update(taskStatuses)
      .set(statusData)
      .where(eq(taskStatuses.id, id))
      .returning();
    return status;
  }

  async deleteTaskStatus(id: string): Promise<void> {
    await db.delete(taskStatuses).where(eq(taskStatuses.id, id));
  }

  // Task operations
  async getTasks(filters: {
    organizationId?: string;
    projectId?: string;
    assignedToId?: string;
    createdById?: string;
    statusId?: string;
    priority?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    isCompleted?: boolean;
    search?: string;
  } = {}): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    const conditions = [];
    
    if (filters.organizationId) {
      conditions.push(eq(tasks.organizationId, filters.organizationId));
    }
    if (filters.projectId) {
      conditions.push(eq(tasks.projectId, filters.projectId));
    }
    if (filters.assignedToId) {
      conditions.push(eq(tasks.assignedToId, filters.assignedToId));
    }
    if (filters.createdById) {
      conditions.push(eq(tasks.createdById, filters.createdById));
    }
    if (filters.statusId) {
      conditions.push(eq(tasks.statusId, filters.statusId));
    }
    if (filters.priority) {
      conditions.push(eq(tasks.priority, filters.priority));
    }
    if (filters.dueDateFrom) {
      conditions.push(gte(tasks.dueDate, filters.dueDateFrom));
    }
    if (filters.dueDateTo) {
      conditions.push(lte(tasks.dueDate, filters.dueDateTo));
    }
    if (filters.isCompleted !== undefined) {
      if (filters.isCompleted) {
        conditions.push(eq(tasks.completedAt, null));
      } else {
        conditions.push(eq(tasks.completedAt, null));
      }
    }
    if (filters.search) {
      conditions.push(
        or(
          like(tasks.title, `%${filters.search}%`),
          like(tasks.description, `%${filters.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(taskData: UpsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    
    // Create audit log
    await this.createAuditLog({
      taskId: task.id,
      userId: task.createdById,
      action: 'created',
      newValues: task,
    });
    
    return task;
  }

  async updateTask(id: string, taskData: Partial<UpsertTask>): Promise<Task> {
    const oldTask = await this.getTask(id);
    const [task] = await db
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    
    // Create audit log
    await this.createAuditLog({
      taskId: id,
      userId: taskData.assignedToId || oldTask?.createdById || '',
      action: 'updated',
      oldValues: oldTask,
      newValues: taskData,
    });
    
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Task comments operations
  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt));
  }

  async createTaskComment(commentData: UpsertTaskComment): Promise<TaskComment> {
    const [comment] = await db
      .insert(taskComments)
      .values(commentData)
      .returning();
    return comment;
  }

  async updateTaskComment(id: string, commentData: Partial<UpsertTaskComment>): Promise<TaskComment> {
    const [comment] = await db
      .update(taskComments)
      .set({ ...commentData, isEdited: true, editedAt: new Date() })
      .where(eq(taskComments.id, id))
      .returning();
    return comment;
  }

  async deleteTaskComment(id: string): Promise<void> {
    await db.delete(taskComments).where(eq(taskComments.id, id));
  }

  // Task assignments operations
  async getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
    return await db
      .select()
      .from(taskAssignments)
      .where(eq(taskAssignments.taskId, taskId));
  }

  async assignTask(assignmentData: UpsertTaskAssignment): Promise<TaskAssignment> {
    const [assignment] = await db
      .insert(taskAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async unassignTask(taskId: string, userId: string): Promise<void> {
    await db
      .delete(taskAssignments)
      .where(and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.userId, userId)
      ));
  }

  // Audit log operations
  async createAuditLog(logData: UpsertTaskAuditLog): Promise<TaskAuditLog> {
    const [log] = await db
      .insert(taskAuditLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getTaskAuditLogs(taskId: string): Promise<TaskAuditLog[]> {
    return await db
      .select()
      .from(taskAuditLogs)
      .where(eq(taskAuditLogs.taskId, taskId))
      .orderBy(desc(taskAuditLogs.createdAt));
  }

  // Notification operations
  async getNotifications(userId: string, isRead?: boolean): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    
    if (isRead !== undefined) {
      query = query.where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, isRead)
      ));
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: UpsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.userId, userId));
  }

  // Dashboard operations
  async getDashboardStats(userId: string, organizationId?: string): Promise<{
    dueToday: number;
    overdue: number;
    upcoming: number;
    createdByMe: number;
    totalTasks: number;
    completedTasks: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const baseConditions = organizationId 
      ? [eq(tasks.organizationId, organizationId)]
      : [];
    
    const [
      dueToday,
      overdue,
      upcoming,
      createdByMe,
      totalTasks,
      completedTasks
    ] = await Promise.all([
      // Due today
      db.select({ count: tasks.id }).from(tasks)
        .where(and(
          ...baseConditions,
          or(eq(tasks.assignedToId, userId), eq(tasks.createdById, userId)),
          gte(tasks.dueDate, today),
          lte(tasks.dueDate, tomorrow),
          eq(tasks.completedAt, null)
        )),
      
      // Overdue
      db.select({ count: tasks.id }).from(tasks)
        .where(and(
          ...baseConditions,
          or(eq(tasks.assignedToId, userId), eq(tasks.createdById, userId)),
          lte(tasks.dueDate, today),
          eq(tasks.completedAt, null)
        )),
      
      // Upcoming (next 7 days)
      db.select({ count: tasks.id }).from(tasks)
        .where(and(
          ...baseConditions,
          or(eq(tasks.assignedToId, userId), eq(tasks.createdById, userId)),
          gte(tasks.dueDate, tomorrow),
          lte(tasks.dueDate, nextWeek),
          eq(tasks.completedAt, null)
        )),
      
      // Created by me
      db.select({ count: tasks.id }).from(tasks)
        .where(and(
          ...baseConditions,
          eq(tasks.createdById, userId),
          eq(tasks.completedAt, null)
        )),
      
      // Total tasks
      db.select({ count: tasks.id }).from(tasks)
        .where(and(
          ...baseConditions,
          or(eq(tasks.assignedToId, userId), eq(tasks.createdById, userId))
        )),
      
      // Completed tasks
      db.select({ count: tasks.id }).from(tasks)
        .where(and(
          ...baseConditions,
          or(eq(tasks.assignedToId, userId), eq(tasks.createdById, userId)),
          eq(tasks.completedAt, null)
        ))
    ]);
    
    return {
      dueToday: dueToday.length,
      overdue: overdue.length,
      upcoming: upcoming.length,
      createdByMe: createdByMe.length,
      totalTasks: totalTasks.length,
      completedTasks: completedTasks.length,
    };
  }

  // Usage tracking operations
  async trackUsage(trackingData: UpsertUsageTracking): Promise<UsageTracking> {
    const [tracking] = await db
      .insert(usageTracking)
      .values(trackingData)
      .onConflictDoUpdate({
        target: [usageTracking.organizationId, usageTracking.month],
        set: trackingData,
      })
      .returning();
    return tracking;
  }

  async getUsageStats(organizationId: string, months: number = 12): Promise<UsageTracking[]> {
    return await db
      .select()
      .from(usageTracking)
      .where(eq(usageTracking.organizationId, organizationId))
      .orderBy(desc(usageTracking.month))
      .limit(months);
  }
}

export const storage = new DatabaseStorage();