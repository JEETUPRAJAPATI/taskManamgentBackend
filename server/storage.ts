import { users, projects, tasks, activities, type User, type InsertUser, type Project, type InsertProject, type Task, type InsertTask, type Activity, type InsertActivity, type TaskWithDetails, type ProjectWithDetails, type DashboardStats } from "@shared/schema";

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
      createdAt: new Date() 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updateProject: Partial<InsertProject>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updateProject };
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

export const storage = new MemStorage();
