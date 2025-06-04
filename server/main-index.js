import express from "express";
import mongoose from "mongoose";
import { setupVite, serveStatic, log } from "./vite.js";
import { registerRoutes } from "./routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MongoDB connection
const connectToMongoDB = async () => {
  try {
    const mongoUri = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/TaskSetu';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB TaskSetu database');
    
    // Initialize sample data if needed
    await initializeSampleData();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize comprehensive sample data
async function initializeSampleData() {
  try {
    const { Organization, User, Project, Task, TaskStatus, Form, ProcessFlow, FormResponse } = await import('./models.js');
    
    // Clear existing data and regenerate comprehensive sample data
    try {
      await Organization.deleteMany({});
      await User.deleteMany({});
      await Project.deleteMany({});
      await Task.deleteMany({});
      await TaskStatus.deleteMany({});
      await Form.deleteMany({});
      console.log('Cleared existing data for regeneration');
    } catch (error) {
      console.log('No existing data to clear');
    }

    try {
    // Create sample organizations
    const organizations = [
      {
        name: "TechCorp Solutions",
        slug: "techcorp-solutions",
        description: "Leading technology solutions provider",
        settings: { timezone: "UTC", language: "en" }
      },
      {
        name: "Creative Design Studio",
        slug: "creative-design-studio", 
        description: "Premium design and branding agency",
        settings: { timezone: "PST", language: "en" }
      },
      {
        name: "Marketing Dynamics",
        slug: "marketing-dynamics",
        description: "Digital marketing and growth specialists",
        settings: { timezone: "EST", language: "en" }
      }
    ];

    const savedOrgs = [];
    for (const orgData of organizations) {
      const org = new Organization(orgData);
      await org.save();
      savedOrgs.push(org);
    }

    // Create sample users with different roles
    const bcrypt = await import('bcryptjs');
    const defaultPassword = await bcrypt.hash('demo123', 10);
    
    const users = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@techcorp.com",
        username: "johndoe",
        passwordHash: defaultPassword,
        organization: savedOrgs[0]._id,
        role: "admin",
        department: "Engineering",
        isActive: true
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@techcorp.com",
        username: "janesmith",
        passwordHash: defaultPassword,
        organization: savedOrgs[0]._id,
        role: "member",
        department: "Design",
        isActive: true
      },
      {
        firstName: "Mike",
        lastName: "Johnson",
        email: "mike.johnson@techcorp.com",
        username: "mikejohnson",
        passwordHash: defaultPassword,
        organization: savedOrgs[0]._id,
        role: "member",
        department: "Marketing",
        isActive: true
      },
      {
        firstName: "Sarah",
        lastName: "Wilson",
        email: "sarah.wilson@creative.com",
        username: "sarahwilson",
        passwordHash: defaultPassword,
        organization: savedOrgs[1]._id,
        role: "admin",
        department: "Creative",
        isActive: true
      },
      {
        firstName: "David",
        lastName: "Brown",
        email: "david.brown@creative.com",
        username: "davidbrown",
        passwordHash: defaultPassword,
        organization: savedOrgs[1]._id,
        role: "member",
        department: "Design",
        isActive: true
      },
      {
        firstName: "Emily",
        lastName: "Davis",
        email: "emily.davis@marketing.com",
        username: "emilydavis",
        passwordHash: defaultPassword,
        organization: savedOrgs[2]._id,
        role: "admin",
        department: "Marketing",
        isActive: true
      }
    ];

    const savedUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      savedUsers.push(user);
    }

    // Create projects for each organization
    const projects = [
      {
        name: "E-commerce Platform Redesign",
        description: "Complete overhaul of the online shopping experience",
        organization: savedOrgs[0]._id,
        owner: savedUsers[0]._id,
        status: "active",
        color: "#3B82F6"
      },
      {
        name: "Mobile App Development",
        description: "Native iOS and Android application",
        organization: savedOrgs[0]._id,
        owner: savedUsers[1]._id,
        status: "active",
        color: "#10B981"
      },
      {
        name: "Brand Identity Refresh",
        description: "Complete brand redesign and style guide",
        organization: savedOrgs[1]._id,
        owner: savedUsers[3]._id,
        status: "active",
        color: "#F59E0B"
      },
      {
        name: "Digital Marketing Campaign",
        description: "Q4 product launch marketing strategy",
        organization: savedOrgs[2]._id,
        owner: savedUsers[5]._id,
        status: "active",
        color: "#EF4444"
      }
    ];

    const savedProjects = [];
    for (const projectData of projects) {
      const project = new Project(projectData);
      await project.save();
      savedProjects.push(project);
    }

    // Create default task statuses for each organization
    for (const org of savedOrgs) {
      const defaultStatuses = [
        { name: "To Do", color: "#6B7280", order: 0, isDefault: true, organization: org._id },
        { name: "In Progress", color: "#3B82F6", order: 1, organization: org._id },
        { name: "Review", color: "#F59E0B", order: 2, organization: org._id },
        { name: "Completed", color: "#10B981", order: 3, isCompleted: true, organization: org._id }
      ];

      for (const status of defaultStatuses) {
        const taskStatus = new TaskStatus(status);
        await taskStatus.save();
      }
    }

    // Create comprehensive sample tasks
    const tasks = [
      {
        title: "Design user authentication flow",
        description: "Create wireframes and mockups for login and registration process",
        organization: savedOrgs[0]._id,
        project: savedProjects[0]._id,
        createdBy: savedUsers[0]._id,
        assignedTo: savedUsers[1]._id,
        status: "completed",
        priority: "high",
        dueDate: new Date('2024-06-15'),
        tags: ["design", "authentication", "ux"],
        progress: 100
      },
      {
        title: "Implement payment gateway integration",
        description: "Integrate Stripe payment system with backend API",
        organization: savedOrgs[0]._id,
        project: savedProjects[0]._id,
        createdBy: savedUsers[0]._id,
        assignedTo: savedUsers[0]._id,
        status: "in-progress",
        priority: "urgent",
        dueDate: new Date('2024-06-20'),
        tags: ["backend", "payment", "api"],
        progress: 75
      },
      {
        title: "Create product catalog interface",
        description: "Build responsive product listing and filtering components",
        organization: savedOrgs[0]._id,
        project: savedProjects[0]._id,
        createdBy: savedUsers[1]._id,
        assignedTo: savedUsers[1]._id,
        status: "review",
        priority: "medium",
        dueDate: new Date('2024-06-25'),
        tags: ["frontend", "catalog", "responsive"],
        progress: 90
      },
      {
        title: "Setup mobile app architecture",
        description: "Configure React Native project structure and navigation",
        organization: savedOrgs[0]._id,
        project: savedProjects[1]._id,
        createdBy: savedUsers[0]._id,
        assignedTo: savedUsers[0]._id,
        status: "todo",
        priority: "high",
        dueDate: new Date('2024-07-01'),
        tags: ["mobile", "react-native", "architecture"],
        progress: 0
      },
      {
        title: "Logo design concepts",
        description: "Create 5 different logo concepts for client review",
        organization: savedOrgs[1]._id,
        project: savedProjects[2]._id,
        createdBy: savedUsers[3]._id,
        assignedTo: savedUsers[4]._id,
        status: "completed",
        priority: "medium",
        dueDate: new Date('2024-06-10'),
        tags: ["branding", "logo", "concepts"],
        progress: 100
      },
      {
        title: "Brand color palette",
        description: "Develop comprehensive color system for all brand materials",
        organization: savedOrgs[1]._id,
        project: savedProjects[2]._id,
        createdBy: savedUsers[3]._id,
        assignedTo: savedUsers[4]._id,
        status: "in-progress",
        priority: "medium",
        dueDate: new Date('2024-06-18'),
        tags: ["branding", "colors", "palette"],
        progress: 60
      },
      {
        title: "Social media campaign strategy",
        description: "Plan and execute Q4 social media marketing campaign",
        organization: savedOrgs[2]._id,
        project: savedProjects[3]._id,
        createdBy: savedUsers[5]._id,
        assignedTo: savedUsers[5]._id,
        status: "in-progress",
        priority: "high",
        dueDate: new Date('2024-06-30'),
        tags: ["marketing", "social-media", "strategy"],
        progress: 40
      },
      {
        title: "Email marketing automation",
        description: "Setup automated email sequences for lead nurturing",
        organization: savedOrgs[2]._id,
        project: savedProjects[3]._id,
        createdBy: savedUsers[5]._id,
        assignedTo: savedUsers[5]._id,
        status: "todo",
        priority: "medium",
        dueDate: new Date('2024-07-05'),
        tags: ["email", "automation", "leads"],
        progress: 0
      }
    ];

    for (const taskData of tasks) {
      const task = new Task(taskData);
      await task.save();
    }

    console.log('Comprehensive sample data initialized successfully');
    console.log(`Created ${savedOrgs.length} organizations, ${savedUsers.length} users, ${savedProjects.length} projects, and ${tasks.length} tasks`);
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  } catch (error) {
    console.error('Critical error in sample data initialization:', error);
  }
}

(async () => {
  await connectToMongoDB();
  
  const server = await registerRoutes(app);

  // Important: This setup is for production. In development, Vite will handle HMR.
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const PORT = Number(process.env.PORT) || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`TaskSetu Server running on port ${PORT}`);
  });
})();