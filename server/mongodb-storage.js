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
  UsageTracking,
  Form,
  ProcessFlow,
  FormResponse,
  ProcessInstance
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

  // Form operations
  async getForms(organizationId) {
    return await Form.find({ organization: organizationId })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  async getForm(id) {
    return await Form.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('organization', 'name slug');
  }

  async getFormByAccessLink(accessLink) {
    return await Form.findOne({ accessLink, isPublished: true })
      .populate('organization', 'name slug');
  }

  async createForm(formData) {
    // Generate unique access link
    const accessLink = `form-${crypto.randomBytes(8).toString('hex')}`;
    
    const form = new Form({
      ...formData,
      accessLink
    });
    return await form.save();
  }

  async updateForm(id, formData) {
    return await Form.findByIdAndUpdate(id, formData, { new: true });
  }

  async deleteForm(id) {
    return await Form.findByIdAndDelete(id);
  }

  async publishForm(id) {
    return await Form.findByIdAndUpdate(
      id, 
      { isPublished: true }, 
      { new: true }
    );
  }

  async unpublishForm(id) {
    return await Form.findByIdAndUpdate(
      id, 
      { isPublished: false }, 
      { new: true }
    );
  }

  // Process Flow operations
  async getProcessFlows(organizationId) {
    return await ProcessFlow.find({ organization: organizationId })
      .populate('createdBy', 'firstName lastName email')
      .populate('form', 'title')
      .sort({ createdAt: -1 });
  }

  async getProcessFlow(id) {
    return await ProcessFlow.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('form', 'title fields')
      .populate('steps.assignedTo', 'firstName lastName email');
  }

  async createProcessFlow(flowData) {
    const processFlow = new ProcessFlow(flowData);
    return await processFlow.save();
  }

  async updateProcessFlow(id, flowData) {
    return await ProcessFlow.findByIdAndUpdate(id, flowData, { new: true });
  }

  async deleteProcessFlow(id) {
    return await ProcessFlow.findByIdAndDelete(id);
  }

  // Form Response operations
  async getFormResponses(filters = {}) {
    let query = {};
    
    if (filters.formId) {
      query.form = filters.formId;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.organizationId) {
      const forms = await Form.find({ organization: filters.organizationId }).select('_id');
      const formIds = forms.map(f => f._id);
      query.form = { $in: formIds };
    }

    return await FormResponse.find(query)
      .populate('form', 'title')
      .populate('submittedBy', 'firstName lastName email')
      .populate('processFlow', 'title')
      .sort({ createdAt: -1 });
  }

  async getFormResponse(id) {
    return await FormResponse.findById(id)
      .populate('form', 'title fields')
      .populate('submittedBy', 'firstName lastName email')
      .populate('processFlow', 'title steps')
      .populate('stepHistory.assignedTo', 'firstName lastName email')
      .populate('stepHistory.completedBy', 'firstName lastName email');
  }

  async createFormResponse(responseData) {
    const response = new FormResponse(responseData);
    const savedResponse = await response.save();
    
    // If there's a process flow, create process instance
    if (responseData.processFlow) {
      await this.createProcessInstance({
        processFlow: responseData.processFlow,
        formResponse: savedResponse._id,
        currentSteps: ['start']
      });
    }
    
    return savedResponse;
  }

  async updateFormResponse(id, responseData) {
    return await FormResponse.findByIdAndUpdate(id, responseData, { new: true });
  }

  async updateResponseStep(responseId, stepData) {
    const response = await FormResponse.findById(responseId);
    if (!response) return null;

    response.stepHistory.push({
      stepId: stepData.stepId,
      stepTitle: stepData.stepTitle,
      status: stepData.status,
      assignedTo: stepData.assignedTo,
      completedBy: stepData.completedBy,
      comments: stepData.comments,
      completedAt: stepData.status === 'completed' ? new Date() : undefined
    });

    response.currentStep = stepData.nextStep || null;
    
    if (stepData.status === 'completed' && !stepData.nextStep) {
      response.status = 'completed';
    } else if (stepData.status === 'rejected') {
      response.status = 'rejected';
    } else {
      response.status = 'in_progress';
    }

    return await response.save();
  }

  // Process Instance operations
  async getProcessInstance(responseId) {
    return await ProcessInstance.findOne({ formResponse: responseId })
      .populate('processFlow')
      .populate('formResponse');
  }

  async createProcessInstance(instanceData) {
    const instance = new ProcessInstance(instanceData);
    return await instance.save();
  }

  async updateProcessInstance(id, instanceData) {
    return await ProcessInstance.findByIdAndUpdate(id, instanceData, { new: true });
  }

  // Analytics for forms and processes
  async getFormAnalytics(formId, organizationId) {
    const matchStage = formId ? 
      { form: formId } : 
      { form: { $in: await this.getFormIdsByOrganization(organizationId) } };

    const analytics = await FormResponse.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          completedSubmissions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressSubmissions: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          rejectedSubmissions: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    return analytics[0] || {
      totalSubmissions: 0,
      completedSubmissions: 0,
      inProgressSubmissions: 0,
      rejectedSubmissions: 0
    };
  }

  async getFormIdsByOrganization(organizationId) {
    const forms = await Form.find({ organization: organizationId }).select('_id');
    return forms.map(f => f._id);
  }

  // Role Management Operations
  async getRoles(organizationId) {
    try {
      const roles = await User.distinct('role', { organization: organizationId });
      
      // Return predefined roles with metadata
      const predefinedRoles = [
        {
          _id: 'admin',
          name: 'Administrator',
          description: 'Full system access with all permissions',
          permissions: [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
            'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'organizations.view', 'organizations.edit',
            'reports.view', 'reports.create'
          ],
          organizationId,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: 'member',
          name: 'Member',
          description: 'Standard user with basic permissions',
          permissions: [
            'tasks.view', 'tasks.create', 'tasks.edit',
            'projects.view',
            'users.view'
          ],
          organizationId,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: 'viewer',
          name: 'Viewer',
          description: 'Read-only access to tasks and projects',
          permissions: [
            'tasks.view',
            'projects.view',
            'users.view'
          ],
          organizationId,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      return predefinedRoles;
    } catch (error) {
      console.error('Get roles error:', error);
      throw error;
    }
  }

  async getRole(roleId) {
    try {
      // Handle predefined system roles
      const predefinedRoles = {
        'admin': {
          _id: 'admin',
          name: 'Administrator',
          description: 'Full system access with all permissions',
          permissions: [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
            'projects.view', 'projects.create', 'projects.edit', 'projects.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'organizations.view', 'organizations.edit',
            'reports.view', 'reports.create'
          ],
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'member': {
          _id: 'member',
          name: 'Member',
          description: 'Standard user with basic permissions',
          permissions: [
            'tasks.view', 'tasks.create', 'tasks.edit',
            'projects.view',
            'users.view'
          ],
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'viewer': {
          _id: 'viewer',
          name: 'Viewer',
          description: 'Read-only access to tasks and projects',
          permissions: [
            'tasks.view',
            'projects.view',
            'users.view'
          ],
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      return predefinedRoles[roleId] || null;
    } catch (error) {
      console.error('Get role error:', error);
      throw error;
    }
  }

  async getRoleByName(name, organizationId) {
    try {
      // Check predefined roles
      const predefinedRoles = ['admin', 'member', 'viewer'];
      if (predefinedRoles.includes(name.toLowerCase())) {
        return await this.getRole(name.toLowerCase());
      }
      return null;
    } catch (error) {
      console.error('Get role by name error:', error);
      throw error;
    }
  }

  async createRole(roleData) {
    try {
      // For now, return a success response since we're using predefined roles
      // In a full implementation, this would create custom roles in the database
      throw new Error('Creating custom roles is not yet implemented. Please use predefined roles: admin, member, viewer');
    } catch (error) {
      console.error('Create role error:', error);
      throw error;
    }
  }

  async updateRole(roleId, updateData) {
    try {
      // For now, return a success response since we're using predefined roles
      // In a full implementation, this would update custom roles in the database
      throw new Error('Updating system roles is not allowed. Only custom roles can be modified.');
    } catch (error) {
      console.error('Update role error:', error);
      throw error;
    }
  }

  async deleteRole(roleId) {
    try {
      // For now, return a success response since we're using predefined roles
      // In a full implementation, this would delete custom roles from the database
      throw new Error('Deleting system roles is not allowed. Only custom roles can be deleted.');
    } catch (error) {
      console.error('Delete role error:', error);
      throw error;
    }
  }

  async getUsersByRole(roleId) {
    try {
      const users = await User.find({ 
        role: roleId 
      }).select('_id firstName lastName email role createdAt');
      
      return users;
    } catch (error) {
      console.error('Get users by role error:', error);
      throw error;
    }
  }
}

export const storage = new MongoStorage();