import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { 
  Organization, 
  User, 
  Project, 
  TaskStatus, 
  Task, 
  TaskComment, 
  TaskAssignment, 
  TaskAuditLog, 
  Notification, 
  UsageTracking 
} from './models.js';

export class MongoStorage {
  
  // Token generation methods
  generateToken(user) {
    const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
    return jwt.sign({
      id: user.id || user._id,
      email: user.email,
      organizationId: user.organization ? user.organization.toString() : undefined,
      role: user.role
    }, JWT_SECRET, { expiresIn: "7d" });
  }

  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Organization operations
  async createOrganization(orgData) {
    const organization = new Organization(orgData);
    return await organization.save();
  }

  async getOrganization(id) {
    return await Organization.findById(id);
  }

  async getOrganizationBySlug(slug) {
    return await Organization.findOne({ slug });
  }

  async updateOrganization(id, orgData) {
    return await Organization.findByIdAndUpdate(id, orgData, { new: true });
  }

  async getOrganizationUsers(orgId) {
    return await User.find({ organization: orgId })
      .select('-passwordHash')
      .sort({ firstName: 1, lastName: 1 });
  }
  // User operations
  async getUsers() {
    return await User.find().sort({ createdAt: -1 });
  }

  async getUser(id) {
    return await User.findById(id);
  }

  async getUserByEmail(email) {
    return await User.findOne({ email });
  }

  async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async updateUser(id, userData) {
    return await User.findByIdAndUpdate(id, userData, { new: true });
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }

  // Project operations
  async getProjects() {
    return await Project.find().sort({ createdAt: -1 });
  }

  async getProject(id) {
    return await Project.findById(id);
  }

  async createProject(projectData) {
    const project = new Project(projectData);
    return await project.save();
  }

  async updateProject(id, projectData) {
    return await Project.findByIdAndUpdate(id, projectData, { new: true });
  }

  async deleteProject(id) {
    return await Project.findByIdAndDelete(id);
  }

  // Task operations
  async getTasks(filters = {}) {
    let query = {};
    
    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }
    
    if (filters.priority && filters.priority !== 'all') {
      query.priority = filters.priority;
    }
    
    if (filters.assignee && filters.assignee !== 'all') {
      query.assigneeName = filters.assignee;
    }
    
    if (filters.project && filters.project !== 'all') {
      query.projectName = filters.project;
    }

    return await Task.find(query).sort({ createdAt: -1 });
  }

  async getTask(id) {
    return await Task.findById(id);
  }

  async createTask(taskData) {
    const task = new Task(taskData);
    const savedTask = await task.save();
    
    // Create activity log
    await this.createActivity({
      type: 'task_created',
      description: `Task "${taskData.title}" was created`,
      relatedId: savedTask._id,
      relatedType: 'task'
    });
    
    return savedTask;
  }

  async updateTask(id, taskData) {
    const task = await Task.findByIdAndUpdate(id, taskData, { new: true });
    
    // Create activity log
    await this.createActivity({
      type: 'task_updated',
      description: `Task "${task.title}" was updated`,
      relatedId: task._id,
      relatedType: 'task'
    });
    
    return task;
  }

  async deleteTask(id) {
    const task = await Task.findById(id);
    if (task) {
      await this.createActivity({
        type: 'task_deleted',
        description: `Task "${task.title}" was deleted`,
        relatedId: id,
        relatedType: 'task'
      });
    }
    return await Task.findByIdAndDelete(id);
  }

  // Activity operations
  async createActivity(activityData) {
    const activity = new Activity(activityData);
    return await activity.save();
  }

  async getRecentActivities(limit = 10) {
    return await Activity.find()
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // Dashboard stats
  async getDashboardStats() {
    const [totalTasks, completedTasks, totalUsers, totalProjects] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: 'Completed' }),
      User.countDocuments(),
      Project.countDocuments()
    ]);

    const pendingTasks = totalTasks - completedTasks;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      totalUsers,
      totalProjects
    };
  }

  // Initialize sample data
  async initializeSampleData() {
    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Sample data already exists, skipping initialization.');
      return;
    }

    console.log('Initializing sample data...');

    // Create sample users
    const users = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Admin',
        status: 'Active'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        role: 'Manager',
        status: 'Active'
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        role: 'Developer',
        status: 'Active'
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        role: 'Designer',
        status: 'Active'
      }
    ]);

    // Create sample projects
    const projects = await Project.insertMany([
      {
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with modern design and improved UX',
        status: 'In Progress',
        priority: 'High',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-07-15'),
        progress: 65,
        teamMembers: 4,
        budget: 50000
      },
      {
        name: 'Mobile App Development',
        description: 'Native iOS and Android app for customer engagement',
        status: 'Planning',
        priority: 'Medium',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-10-30'),
        progress: 15,
        teamMembers: 6,
        budget: 80000
      },
      {
        name: 'API Integration',
        description: 'Integration with third-party services and internal systems',
        status: 'Completed',
        priority: 'High',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-05-15'),
        progress: 100,
        teamMembers: 3,
        budget: 30000
      }
    ]);

    // Create sample tasks
    await Task.insertMany([
      {
        title: 'Homepage Design',
        description: 'Design the new homepage layout with modern UI elements',
        status: 'In Progress',
        priority: 'High',
        assigneeName: 'John Doe',
        projectName: 'Website Redesign',
        dueDate: new Date('2024-06-15')
      },
      {
        title: 'API Documentation',
        description: 'Write comprehensive API documentation for developers',
        status: 'Todo',
        priority: 'Medium',
        assigneeName: 'Sarah Wilson',
        projectName: 'API Integration',
        dueDate: new Date('2024-06-20')
      },
      {
        title: 'Database Migration',
        description: 'Migrate legacy database to new infrastructure',
        status: 'Completed',
        priority: 'High',
        assigneeName: 'Mike Johnson',
        projectName: 'API Integration',
        dueDate: new Date('2024-06-10')
      },
      {
        title: 'Mobile UI Mockups',
        description: 'Create UI mockups for the mobile application',
        status: 'Todo',
        priority: 'Medium',
        assigneeName: 'Emily Davis',
        projectName: 'Mobile App Development',
        dueDate: new Date('2024-06-25')
      }
    ]);

    // Create sample activities
    await Activity.insertMany([
      {
        type: 'task_completed',
        description: 'Task "Database Migration" completed by Mike Johnson'
      },
      {
        type: 'project_created',
        description: 'New project "Mobile App Development" created'
      },
      {
        type: 'task_assigned',
        description: 'Task "API Documentation" assigned to Sarah Wilson'
      }
    ]);

    console.log('Sample data initialized successfully!');
  }
}

export const storage = new MongoStorage();