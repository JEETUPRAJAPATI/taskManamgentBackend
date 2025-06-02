// Simple JavaScript storage implementation
export class MemStorage {
  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentTaskId = 1;
    this.currentActivityId = 1;
    this.initializeSampleData();
  }

  initializeSampleData() {
    // Create sample users
    const sampleUsers = [
      {
        id: 1,
        username: "admin",
        email: "admin@taskflow.com",
        role: "admin",
        fullName: "John Smith",
        avatar: null,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        username: "manager",
        email: "manager@taskflow.com",
        role: "manager",
        fullName: "Sarah Wilson",
        avatar: null,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        username: "developer",
        email: "developer@taskflow.com",
        role: "user",
        fullName: "Mike Johnson",
        avatar: null,
        isActive: true,
        createdAt: new Date(),
      },
    ];

    // Create sample projects
    const sampleProjects = [
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
    const sampleTasks = [
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

    sampleUsers.forEach(user => {
      this.users.set(user.id, user);
      this.currentUserId = Math.max(this.currentUserId, user.id + 1);
    });

    sampleProjects.forEach(project => {
      this.projects.set(project.id, project);
      this.currentProjectId = Math.max(this.currentProjectId, project.id + 1);
    });

    sampleTasks.forEach(task => {
      this.tasks.set(task.id, task);
      this.currentTaskId = Math.max(this.currentTaskId, task.id + 1);
    });
  }

  // User methods
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { 
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

  async updateUser(id, updateUser) {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id) {
    return this.users.delete(id);
  }

  async getUsers() {
    return Array.from(this.users.values());
  }

  // Project methods
  async getProject(id) {
    return this.projects.get(id);
  }

  async createProject(insertProject) {
    const id = this.currentProjectId++;
    const project = { 
      ...insertProject, 
      id, 
      status: insertProject.status || "active",
      progress: insertProject.progress || 0,
      description: insertProject.description || null,
      ownerId: insertProject.ownerId || null,
      teamMembers: insertProject.teamMembers || null,
      dueDate: insertProject.dueDate || null,
      createdAt: new Date() 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id, updateProject) {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updateProject };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id) {
    return this.projects.delete(id);
  }

  async getProjects() {
    const allProjects = Array.from(this.projects.values());
    const allUsers = Array.from(this.users.values());
    const allTasks = Array.from(this.tasks.values());

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

  async getProjectsByUser(userId) {
    const allProjects = Array.from(this.projects.values());
    return allProjects.filter(project => project.ownerId === userId);
  }

  // Task methods
  async getTask(id) {
    return this.tasks.get(id);
  }

  async createTask(insertTask) {
    const id = this.currentTaskId++;
    const task = { 
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

  async updateTask(id, updateTask) {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, ...updateTask };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id) {
    return this.tasks.delete(id);
  }

  async getTasks() {
    const allTasks = Array.from(this.tasks.values());
    const allUsers = Array.from(this.users.values());
    const allProjects = Array.from(this.projects.values());

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

  async getTasksByProject(projectId) {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.projectId === projectId);
  }

  async getTasksByUser(userId) {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.assigneeId === userId);
  }

  // Activity methods
  async createActivity(insertActivity) {
    const id = this.currentActivityId++;
    const activity = { 
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

  async getRecentActivities(limit = 10) {
    const activities = Array.from(this.activities.values());
    return activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getDashboardStats() {
    const allTasks = Array.from(this.tasks.values());
    const allUsers = Array.from(this.users.values());
    const allProjects = Array.from(this.projects.values());

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.status === "completed").length;
    const inProgressTasks = allTasks.filter(task => task.status === "in-progress").length;
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(user => user.isActive).length;
    const totalProjects = allProjects.length;
    const activeProjects = allProjects.filter(project => project.status === "active").length;

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

export const storage = new MemStorage();