import express from "express";
import mongoose from "mongoose";
import { setupVite, serveStatic, log } from "./vite.js";
import { registerRoutes } from "./routes.js";
import {
  Organization,
  User,
  Project,
  Task,
  TaskStatus,
  Form,
  ProcessFlow,
  FormResponse
} from "./models.js";
import cors from "cors";
const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "https://taskmanagement.techizebuilder.com",
  "https://taskmanamgentbackend.onrender.com"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // Handle preflight
  }

  next();
});

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
    // Check if sample data already exists
    const existingOrgs = await Organization.countDocuments();
    if (existingOrgs > 0) {
      console.log('Sample data already exists, skipping initialization');
      return;
    }

    console.log('Initializing sample data...');

    // ... rest of your initialization code remains the same ...
    // Just make sure you're not using any require() statements

  } catch (error) {
    console.error('Critical error in sample data initialization:', error);
  }
}

(async () => {
  await connectToMongoDB();

  const server = await registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const PORT = Number(process.env.PORT) || 5000;
  server.listen(PORT, "0.0.0.0", (err) => {
    if (err) {
      console.error(`Failed to start server on port ${PORT}:`, err);
      process.exit(1);
    }
    log(`TaskSetu Server running on port ${PORT}`);
  });
})();