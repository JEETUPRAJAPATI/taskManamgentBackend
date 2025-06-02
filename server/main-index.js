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

// Initialize sample data
async function initializeSampleData() {
  const { Organization, User, TaskStatus } = await import('./models.js');
  
  // Check if sample data already exists
  const existingOrg = await Organization.findOne();
  if (existingOrg) {
    console.log('Sample data already exists, skipping initialization.');
    return;
  }

  try {
    // Create sample organization
    const sampleOrg = new Organization({
      name: "TaskSetu Demo",
      slug: "tasksetu-demo",
      description: "Demo organization for TaskSetu platform"
    });
    await sampleOrg.save();

    // Create default task statuses
    const defaultStatuses = [
      { name: "To Do", color: "#6B7280", order: 0, isDefault: true, organization: sampleOrg._id },
      { name: "In Progress", color: "#3B82F6", order: 1, organization: sampleOrg._id },
      { name: "Review", color: "#F59E0B", order: 2, organization: sampleOrg._id },
      { name: "Done", color: "#10B981", order: 3, isCompleted: true, organization: sampleOrg._id },
    ];

    for (const status of defaultStatuses) {
      const taskStatus = new TaskStatus(status);
      await taskStatus.save();
    }

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
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