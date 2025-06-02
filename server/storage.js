import { users, projects, tasks, activities, type User, type InsertUser, type Project, type InsertProject, type Task, type InsertTask, type Activity, type InsertActivity, type TaskWithDetails, type ProjectWithDetails, type DashboardStats } from "@shared/schema";
import { MongoClient, Db, Collection } from 'mongodb';

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(): Promise<User[]>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  getProjects(): Promise<ProjectWithDetails[]>;
  getProjectsByUser(userId: number): Promise<Project[]>;

  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasks(): Promise<TaskWithDetails[]>;
  getTasksByProject(projectId: number): Promise<TaskWithDetails[]>;
  getTasksByUser(userId: number): Promise<TaskWithDetails[]>;

  // Activities
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(limit?: number): Promise<Activity[]>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private activities: Map<number, Activity>;
  private currentUserId: number;
  private currentProjectId: number;
  private currentTaskId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentTaskId = 1;
    this.currentActivityId = 1;

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample users
    const sampleUsers: User[] = [
      {
        id: 1,
        username: "admin",
        email: "admin@taskflow.com",
        fullName: "John Smith",
        role: "admin",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        username: "sarah.johnson",
        email: "sarah@taskflow.com",
        fullName: "Sarah Johnson",
        role: "user",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        username: "mike.chen",
        email: "mike@taskflow.com",
        fullName: "Mike Chen",
        role: "user",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
        isActive: true,
        createdAt: new Date(),
      },
    ];

    sampleUsers.forEach(user => {
      this.users.set(user.id, user);
      this.currentUserId = Math.max(this.currentUserId, user.id + 1);
    });

    // Create sample projects
    const sampleProjects: Project[] = [
      {
        id: 1,
        name: "E-commerce Platform",
        description: "Building a modern e-commerce platform with React and Node.js",
        status: "active",
        progress: 75,
        ownerId: 1,
        teamMembers: [1, 2, 3],
        dueDate: new Date("2024-01-30"),
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Mobile App Redesign",
        description: "Redesigning the mobile app interface for better user experience",
        status: "active",
        progress: 45,
        ownerId: 2,
        teamMembers: [2, 3],
        dueDate: new Date("2024-02-15"),
        createdAt: new Date(),
      },
    ];

    sampleProjects.forEach(project => {
      this.projects.set(project.id, project);
      this.currentProjectId = Math.max(this.currentProjectId, project.id + 1);
    });

    // Create sample tasks
    const sampleTasks: Task[] = [
      {
        id: 1,
        title: "Implement user authentication system",
        description: "Build secure login and registration functionality with JWT tokens",
        status: "in-progress",
        priority: "high",
        assigneeId: 2,
        projectId: 1,
        dueDate: new Date("2024-01-15"),
        completedAt: null,
        createdAt: new Date(),
      },
      {
        id: 2,
        title: "Database schema optimization",
        description: "Optimize database queries and improve indexing for better performance",
        status: "completed",
        priority: "medium",
        assigneeId: 3,
        projectId: 1,
        dueDate: new Date("2024-01-12"),
        completedAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: 3,
        title: "Mobile app UI redesign",
        description: "Create new design system and wireframes for mobile application",
        status: "todo",
        priority: "medium",
        assigneeId: 2,
        projectId: 2,
        dueDate: new Date("2024-01-20"),
        completedAt: null,
        createdAt: new Date(),
      },
    ];

    sampleTasks.forEach(task => {
      this.tasks.set(task.id, task);
      this.currentTaskId = Math.max(this.currentTaskId, task.id + 1);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "user",
      avatar: insertUser.avatar || null,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { 
      ...insertProject, 
      id, 
      status: insertProject.status || "active",
      progress: insertProject.progress || 0,
      description: insertProject.description || null,
      ownerId: insertProject.ownerId || null,
      teamMembers: Array.isArray(insertProject.teamMembers) ? insertProject.teamMembers : null,
      dueDate: insertProject.dueDate || null,
      createdAt: new Date() 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updateProject: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = { 
      ...project, 
      ...updateProject,
      teamMembers: Array.isArray(updateProject.teamMembers) ? updateProject.teamMembers : project.teamMembers
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  async getProjects(): Promise<ProjectWithDetails[]> {
    const projects = Array.from(this.projects.values());
    const projectsWithDetails: ProjectWithDetails[] = [];

    for (const project of projects) {
      const owner = project.ownerId ? await this.getUser(project.ownerId) : undefined;
      const projectTasks = Array.from(this.tasks.values()).filter(task => task.projectId === project.id);
      const completedTasks = projectTasks.filter(task => task.status === "completed");

      projectsWithDetails.push({
        ...project,
        owner,
        taskCount: projectTasks.length,
        completedTasks: completedTasks.length,
      });
    }

    return projectsWithDetails;
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.ownerId === userId || project.teamMembers?.includes(userId)
    );
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      status: insertTask.status || "todo",
      priority: insertTask.priority || "medium",
      description: insertTask.description || null,
      assigneeId: insertTask.assigneeId || null,
      projectId: insertTask.projectId || null,
      dueDate: insertTask.dueDate || null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updateTask: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      ...updateTask,
      completedAt: updateTask.status === "completed" ? new Date() : task.completedAt,
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasks(): Promise<TaskWithDetails[]> {
    const tasks = Array.from(this.tasks.values());
    const tasksWithDetails: TaskWithDetails[] = [];

    for (const task of tasks) {
      const assignee = task.assigneeId ? await this.getUser(task.assigneeId) : undefined;
      const project = task.projectId ? await this.getProject(task.projectId) : undefined;

      tasksWithDetails.push({
        ...task,
        assignee,
        project,
      });
    }

    return tasksWithDetails;
  }

  async getTasksByProject(projectId: number): Promise<TaskWithDetails[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.projectId === projectId);
  }

  async getTasksByUser(userId: number): Promise<TaskWithDetails[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.assigneeId === userId);
  }

  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      userId: insertActivity.userId || null,
      entityType: insertActivity.entityType || null,
      entityId: insertActivity.entityId || null,
      createdAt: new Date() 
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    const activities = Array.from(this.activities.values());
    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Dashboard methods
  async getDashboardStats(): Promise<DashboardStats> {
    const allTasks = Array.from(this.tasks.values());
    const allUsers = Array.from(this.users.values());
    const allProjects = Array.from(this.projects.values());

    return {
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(task => task.status === "completed").length,
      inProgressTasks: allTasks.filter(task => task.status === "in-progress").length,
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(user => user.isActive).length,
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter(project => project.status === "active").length,
    };
  }
}

// MongoDB Storage Implementation
export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private users: Collection<User>;
  private projects: Collection<Project>;
  private tasks: Collection<Task>;
  private activities: Collection<Activity>;
  private currentUserId: number = 1;
  private currentProjectId: number = 1;
  private currentTaskId: number = 1;
  private currentActivityId: number = 1;

  constructor(mongoUri: string, dbName: string = 'Tasksetu') {
    this.client = new MongoClient(mongoUri);
    this.db = this.client.db(dbName);
    this.users = this.db.collection<User>('users');
    this.projects = this.db.collection<Project>('projects');
    this.tasks = this.db.collection<Task>('tasks');
    this.activities = this.db.collection<Activity>('activities');
  }

  async connect(): Promise<void> {
    await this.client.connect();
    console.log('Connected to MongoDB');
    await this.initializeSampleData();
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  private async initializeSampleData(): Promise<void> {
    // Check if data already exists
    const userCount = await this.users.countDocuments();
    if (userCount > 0) return;

    // Create sample users
    const sampleUsers: User[] = [
      {
        id: 1,
        username: "admin",
        email: "admin@taskflow.com",
        role: "admin",
        name: "John Smith",
        createdAt: new Date(),
      },
      {
        id: 2,
        username: "manager",
        email: "manager@taskflow.com",
        role: "manager",
        name: "Sarah Wilson",
        createdAt: new Date(),
      },
      {
        id: 3,
        username: "developer",
        email: "developer@taskflow.com",
        role: "user",
        name: "Mike Johnson",
        createdAt: new Date(),
      },
    ];

    // Create sample projects
    const sampleProjects: Project[] = [
      {
        id: 1,
        name: "E-commerce Platform",
        description: "Building a modern e-commerce platform with React and Node.js",
        status: "active",
        progress: 75,
        ownerId: 1,
        teamMembers: [1, 2, 3],
        dueDate: new Date("2024-01-30"),
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Mobile App Redesign",
        description: "Redesigning the mobile app interface for better user experience",
        status: "active",
        progress: 45,
        ownerId: 2,
        teamMembers: [2, 3],
        dueDate: new Date("2024-02-15"),
        createdAt: new Date(),
      },
    ];

    // Create sample tasks
    const sampleTasks: Task[] = [
      {
        id: 1,
        title: "Implement user authentication system",
        description: "Build secure login and registration functionality with JWT tokens",
        status: "in-progress",
        priority: "high",
        assigneeId: 2,
        projectId: 1,
        dueDate: new Date("2024-01-15"),
        createdAt: new Date(),
        completedAt: null,
      },
      {
        id: 2,
        title: "Design product catalog page",
        description: "Create wireframes and mockups for the product listing interface",
        status: "completed",
        priority: "medium",
        assigneeId: 3,
        projectId: 1,
        dueDate: new Date("2024-01-10"),
        createdAt: new Date(),
        completedAt: new Date(),
      },
      {
        id: 3,
        title: "Setup CI/CD pipeline",
        description: "Configure automated testing and deployment workflows",
        status: "todo",
        priority: "high",
        assigneeId: 1,
        projectId: 1,
        dueDate: new Date("2024-01-20"),
        createdAt: new Date(),
        completedAt: null,
      },
    ];

    await this.users.insertMany(sampleUsers);
    await this.projects.insertMany(sampleProjects);
    await this.tasks.insertMany(sampleTasks);

    this.currentUserId = 4;
    this.currentProjectId = 3;
    this.currentTaskId = 4;
    this.currentActivityId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = await this.users.findOne({ id });
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.users.findOne({ username });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.users.findOne({ email });
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "user",
      createdAt: new Date() 
    };
    await this.users.insertOne(user);
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.users.findOneAndUpdate(
      { id },
      { $set: updateUser },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.users.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getUsers(): Promise<User[]> {
    return await this.users.find({}).toArray();
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const project = await this.projects.findOne({ id });
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { 
      ...insertProject, 
      id, 
      status: insertProject.status || "active",
      progress: insertProject.progress || 0,
      description: insertProject.description || null,
      ownerId: insertProject.ownerId || null,
      teamMembers: Array.isArray(insertProject.teamMembers) ? insertProject.teamMembers : null,
      dueDate: insertProject.dueDate || null,
      createdAt: new Date() 
    };
    await this.projects.insertOne(project);
    return project;
  }

  async updateProject(id: number, updateProject: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await this.projects.findOneAndUpdate(
      { id },
      { $set: updateProject },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await this.projects.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getProjects(): Promise<ProjectWithDetails[]> {
    const allProjects = await this.projects.find({}).toArray();
    const allUsers = await this.users.find({}).toArray();
    const allTasks = await this.tasks.find({}).toArray();

    return allProjects.map(project => {
      const owner = allUsers.find(user => user.id === project.ownerId);
      const projectTasks = allTasks.filter(task => task.projectId === project.id);
      const completedTasks = projectTasks.filter(task => task.status === "completed");

      return {
        ...project,
        owner,
        taskCount: projectTasks.length,
        completedTasks: completedTasks.length,
      };
    });
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    return await this.projects.find({ ownerId: userId }).toArray();
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const task = await this.tasks.findOne({ id });
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      status: insertTask.status || "todo",
      priority: insertTask.priority || "medium",
      description: insertTask.description || null,
      assigneeId: insertTask.assigneeId || null,
      projectId: insertTask.projectId || null,
      dueDate: insertTask.dueDate || null,
      createdAt: new Date(),
      completedAt: null,
    };
    await this.tasks.insertOne(task);
    return task;
  }

  async updateTask(id: number, updateTask: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await this.tasks.findOneAndUpdate(
      { id },
      { $set: updateTask },
      { returnDocument: 'after' }
    );
    return result || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await this.tasks.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getTasks(): Promise<TaskWithDetails[]> {
    const allTasks = await this.tasks.find({}).toArray();
    const allUsers = await this.users.find({}).toArray();
    const allProjects = await this.projects.find({}).toArray();

    return allTasks.map(task => {
      const assignee = allUsers.find(user => user.id === task.assigneeId);
      const project = allProjects.find(proj => proj.id === task.projectId);

      return {
        ...task,
        assignee,
        project,
      };
    });
  }

  async getTasksByProject(projectId: number): Promise<TaskWithDetails[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.projectId === projectId);
  }

  async getTasksByUser(userId: number): Promise<TaskWithDetails[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.assigneeId === userId);
  }

  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      userId: insertActivity.userId || null,
      entityType: insertActivity.entityType || null,
      entityId: insertActivity.entityId || null,
      createdAt: new Date() 
    };
    await this.activities.insertOne(activity);
    return activity;
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await this.activities.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const totalTasks = await this.tasks.countDocuments();
    const completedTasks = await this.tasks.countDocuments({ status: "completed" });
    const inProgressTasks = await this.tasks.countDocuments({ status: "in-progress" });
    const totalUsers = await this.users.countDocuments();
    const activeUsers = await this.users.countDocuments({ role: { $ne: "inactive" } });
    const totalProjects = await this.projects.countDocuments();
    const activeProjects = await this.projects.countDocuments({ status: "active" });

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
    };
  }
}

// Initialize storage based on environment
const mongoUri = process.env.MONGODB_URI;
let storage: IStorage;

if (mongoUri) {
  console.log('Using MongoDB storage');
  storage = new MongoStorage(mongoUri);
  (storage as MongoStorage).connect().catch(console.error);
} else {
  console.log('Using in-memory storage');
  storage = new MemStorage();
}

export { storage };
